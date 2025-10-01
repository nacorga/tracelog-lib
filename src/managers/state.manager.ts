import { State } from '../types';
import { debugLog } from '../utils/logging';
import { DEFAULT_SAMPLING_RATE } from '../constants';

/**
 * Global state store shared across all TraceLog components
 */
const globalState: State = {} as State;

/**
 * Gets a read-only copy of the global state
 * Used by utils to access state without creating circular dependencies
 */
export function getGlobalState(): Readonly<State> {
  return globalState;
}

/**
 * Resets the global state to its initial empty state.
 * Used primarily for testing and cleanup scenarios.
 */
export function resetGlobalState(): void {
  Object.keys(globalState).forEach((key) => {
    delete globalState[key as keyof State];
  });
}

/**
 * Abstract base class providing state management capabilities to TraceLog components.
 *
 * All managers and handlers extend this class to access and modify the shared global state.
 * State operations are synchronous and thread-safe within the single-threaded browser environment.
 */
export abstract class StateManager {
  /**
   * Gets a value from the global state
   */
  protected get<T extends keyof State>(key: T): State[T] {
    return globalState[key];
  }

  /**
   * Sets a value in the global state
   */
  protected set<T extends keyof State>(key: T, value: State[T]): void {
    const oldValue = globalState[key];

    if (key === 'config' && value) {
      const configValue = value as State['config'];

      if (configValue) {
        const samplingRate = configValue.samplingRate ?? DEFAULT_SAMPLING_RATE;
        // Only normalize invalid sampling rates (negative or > 1), NOT zero
        // Zero is a valid value meaning "sample no events"
        const normalizedSamplingRate = samplingRate < 0 || samplingRate > 1 ? DEFAULT_SAMPLING_RATE : samplingRate;
        const hasNormalizedSampling = normalizedSamplingRate !== samplingRate;

        if (hasNormalizedSampling) {
          const normalizedConfig = { ...configValue, samplingRate: normalizedSamplingRate };
          globalState[key] = normalizedConfig as State[T];
        } else {
          globalState[key] = configValue as State[T];
        }
      } else {
        globalState[key] = value;
      }
    } else {
      globalState[key] = value;
    }

    // Log critical state changes for debugging
    if (this.isCriticalStateKey(key) && this.shouldLog(oldValue, globalState[key])) {
      debugLog.debug('StateManager', 'State updated', {
        key,
        oldValue: this.formatLogValue(key, oldValue),
        newValue: this.formatLogValue(key, globalState[key]),
      });
    }
  }

  /**
   * Gets the entire state object (for debugging purposes)
   */
  protected getState(): Readonly<State> {
    return { ...globalState };
  }

  /**
   * Checks if a state key is considered critical for logging
   */
  private isCriticalStateKey(key: keyof State): boolean {
    return key === 'sessionId' || key === 'config' || key === 'hasStartSession';
  }

  /**
   * Determines if a state change should be logged
   */
  private shouldLog<T extends keyof State>(oldValue: State[T], newValue: State[T]): boolean {
    return oldValue !== newValue;
  }

  /**
   * Formats values for logging (avoiding large object dumps)
   */
  private formatLogValue<T extends keyof State>(key: T, value: State[T]): State[T] | string {
    if (key === 'config') {
      return value ? '(configured)' : '(not configured)';
    }
    return value;
  }
}
