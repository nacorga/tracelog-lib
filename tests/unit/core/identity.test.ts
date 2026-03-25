/**
 * Identity API Tests
 * Focus: identify() and resetIdentity() public API methods
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import * as api from '../../../src/api';
import { destroy } from '../../../src/api';
import { PENDING_IDENTITY_KEY } from '../../../src/constants/storage.constants';

describe('Public API - identify()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors during cleanup
    }
  });

  it('should expose identify method globally', () => {
    expect(api.identify).toBeDefined();
    expect(typeof api.identify).toBe('function');
  });

  it('should persist identity to localStorage before init', () => {
    api.identify('cust_123', { name: 'Maria' });

    const stored = localStorage.getItem(PENDING_IDENTITY_KEY);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.userId).toBe('cust_123');
    expect(parsed.traits).toEqual({ name: 'Maria' });
  });

  it('should persist identity without traits before init', () => {
    api.identify('cust_123');

    const stored = localStorage.getItem(PENDING_IDENTITY_KEY);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.userId).toBe('cust_123');
    expect(parsed.traits).toBeUndefined();
  });

  it('should trim userId', () => {
    api.identify('  cust_123  ');

    const stored = localStorage.getItem(PENDING_IDENTITY_KEY);
    const parsed = JSON.parse(stored!);
    expect(parsed.userId).toBe('cust_123');
  });

  it('should reject empty userId', () => {
    api.identify('');

    const stored = localStorage.getItem(PENDING_IDENTITY_KEY);
    expect(stored).toBeNull();
  });

  it('should reject whitespace-only userId', () => {
    api.identify('   ');

    const stored = localStorage.getItem(PENDING_IDENTITY_KEY);
    expect(stored).toBeNull();
  });

  it('should reject userId exceeding 256 characters', () => {
    const longId = 'a'.repeat(257);
    api.identify(longId);

    const stored = localStorage.getItem(PENDING_IDENTITY_KEY);
    expect(stored).toBeNull();
  });

  it('should accept userId at exactly 256 characters', () => {
    const maxId = 'a'.repeat(256);
    api.identify(maxId);

    const stored = localStorage.getItem(PENDING_IDENTITY_KEY);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.userId).toBe(maxId);
  });

  it('should delegate to App when initialized', async () => {
    await api.init();

    api.identify('cust_456', { plan: 'pro' });

    // Should not use pending key when initialized
    const pending = localStorage.getItem(PENDING_IDENTITY_KEY);
    expect(pending).toBeNull();
  });

  it('should overwrite previous pending identity (last-write-wins)', () => {
    api.identify('first_user');
    api.identify('second_user', { role: 'admin' });

    const stored = localStorage.getItem(PENDING_IDENTITY_KEY);
    const parsed = JSON.parse(stored!);
    expect(parsed.userId).toBe('second_user');
    expect(parsed.traits).toEqual({ role: 'admin' });
  });

  it('should skip empty traits object', () => {
    api.identify('cust_123', {});

    const stored = localStorage.getItem(PENDING_IDENTITY_KEY);
    const parsed = JSON.parse(stored!);
    expect(parsed.traits).toBeUndefined();
  });

  it('should handle localStorage unavailable gracefully', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // Should not throw
    expect(() => {
      api.identify('cust_123');
    }).not.toThrow();
  });
});

describe('Public API - resetIdentity()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors during cleanup
    }
  });

  it('should expose resetIdentity method globally', () => {
    expect(api.resetIdentity).toBeDefined();
    expect(typeof api.resetIdentity).toBe('function');
  });

  it('should clear pending identity when called before init', async () => {
    api.identify('cust_123');
    expect(localStorage.getItem(PENDING_IDENTITY_KEY)).not.toBeNull();

    await api.resetIdentity();
    expect(localStorage.getItem(PENDING_IDENTITY_KEY)).toBeNull();
  });

  it('should not throw when called before init with no pending identity', async () => {
    await expect(api.resetIdentity()).resolves.not.toThrow();
  });

  it('should return a Promise', () => {
    const result = api.resetIdentity();
    expect(result).toBeInstanceOf(Promise);
  });

  it('should reset identity after init', async () => {
    await api.init();
    api.identify('cust_123');

    await expect(api.resetIdentity()).resolves.not.toThrow();
  });
});
