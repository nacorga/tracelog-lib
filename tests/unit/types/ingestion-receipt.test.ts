import { describe, expect, it } from 'vitest';
import {
  INGESTION_REJECTION_REASONS,
  isIngestionRejectionReason,
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
