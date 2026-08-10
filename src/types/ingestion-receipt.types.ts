export type IngestionOutcome = 'accepted' | 'partial' | 'rejected';

/**
 * Every reason ingestion can be refused. Must match the server vocabulary exactly — a value missing
 * here is not rejected loudly, it degrades to `undefined` in {@link parseIngestionReceipt}, so the
 * refusal arrives with no explanation at all.
 *
 * There is deliberately no `account_closed`: closing an account marks its projects `deleting`
 * first, and that is refused upstream as a 404 long before ingestion decides anything.
 */
export type IngestionRejectionReason = 'session_band' | 'event_guardrail' | 'project_paused' | 'account_paused';

/**
 * What the server did with a submitted batch. Every event lands in exactly one counter, so a
 * receipt reconciles against what was sent:
 *
 * ```
 * submitted === accepted + duplicates + filtered + dropped
 * ```
 *
 * `filtered` and `dropped` both remove events from the stored set, and the difference is the whole
 * point: `filtered` is the project's own configuration (sampling, excluded event types or URL
 * paths) plus the shapes a newer library no longer sends — expected, permanent, not a defect.
 * `dropped` is data refused against the caller's intent, and is the only counter that means loss.
 * `coverage` therefore keys on `dropped` alone.
 */
export interface IngestionReceipt {
  outcome: IngestionOutcome;
  accepted: number;
  duplicates: number;
  /** Intentionally excluded by configuration or wire contract. Never data loss. */
  filtered: number;
  /** Refused against the caller's intent. The only counter that means data loss. */
  dropped: number;
  reason?: IngestionRejectionReason;
  retryAt?: string;
  coverage: 'complete' | 'partial';
}

export const INGESTION_REJECTION_REASONS: readonly IngestionRejectionReason[] = [
  'session_band',
  'event_guardrail',
  'project_paused',
  'account_paused',
];

export function isIngestionRejectionReason(value: unknown): value is IngestionRejectionReason {
  return INGESTION_REJECTION_REASONS.includes(value as IngestionRejectionReason);
}

/**
 * Whether a body carries the ingest error envelope's signature — `statusCode` echoing the HTTP
 * status — and with it the proof that a TraceLog host produced the response.
 *
 * tracelog-middleware's `AllExceptionsFilter` renders every rejection as
 * `{ statusCode, error, message, timestamp, path, ...receipt }`, so on a non-2xx the receipt and
 * the signature always arrive together. A generic `{"error":"Not Found"}` from a parked page, a
 * captive portal, or a CDN backend answering the collect URL cannot produce the pairing.
 *
 * Shared by every sender on purpose: a receipt states how much of a merchant's traffic was
 * dropped and why, so the rule for trusting one must not differ per transport.
 */
export function hasIngestEnvelopeSignature(value: unknown, httpStatus: number): boolean {
  return typeof value === 'object' && value !== null && (value as Record<string, unknown>).statusCode === httpStatus;
}

/**
 * Parses the additive receipt while remaining compatible with legacy boolean/empty bodies.
 *
 * Structural strictness is the only thing standing between a receipt and the claims it makes
 * about TraceLog's own records (`dropped`, `account_paused`), so every field is checked against
 * the wire contract and an unknown `reason` degrades to `undefined` rather than passing through.
 * Callers reading a receipt off a rejection must additionally prove the responder is TraceLog —
 * see `readTraceLogResponseMetadata` in `SenderManager`.
 *
 * `filtered` is the one tolerant field: a middleware predating it sends nothing, and the API never
 * filters intentionally so it never sends one either. Absent means zero, which is what both mean.
 * The library is distributed and long-lived, so it must keep parsing receipts from an older edge.
 */
export function parseIngestionReceipt(value: unknown): IngestionReceipt | null {
  if (typeof value !== 'object' || value === null) return null;
  const body = value as Record<string, unknown>;
  if (body.outcome !== 'accepted' && body.outcome !== 'partial' && body.outcome !== 'rejected') return null;
  if (body.coverage !== 'complete' && body.coverage !== 'partial') return null;

  const count = (candidate: unknown): number | null =>
    typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0 ? candidate : null;
  const accepted = count(body.accepted);
  const duplicates = count(body.duplicates);
  const dropped = count(body.dropped);
  if (accepted === null || duplicates === null || dropped === null) return null;

  const filtered = body.filtered === undefined ? 0 : count(body.filtered);
  if (filtered === null) return null;

  const reason = isIngestionRejectionReason(body.reason) ? body.reason : undefined;

  return {
    outcome: body.outcome,
    accepted,
    duplicates,
    filtered,
    dropped,
    ...(reason ? { reason } : {}),
    ...(typeof body.retryAt === 'string' ? { retryAt: body.retryAt } : {}),
    coverage: body.coverage,
  };
}

/**
 * Reads a receipt off a collect response, applying the checks that depend on the RESPONSE rather
 * than on the body's shape. Every sender goes through this; nothing calls
 * {@link parseIngestionReceipt} directly.
 *
 * The split is deliberate. {@link parseIngestionReceipt} is the structural wire contract, mirrored
 * near-verbatim by tracelog-middleware and tracelog-api, and keeping the three comparable is what
 * stops the shape from drifting. The two checks below are the *client's* own scepticism about a
 * body it did not write, and they depend on facts only this side knows — so layering them here
 * keeps the shared half shared.
 *
 * A receipt that survives all of this is one the caller may quote to a merchant. A `null` means
 * exactly "no information", and must never be read as "nothing was ingested".
 */
export function parseCollectReceipt(body: unknown, response: { ok: boolean; status: number }): IngestionReceipt | null {
  // Provenance, rejections only: a receipt riding on a refusal must prove a TraceLog host wrote it.
  // A 2xx needs no signature — the status already established that the responder accepted the batch.
  if (!response.ok && !hasIngestEnvelopeSignature(body, response.status)) return null;

  const receipt = parseIngestionReceipt(body);
  if (!receipt) return null;

  // A receipt that accounts for NO events is not describing this batch. The client never submits an
  // empty one — `EventManager` returns early on an empty queue or an empty send plan, and
  // `SenderManager` discards an empty persisted batch rather than recovering it — so every response
  // it reads answers a batch that had events in it. An all-zero body therefore comes from a layer
  // that lost track of what it was answering, and its `accepted: 0` would read as "nothing stored".
  if (receipt.accepted + receipt.duplicates + receipt.filtered + receipt.dropped === 0) return null;

  // A refusal that refused nothing is a contradiction, and the dangerous direction of one: the
  // server derives `outcome` and `coverage` from `dropped`, so a rejection carrying `dropped: 0`
  // arrives claiming `accepted` / `complete`. Quoting that would tell a merchant a batch the server
  // just refused was stored intact — strictly worse than reporting no receipt at all.
  if (!response.ok && receipt.dropped === 0) return null;

  return receipt;
}
