import { describe, expect, it } from 'vitest';
import {
  INGESTION_REJECTION_REASONS,
  isIngestionRejectionReason,
  parseCollectReceipt,
  parseIngestionReceipt,
} from '../../../src/types/ingestion-receipt.types';

describe('parseIngestionReceipt', () => {
  it('accepts the stable receipt fields and ignores additive envelope metadata', () => {
    expect(
      parseIngestionReceipt({
        statusCode: 402,
        currentPlan: 'PRO',
        outcome: 'rejected',
        accepted: 0,
        duplicates: 0,
        dropped: 4,
        reason: 'session_band',
        retryAt: '2026-09-01T00:00:00.000Z',
        coverage: 'partial',
      }),
    ).toEqual({
      outcome: 'rejected',
      accepted: 0,
      duplicates: 0,
      // Absent upstream: this middleware predates `filtered`, or the API (which never filters
      // intentionally) answered directly. Both mean zero.
      filtered: 0,
      dropped: 4,
      reason: 'session_band',
      retryAt: '2026-09-01T00:00:00.000Z',
      coverage: 'partial',
    });
  });

  it('reads filtered when the edge reports it, keeping the batch reconcilable', () => {
    // 10 submitted: 6 stored, 1 already known, 2 excluded by the project's own config, 1 lost.
    const parsed = parseIngestionReceipt({
      outcome: 'partial',
      accepted: 6,
      duplicates: 1,
      filtered: 2,
      dropped: 1,
      coverage: 'partial',
    });

    expect(parsed).toMatchObject({ filtered: 2, dropped: 1 });
    expect(parsed!.accepted + parsed!.duplicates + parsed!.filtered + parsed!.dropped).toBe(10);
  });

  it('voids the receipt when filtered is present but malformed', () => {
    // Present-and-wrong is a contract violation; only absent may default to zero.
    expect(
      parseIngestionReceipt({
        outcome: 'accepted',
        accepted: 1,
        duplicates: 0,
        filtered: -2,
        dropped: 0,
        coverage: 'complete',
      }),
    ).toBeNull();
  });

  // Each entry pins one clause of the parser. A receipt states how much of a merchant's traffic
  // was refused, so every clause that stands between a malformed body and that claim needs a case
  // holding it in place — a bounds check nothing exercises is a bounds check free to regress.
  it.each([
    null,
    true,
    {},
    // Counter clauses: `typeof === 'number'`, `Number.isInteger`, and `>= 0`, each on its own.
    { outcome: 'accepted', accepted: -1, duplicates: 0, dropped: 0, coverage: 'complete' },
    { outcome: 'partial', accepted: 1, duplicates: -1, dropped: 1, coverage: 'partial' },
    { outcome: 'partial', accepted: 1, duplicates: 0, dropped: -1, coverage: 'partial' },
    { outcome: 'accepted', accepted: 1.5, duplicates: 0, dropped: 0, coverage: 'complete' },
    { outcome: 'accepted', accepted: 1, duplicates: 0, dropped: Number.POSITIVE_INFINITY, coverage: 'complete' },
    { outcome: 'accepted', accepted: 1, duplicates: Number.NaN, dropped: 0, coverage: 'complete' },
    { outcome: 'accepted', accepted: '1', duplicates: 0, dropped: 0, coverage: 'complete' },
    // A counter the body never sent at all — absent is only tolerated for `filtered`.
    { outcome: 'accepted', accepted: 1, duplicates: 0, coverage: 'complete' },
    // Literal-union clauses: both are closed sets, and neither may be absent.
    { outcome: 'unknown', accepted: 1, duplicates: 0, dropped: 0, coverage: 'complete' },
    { outcome: 'accepted', accepted: 1, duplicates: 0, dropped: 0, coverage: 'unknown' },
    { outcome: 'accepted', accepted: 1, duplicates: 0, dropped: 0 },
  ])('returns null for a legacy or malformed body', (body) => {
    expect(parseIngestionReceipt(body)).toBeNull();
  });

  it('ignores a retryAt that is not a string rather than voiding the receipt', () => {
    // `retryAt` is optional metadata, not a counter — a malformed one costs a retry hint, while
    // voiding the whole receipt would also discard the `dropped` count the caller needs.
    const parsed = parseIngestionReceipt({
      outcome: 'rejected',
      accepted: 0,
      duplicates: 0,
      dropped: 3,
      retryAt: 1_759_000_000_000,
      coverage: 'partial',
    });

    expect(parsed).toMatchObject({ dropped: 3 });
    expect(parsed).not.toHaveProperty('retryAt');
  });

  it('drops an unrecognised reason rather than passing it through', () => {
    const parsed = parseIngestionReceipt({
      outcome: 'rejected',
      accepted: 0,
      duplicates: 0,
      dropped: 1,
      reason: 'something_new',
      coverage: 'partial',
    });

    expect(parsed).not.toBeNull();
    expect(parsed).not.toHaveProperty('reason');
  });

  // The wire contract is shared with tracelog-api and tracelog-middleware; a rename on one side
  // silently degrades the reason to `undefined` on the others rather than failing loudly.
  it.each([...INGESTION_REJECTION_REASONS])('accepts the shared wire reason %s', (reason) => {
    expect(isIngestionRejectionReason(reason)).toBe(true);
    expect(
      parseIngestionReceipt({
        outcome: 'rejected',
        accepted: 0,
        duplicates: 0,
        dropped: 1,
        reason,
        coverage: 'partial',
      }),
    ).toMatchObject({ reason });
  });

  it('pins the reason set to the api/middleware contract', () => {
    expect([...INGESTION_REJECTION_REASONS]).toEqual([
      'session_band',
      'event_guardrail',
      'project_paused',
      'account_paused',
    ]);
  });
});

describe('parseCollectReceipt', () => {
  const ok = { ok: true, status: 200 };
  const rejected = { ok: false, status: 400 };

  const receipt = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
    outcome: 'partial',
    accepted: 1,
    duplicates: 0,
    filtered: 0,
    dropped: 1,
    coverage: 'partial',
    ...over,
  });

  it('returns a well-formed receipt off a 2xx without requiring an envelope signature', () => {
    expect(parseCollectReceipt(receipt(), ok)).toMatchObject({ accepted: 1, dropped: 1 });
  });

  it('requires the envelope signature on a rejection', () => {
    const refusal = receipt({ outcome: 'rejected', accepted: 0, dropped: 2 });

    expect(parseCollectReceipt(refusal, rejected)).toBeNull();
    expect(parseCollectReceipt({ statusCode: 400, ...refusal }, rejected)).toMatchObject({ dropped: 2 });
  });

  // An upstream layer that loses track of the batch it is answering emits all-zero counters. The
  // client never submits an empty batch, so such a body is never describing the request it answers,
  // and its `accepted: 0` would otherwise read as "nothing stored".
  it('rejects a receipt that accounts for no events at all', () => {
    const empty = { outcome: 'accepted', accepted: 0, duplicates: 0, filtered: 0, dropped: 0, coverage: 'complete' };

    // Structurally valid — the shared wire parser accepts it, which is exactly why the client
    // cannot rely on that parser alone.
    expect(parseIngestionReceipt(empty)).not.toBeNull();
    expect(parseCollectReceipt(empty, ok)).toBeNull();
    expect(parseCollectReceipt({ statusCode: 400, ...empty }, rejected)).toBeNull();
  });

  // The dangerous direction: `outcome`/`coverage` are derived from `dropped` server-side, so a
  // refusal carrying `dropped: 0` arrives asserting the batch was accepted and complete. Quoting it
  // would tell a merchant that events the server just refused were stored intact.
  it('rejects a refusal whose receipt reports no loss', () => {
    const contradiction = {
      statusCode: 400,
      ...receipt({ outcome: 'accepted', accepted: 5, dropped: 0, coverage: 'complete' }),
    };

    expect(parseIngestionReceipt(contradiction)).not.toBeNull();
    expect(parseCollectReceipt(contradiction, rejected)).toBeNull();
    // The same body on a 2xx is coherent — nothing was refused, so nothing is being contradicted.
    expect(parseCollectReceipt(contradiction, ok)).toMatchObject({ accepted: 5, dropped: 0 });
  });
});
