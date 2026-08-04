import { describe, expect, it } from 'vitest';
import { parseIngestionReceipt } from '../../../src/types/ingestion-receipt.types';

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
      dropped: 4,
      reason: 'session_band',
      retryAt: '2026-09-01T00:00:00.000Z',
      coverage: 'partial',
    });
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
});
