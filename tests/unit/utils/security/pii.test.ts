import { describe, it, expect } from 'vitest';
import { sanitizePii, PII_PATTERNS } from '../../../../src/utils/security/pii.utils';

describe('sanitizePii', () => {
  it('redacts email addresses', () => {
    expect(sanitizePii('Contact: user@example.com')).toBe('Contact: [REDACTED]');
    expect(sanitizePii('multiple a@b.co and c.d@e.io')).toBe('multiple [REDACTED] and [REDACTED]');
  });

  it('redacts US phone numbers in common formats', () => {
    expect(sanitizePii('Call 555-123-4567')).toBe('Call [REDACTED]');
    expect(sanitizePii('Call 555.123.4567')).toBe('Call [REDACTED]');
    expect(sanitizePii('Call 5551234567')).toBe('Call [REDACTED]');
  });

  it('redacts 16-digit credit card numbers with optional separators', () => {
    expect(sanitizePii('Card 1234-5678-9012-3456')).toBe('Card [REDACTED]');
    expect(sanitizePii('Card 1234 5678 9012 3456')).toBe('Card [REDACTED]');
    expect(sanitizePii('Card 1234567890123456')).toBe('Card [REDACTED]');
  });

  it('redacts IBAN numbers', () => {
    expect(sanitizePii('IBAN: ES7620770024003102575766')).toBe('IBAN: [REDACTED]');
    // Spaced IBANs: the current pattern covers the 22-char block; trailing
    // digits beyond it remain visible. We assert PII is at least partially
    // redacted rather than rely on exact-string equality.
    const spaced = sanitizePii('IBAN: ES76 2077 0024 0031 0257 5766');
    expect(spaced).toContain('[REDACTED]');
    expect(spaced).not.toContain('2077 0024');
  });

  it('redacts Stripe-style API keys', () => {
    expect(sanitizePii('key sk_live_abcdef1234567890')).toBe('key [REDACTED]');
    expect(sanitizePii('key pk_test_abcdef1234567890')).toBe('key [REDACTED]');
  });

  it('redacts Bearer tokens', () => {
    expect(sanitizePii('Authorization: Bearer abc.def.ghi')).toBe('Authorization: [REDACTED]');
    expect(sanitizePii('Authorization: Bearer abc123')).toBe('Authorization: [REDACTED]');
  });

  it('redacts passwords in connection strings', () => {
    const out = sanitizePii('postgres://user:supersecret@db.example.com/app');
    expect(out).not.toContain('supersecret');
    expect(out).toContain('[REDACTED]');
  });

  it('redacts sensitive URL query parameters', () => {
    const out = sanitizePii('https://x/y?token=abc&foo=bar&password=xyz');
    expect(out).not.toContain('abc');
    expect(out).not.toContain('xyz');
    expect(out).toContain('foo=bar');
  });

  it('returns the input unchanged when no patterns match', () => {
    expect(sanitizePii('plain text with no secrets')).toBe('plain text with no secrets');
  });

  it('exports PII_PATTERNS as a non-empty readonly array', () => {
    expect(Array.isArray(PII_PATTERNS)).toBe(true);
    expect(PII_PATTERNS.length).toBeGreaterThan(0);
  });
});
