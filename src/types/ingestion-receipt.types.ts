export type IngestionOutcome = 'accepted' | 'partial' | 'rejected';

export type IngestionRejectionReason = 'session_band' | 'event_guardrail' | 'project_paused' | 'account_closed';

export interface IngestionReceipt {
  outcome: IngestionOutcome;
  accepted: number;
  duplicates: number;
  dropped: number;
  reason?: IngestionRejectionReason;
  retryAt?: string;
  coverage: 'complete' | 'partial';
}

export const INGESTION_REJECTION_REASONS: readonly IngestionRejectionReason[] = [
  'session_band',
  'event_guardrail',
  'project_paused',
  'account_closed',
];

export function isIngestionRejectionReason(value: unknown): value is IngestionRejectionReason {
  return INGESTION_REJECTION_REASONS.includes(value as IngestionRejectionReason);
}

/**
 * Parses the additive receipt while remaining compatible with legacy boolean/empty bodies.
 *
 * Structural strictness is the only thing standing between a receipt and the claims it makes
 * about TraceLog's own records (`dropped`, `account_closed`), so every field is checked against
 * the wire contract and an unknown `reason` degrades to `undefined` rather than passing through.
 * Callers reading a receipt off a rejection must additionally prove the responder is TraceLog —
 * see `readTraceLogResponseMetadata` in `SenderManager`.
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

  const reason = isIngestionRejectionReason(body.reason) ? body.reason : undefined;

  return {
    outcome: body.outcome,
    accepted,
    duplicates,
    dropped,
    ...(reason ? { reason } : {}),
    ...(typeof body.retryAt === 'string' ? { retryAt: body.retryAt } : {}),
    coverage: body.coverage,
  };
}
