/**
 * Click-IDs Tests
 * Focus: ad-network click identifier capture from the landing URL
 */

import { describe, it, expect, afterEach } from 'vitest';
import { getClickIds } from '../../../../src/utils/browser/click-ids.utils';

describe('getClickIds', () => {
  const originalLocation = window.location;

  const setSearch = (search: string): void => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search },
      writable: true,
      configurable: true,
    });
  };

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('returns undefined when no click-ids are present', () => {
    setSearch('?utm_source=newsletter&foo=bar');
    expect(getClickIds()).toBeUndefined();
  });

  it('returns undefined for an empty query string', () => {
    setSearch('');
    expect(getClickIds()).toBeUndefined();
  });

  it('captures gclid alone', () => {
    setSearch('?gclid=abc123');
    expect(getClickIds()).toEqual({ gclid: 'abc123' });
  });

  it.each(['gbraid', 'wbraid', 'fbclid', 'ttclid'] as const)('captures %s independently', (param) => {
    setSearch(`?${param}=xyz`);
    expect(getClickIds()).toEqual({ [param]: 'xyz' });
  });

  it('captures multiple click-ids and ignores unrelated params', () => {
    setSearch('?gclid=g1&fbclid=f1&utm_medium=cpc');
    expect(getClickIds()).toEqual({ gclid: 'g1', fbclid: 'f1' });
  });

  it('ignores click-id params with empty values', () => {
    setSearch('?gclid=&fbclid=f1');
    expect(getClickIds()).toEqual({ fbclid: 'f1' });
  });
});
