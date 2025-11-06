/**
 * State Helper
 *
 * Utilities for managing and inspecting state in tests
 */

import type { State } from '../../src/types/state.types';

/**
 * Get current global state (read-only)
 * Use this to inspect state without modifying it
 */
export function getGlobalState(): Readonly<State> | null {
  // Access via window for testing
  const stateManager = (window as any).__traceLogState;
  return stateManager ? stateManager.getState() : null;
}

/**
 * Reset global state to initial values
 * Use this in beforeEach to ensure clean state
 */
export function resetGlobalState(): void {
  const stateManager = (window as any).__traceLogState;
  if (stateManager) {
    // Reset to default state values (only valid State keys)
    stateManager.setState({
      sessionId: null,
      userId: '',
      collectApiUrls: {},
      pageUrl: '',
      mode: undefined,
      device: 'desktop',
      hasStartSession: false,
      suppressNextScroll: false,
    });
  }
}

/**
 * Set specific state value (for testing only)
 * Use sparingly - prefer testing through public APIs
 */
export function setGlobalStateValue<K extends keyof State>(key: K, value: State[K]): void {
  const stateManager = (window as any).__traceLogState;
  if (stateManager) {
    stateManager.set(key, value);
  }
}

/**
 * Get specific state value
 */
export function getGlobalStateValue<K extends keyof State>(key: K): State[K] | null {
  const stateManager = (window as any).__traceLogState;
  return stateManager ? stateManager.get(key) : null;
}

/**
 * Validate state has expected values
 */
export function validateState(expected: Partial<State>): boolean {
  const state = getGlobalState();
  if (!state) return false;

  return Object.entries(expected).every(([key, value]) => {
    return state[key as keyof State] === value;
  });
}

/**
 * Wait for state value to change
 */
export async function waitForStateValue<K extends keyof State>(
  key: K,
  expectedValue: State[K],
  timeout = 5000,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const value = getGlobalStateValue(key);
    if (value === expectedValue) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timeout waiting for state.${String(key)} to become ${expectedValue} after ${timeout}ms`);
}

/**
 * Get session ID from state
 */
export function getSessionId(): string | null {
  return getGlobalStateValue('sessionId');
}

/**
 * Get user ID from state
 */
export function getUserId(): string | null {
  return getGlobalStateValue('userId');
}

/**
 * Get config from state
 */
export function getConfig(): any {
  return getGlobalStateValue('config');
}

/**
 * Check if integration is configured
 */
export function hasIntegration(integration: 'saas' | 'custom'): boolean {
  const collectApiUrls = getGlobalStateValue('collectApiUrls');
  return collectApiUrls?.[integration] !== undefined;
}

/**
 * Get API URL for integration
 */
export function getApiUrl(integration: 'saas' | 'custom'): string | undefined {
  const collectApiUrls = getGlobalStateValue('collectApiUrls');
  return collectApiUrls?.[integration];
}

/**
 * Check if in QA mode
 */
export function isQaMode(): boolean {
  return getGlobalStateValue('mode') === 'qa';
}

/**
 * Create state snapshot for comparison
 */
export function createStateSnapshot(): State {
  return { ...getGlobalState() } as State;
}

/**
 * Compare two state snapshots
 */
export function compareStateSnapshots(before: State, after: State): { changed: string[]; unchanged: string[] } {
  const changed: string[] = [];
  const unchanged: string[] = [];

  Object.keys(before).forEach((key) => {
    const k = key as keyof State;
    if (before[k] !== after[k]) {
      changed.push(key);
    } else {
      unchanged.push(key);
    }
  });

  return { changed, unchanged };
}

/**
 * Print state for debugging
 */
export function debugState(): void {
  const state = getGlobalState();
  console.log('=== Current State ===');
  console.log(JSON.stringify(state, null, 2));
  console.log('====================');
}

/**
 * Validate state structure
 */
export function validateStateStructure(): boolean {
  const state = getGlobalState();
  if (!state) return false;

  const requiredKeys: (keyof State)[] = [
    'config',
    'sessionId',
    'userId',
    'collectApiUrls',
    'pageUrl',
    'device',
    'hasStartSession',
    'suppressNextScroll',
  ];

  return requiredKeys.every((key) => key in state);
}
