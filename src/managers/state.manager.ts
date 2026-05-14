import { State } from '../types';

/**
 * Global in-memory state store shared across all TraceLog components.
 * Single source of truth for runtime application state.
 */
const globalState: State = { config: {} } as State;

/**
 * Read-only snapshot of the global state.
 *
 * @internal Exposed for tests and the dev-only TestBridge — production code
 * should use `StateManager.get()` / `getState()` instead.
 */
export const getGlobalState = (): Readonly<State> => globalState;

/**
 * Clears every property on the global state.
 *
 * @internal Test isolation only — `tests/setup.ts` invokes this from `afterEach`
 * to guarantee a clean slate between test runs. Calling this in production
 * code breaks the running application.
 */
export const resetGlobalState = (): void => {
  Object.keys(globalState).forEach((key) => {
    delete globalState[key as keyof State];
  });
  globalState.config = {};
};

/**
 * Abstract base class providing centralized, type-safe state management.
 *
 * All managers/handlers extend this class. The global state is shared
 * across every subclass instance.
 *
 * @example
 * ```typescript
 * class MyManager extends StateManager {
 *   initialize() {
 *     const userId = this.get('userId');
 *     this.set('mode', 'qa');
 *   }
 * }
 * ```
 */
export abstract class StateManager {
  /**
   * Retrieves a value from global state.
   */
  protected get<T extends keyof State>(key: T): State[T] {
    return globalState[key];
  }

  /**
   * Sets a value in global state.
   */
  protected set<T extends keyof State>(key: T, value: State[T]): void {
    globalState[key] = value;
  }

  /**
   * Returns an immutable snapshot of the entire global state.
   */
  protected getState(): Readonly<State> {
    return { ...globalState };
  }
}
