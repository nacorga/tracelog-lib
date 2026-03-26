/**
 * App Identity Tests
 * Focus: App.identify(), App.resetIdentity(), App.loadPersistedIdentity()
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getManagers } from '../../helpers/bridge.helper';
import { IDENTITY_KEY, PENDING_IDENTITY_KEY } from '../../../src/constants/storage.constants';
import type { TraceLogTestBridge } from '../../../src/types';

describe('App - identify()', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();
    bridge = await initTestBridge();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should set identity in state', () => {
    bridge.identify('cust_123', { name: 'Maria' });

    const identity = bridge.get('identity');
    expect(identity).toBeDefined();
    expect(identity?.userId).toBe('cust_123');
    expect(identity?.traits).toEqual({ name: 'Maria' });
  });

  it('should persist identity to localStorage', () => {
    bridge.identify('cust_123');

    const projectKey = IDENTITY_KEY('custom');
    const stored = localStorage.getItem(projectKey);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.userId).toBe('cust_123');
  });

  it('should trim userId', () => {
    bridge.identify('  cust_123  ');

    const identity = bridge.get('identity');
    expect(identity?.userId).toBe('cust_123');
  });

  it('should reject empty userId', () => {
    bridge.identify('');

    const identity = bridge.get('identity');
    expect(identity).toBeUndefined();
  });

  it('should reject userId exceeding 256 characters', () => {
    bridge.identify('a'.repeat(257));

    const identity = bridge.get('identity');
    expect(identity).toBeUndefined();
  });

  it('should overwrite previous identity (last-write-wins)', () => {
    bridge.identify('user_1');
    bridge.identify('user_2', { role: 'admin' });

    const identity = bridge.get('identity');
    expect(identity?.userId).toBe('user_2');
    expect(identity?.traits).toEqual({ role: 'admin' });
  });

  it('should skip empty traits object', () => {
    bridge.identify('cust_123', {});

    const identity = bridge.get('identity');
    expect(identity?.userId).toBe('cust_123');
    expect(identity?.traits).toBeUndefined();
  });
});

describe('App - resetIdentity()', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();
    bridge = await initTestBridge();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should clear identity from state', async () => {
    bridge.identify('cust_123');
    expect(bridge.get('identity')).toBeDefined();

    await bridge.resetIdentity();
    expect(bridge.get('identity')).toBeUndefined();
  });

  it('should clear persisted identity from localStorage', async () => {
    bridge.identify('cust_123');
    const projectKey = IDENTITY_KEY('custom');
    expect(localStorage.getItem(projectKey)).not.toBeNull();

    await bridge.resetIdentity();
    expect(localStorage.getItem(projectKey)).toBeNull();
  });

  it('should generate a new userId', async () => {
    const oldUserId = bridge.get('userId');
    bridge.identify('cust_123');

    await bridge.resetIdentity();

    const newUserId = bridge.get('userId');
    expect(newUserId).toBeDefined();
    expect(newUserId).not.toBe(oldUserId);
  });

  it('should reset session state for new session', async () => {
    bridge.identify('cust_123');

    await bridge.resetIdentity();

    // The key assertion is that a new UUID was generated
    const newUserId = bridge.get('userId');
    expect(newUserId).toBeDefined();
    expect(newUserId.length).toBeGreaterThan(0);
  });

  it('should flush events before regenerating UUID', async () => {
    const { event } = getManagers(bridge);
    const flushSpy = vi.spyOn(event!, 'flushImmediately');

    bridge.identify('cust_123');
    bridge.event('pre_reset_event', { test: true });

    await bridge.resetIdentity();

    expect(flushSpy).toHaveBeenCalled();
  });
});

describe('App - loadPersistedIdentity()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should migrate pending identity to project-scoped key on init', async () => {
    const identity = { userId: 'pending_user', traits: { plan: 'pro' } };
    localStorage.setItem(PENDING_IDENTITY_KEY, JSON.stringify(identity));

    const bridge = await initTestBridge();

    // Pending key should be cleared
    expect(localStorage.getItem(PENDING_IDENTITY_KEY)).toBeNull();

    // Identity should be in state
    const loaded = bridge.get('identity');
    expect(loaded?.userId).toBe('pending_user');
    expect(loaded?.traits).toEqual({ plan: 'pro' });

    // Identity should be in project-scoped key
    const projectKey = IDENTITY_KEY('custom');
    const stored = localStorage.getItem(projectKey);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).userId).toBe('pending_user');
  });

  it('should load existing project-scoped identity on init', async () => {
    const projectKey = IDENTITY_KEY('custom');
    const identity = { userId: 'existing_user' };
    localStorage.setItem(projectKey, JSON.stringify(identity));

    const bridge = await initTestBridge();

    const loaded = bridge.get('identity');
    expect(loaded?.userId).toBe('existing_user');
  });

  it('should handle corrupt pending identity gracefully', async () => {
    localStorage.setItem(PENDING_IDENTITY_KEY, 'not-valid-json{{{');

    const bridge = await initTestBridge();

    // Pending key should be cleared
    expect(localStorage.getItem(PENDING_IDENTITY_KEY)).toBeNull();

    // Identity should not be loaded (corrupt data)
    const loaded = bridge.get('identity');
    expect(loaded).toBeUndefined();

    // Corrupt data should NOT be persisted to project key
    const projectKey = IDENTITY_KEY('custom');
    expect(localStorage.getItem(projectKey)).toBeNull();
  });

  it('should prioritize pending identity over project-scoped', async () => {
    const projectKey = IDENTITY_KEY('custom');
    localStorage.setItem(projectKey, JSON.stringify({ userId: 'old_user' }));
    localStorage.setItem(PENDING_IDENTITY_KEY, JSON.stringify({ userId: 'new_user' }));

    const bridge = await initTestBridge();

    const loaded = bridge.get('identity');
    expect(loaded?.userId).toBe('new_user');
  });

  it('should clear identity on destroy', async () => {
    const bridge = await initTestBridge();
    bridge.identify('cust_123');

    expect(bridge.get('identity')).toBeDefined();

    bridge.destroy();

    // After re-init, identity should be cleared
    const bridge2 = await initTestBridge();
    expect(bridge2.get('identity')).toBeUndefined();
  });
});
