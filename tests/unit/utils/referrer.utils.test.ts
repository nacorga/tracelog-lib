import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getExternalReferrer } from '../../../src/utils/browser/referrer.utils';

describe('referrer.utils - getExternalReferrer()', () => {
  let originalReferrer: string;
  let originalLocation: Location;

  beforeEach(() => {
    originalReferrer = document.referrer;
    originalLocation = window.location;
  });

  afterEach(() => {
    Object.defineProperty(document, 'referrer', {
      value: originalReferrer,
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
      writable: true,
    });
  });

  it('should return "Direct" when referrer is empty', () => {
    Object.defineProperty(document, 'referrer', {
      value: '',
      configurable: true,
    });

    const result = getExternalReferrer();
    expect(result).toBe('Direct');
  });

  it('should return external referrer when domain is different', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://google.com/search?q=test',
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'example.com' },
      configurable: true,
    });

    const result = getExternalReferrer();
    expect(result).toBe('https://google.com/search?q=test');
  });

  it('should return "Direct" when referrer is same domain', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://example.com/other-page',
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'example.com' },
      configurable: true,
    });

    const result = getExternalReferrer();
    expect(result).toBe('Direct');
  });

  it('should return "Direct" when referrer is subdomain of current', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://www.example.com/page',
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'example.com' },
      configurable: true,
    });

    const result = getExternalReferrer();
    expect(result).toBe('Direct');
  });

  it('should return "Direct" when current is subdomain of referrer', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://example.com/page',
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'blog.example.com' },
      configurable: true,
    });

    const result = getExternalReferrer();
    expect(result).toBe('Direct');
  });

  it('should return "Direct" for cross-subdomain navigation', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://www.example.com/page',
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'blog.example.com' },
      configurable: true,
    });

    const result = getExternalReferrer();
    expect(result).toBe('Direct');
  });

  it('should handle case-insensitive hostname comparison', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://EXAMPLE.COM/page',
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'example.com' },
      configurable: true,
    });

    const result = getExternalReferrer();
    expect(result).toBe('Direct');
  });

  it('should return referrer when URL parsing fails', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'invalid-url-without-protocol',
      configurable: true,
    });

    const result = getExternalReferrer();
    expect(result).toBe('invalid-url-without-protocol');
  });

  it('should handle compound TLDs correctly (co.uk)', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://www.example.co.uk/page',
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'shop.example.co.uk' },
      configurable: true,
    });

    const result = getExternalReferrer();
    expect(result).toBe('Direct');
  });

  it('should detect different domains with same TLD', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://other-site.co.uk/page',
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'example.co.uk' },
      configurable: true,
    });

    const result = getExternalReferrer();
    expect(result).toBe('https://other-site.co.uk/page');
  });
});
