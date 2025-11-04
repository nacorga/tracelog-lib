/**
 * Global Metadata Update Integration Tests
 * Focus: Verify metadata updates in config state
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';

describe('Integration - updateGlobalMetadata()', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    destroyTestBridge();
  });

  it('should replace global metadata in config state', async () => {
    const bridge = await initTestBridge({
      globalMetadata: { env: 'production', version: '1.0.0' },
    });

    // Update metadata
    bridge.updateGlobalMetadata({ userId: 'user-123', plan: 'premium' });

    // Check config state
    const config = bridge.getState().config;

    expect(config.globalMetadata).toEqual({
      userId: 'user-123',
      plan: 'premium',
    });

    // Previous metadata should be replaced
    expect(config.globalMetadata).not.toHaveProperty('env');
    expect(config.globalMetadata).not.toHaveProperty('version');
  });

  it('should clear global metadata with empty object', async () => {
    const bridge = await initTestBridge({
      globalMetadata: { env: 'production' },
    });

    // Clear metadata
    bridge.updateGlobalMetadata({});

    const config = bridge.getState().config;

    // Global metadata should be empty object
    expect(config.globalMetadata).toEqual({});
  });

  it('should validate metadata before updating', async () => {
    const bridge = await initTestBridge();

    // Invalid metadata should throw
    expect(() => {
      bridge.updateGlobalMetadata(null as any);
    }).toThrow(/Global metadata must be a plain object/);

    expect(() => {
      bridge.updateGlobalMetadata(['array'] as any);
    }).toThrow(/Global metadata must be a plain object/);

    // State should not be updated
    const config = bridge.getState().config;
    expect(config.globalMetadata).toBeUndefined();
  });

  it('should accept nested objects', async () => {
    const bridge = await initTestBridge();

    // Nested object
    bridge.updateGlobalMetadata({
      user: {
        id: 'user-123',
        premium: true,
      },
    });

    const config = bridge.getState().config;

    expect(config.globalMetadata).toEqual({
      user: {
        id: 'user-123',
        premium: true,
      },
    });
  });

  it('should accept string arrays', async () => {
    const bridge = await initTestBridge();

    bridge.updateGlobalMetadata({
      tags: ['tag1', 'tag2', 'tag3'],
    });

    const config = bridge.getState().config;

    expect(config.globalMetadata).toEqual({
      tags: ['tag1', 'tag2', 'tag3'],
    });
  });
});

describe('Integration - mergeGlobalMetadata()', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    destroyTestBridge();
  });

  it('should merge with existing global metadata', async () => {
    const bridge = await initTestBridge({
      globalMetadata: { env: 'production', version: '1.0.0' },
    });

    // Merge metadata
    bridge.mergeGlobalMetadata({ userId: 'user-123' });

    const config = bridge.getState().config;

    // All metadata should be present
    expect(config.globalMetadata).toEqual({
      env: 'production',
      version: '1.0.0',
      userId: 'user-123',
    });
  });

  it('should overwrite existing keys on conflict', async () => {
    const bridge = await initTestBridge({
      globalMetadata: { env: 'production', version: '1.0.0' },
    });

    // Overwrite version
    bridge.mergeGlobalMetadata({ version: '1.1.0', userId: 'user-123' });

    const config = bridge.getState().config;

    expect(config.globalMetadata).toEqual({
      env: 'production',
      version: '1.1.0',
      userId: 'user-123',
    });
  });

  it('should work with no initial metadata', async () => {
    const bridge = await initTestBridge();

    // No initial metadata
    bridge.mergeGlobalMetadata({ key: 'value' });

    const config = bridge.getState().config;

    expect(config.globalMetadata).toEqual({
      key: 'value',
    });
  });

  it('should validate metadata before merging', async () => {
    const bridge = await initTestBridge({
      globalMetadata: { env: 'production' },
    });

    // Invalid metadata should throw
    expect(() => {
      bridge.mergeGlobalMetadata(null as any);
    }).toThrow(/Global metadata must be a plain object/);

    expect(() => {
      bridge.mergeGlobalMetadata(['array'] as any);
    }).toThrow(/Global metadata must be a plain object/);

    // State should not be updated
    const config = bridge.getState().config;
    expect(config.globalMetadata).toEqual({ env: 'production' });
  });

  it('should accept nested objects', async () => {
    const bridge = await initTestBridge({
      globalMetadata: { env: 'production' },
    });

    bridge.mergeGlobalMetadata({
      user: {
        id: 'user-123',
        premium: true,
      },
    });

    const config = bridge.getState().config;

    expect(config.globalMetadata).toEqual({
      env: 'production',
      user: {
        id: 'user-123',
        premium: true,
      },
    });
  });

  it('should allow multiple merges', async () => {
    const bridge = await initTestBridge({
      globalMetadata: { env: 'production' },
    });

    // First merge
    bridge.mergeGlobalMetadata({ version: '1.0.0' });

    // Second merge
    bridge.mergeGlobalMetadata({ userId: 'user-123' });

    // Third merge
    bridge.mergeGlobalMetadata({ experiment: 'new-ui' });

    const config = bridge.getState().config;

    expect(config.globalMetadata).toEqual({
      env: 'production',
      version: '1.0.0',
      userId: 'user-123',
      experiment: 'new-ui',
    });
  });
});

describe('Integration - Mixed metadata updates', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    destroyTestBridge();
  });

  it('should allow switching between update and merge', async () => {
    const bridge = await initTestBridge({
      globalMetadata: { env: 'production', version: '1.0.0' },
    });

    // Merge
    bridge.mergeGlobalMetadata({ userId: 'user-123' });

    let config = bridge.getState().config;
    expect(config.globalMetadata).toEqual({
      env: 'production',
      version: '1.0.0',
      userId: 'user-123',
    });

    // Update (replace)
    bridge.updateGlobalMetadata({ session: 'abc-123' });

    config = bridge.getState().config;
    expect(config.globalMetadata).toEqual({ session: 'abc-123' });

    // Merge again
    bridge.mergeGlobalMetadata({ experiment: 'test' });

    config = bridge.getState().config;

    // Only session and experiment should be present
    expect(config.globalMetadata).toEqual({
      session: 'abc-123',
      experiment: 'test',
    });
  });

  it('should update metadata between calls', async () => {
    const bridge = await initTestBridge({
      globalMetadata: { env: 'production' },
    });

    let config = bridge.getState().config;
    expect(config.globalMetadata).toEqual({ env: 'production' });

    // Update metadata
    bridge.mergeGlobalMetadata({ userId: 'user-123' });

    config = bridge.getState().config;
    expect(config.globalMetadata).toEqual({
      env: 'production',
      userId: 'user-123',
    });
  });
});
