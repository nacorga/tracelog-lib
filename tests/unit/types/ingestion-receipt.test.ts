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

  it.each([
    null,
    true,
    {},
    { outcome: 'accepted', accepted: -1, duplicates: 0, dropped: 0, coverage: 'complete' },
    { outcome: 'unknown', accepted: 1, duplicates: 0, dropped: 0, coverage: 'complete' },
  ])('returns null for a legacy or malformed body', (body) => {
    expect(parseIngestionReceipt(body)).toBeNull();
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
