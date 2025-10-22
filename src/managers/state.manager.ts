import { State } from '../types';

/**
 * Global in-memory state store shared across all TraceLog components.
 * Single source of truth for runtime application state.
 */
const globalState: State = {} as State;

/**
 * Returns an immutable snapshot of the global state.
 *
 * **Purpose**: Testing and debugging - provides read-only access to internal state.
 *
 * **Usage**:
 * - Test assertions: Verify state changes after operations
 * - Debugging: Inspect current application state
 * - Non-intrusive: Returns readonly reference (no mutations)
 *
 * @returns Readonly reference to global state
 *
 * @example
 * ```typescript
 * const state = getGlobalState();
 * console.log(state.userId); // Read-only access
 * ```
 *
 * @see src/managers/README.md (lines 198-201) for StateManager documentation
 */
export const getGlobalState = (): Readonly<State> => {
  return globalState;
};

/**
 * Clears all properties from the global state.
 *
 * **Purpose**: Test isolation - ensures clean state between test runs.
 *
 * **Warning**: Should only be called in test environments.
 * Calling in production will break the application.
 *
 * **Usage**:
 * - afterEach/beforeEach hooks in test suites
 * - Cleanup after integration tests
 * - Resetting application state for fresh initialization
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   resetGlobalState(); // Clean slate for next test
 * });
 * ```
 */
export const resetGlobalState = (): void => {
  Object.keys(globalState).forEach((key) => {
    delete globalState[key as keyof State];
  });
};

/**
 * Abstract base class providing centralized, type-safe state management.
 *
 * **Purpose**: Foundation for all TraceLog managers and handlers, providing
 * synchronized access to shared application state.
 *
 * **Architecture**:
 * - All managers/handlers extend this class
 * - Single global state instance shared across all subclasses
 * - Type-safe operations via generic methods
 * - In-memory only (no automatic persistence)
 *
 * **Supported State Properties**:
 * - **Core State**: `collectApiUrls`, `config`, `sessionId`, `userId`, `device`, `pageUrl`
 * - **Control Flags**: `mode` (QA/production), `hasStartSession`, `suppressNextScroll`
 * - **Runtime Counters**: `scrollEventCount` (optional)
 *
 * **Implementation Details**:
 * - Synchronous operations (no async overhead)
 * - Memory-efficient (minimal object creation)
 * - No built-in logging (consumers handle their own state logging)
 * - Read-only snapshots via `getState()` prevent accidental mutations
 *
 * @see src/managers/README.md (lines 170-201) for detailed documentation
 *
 * @example
 * ```typescript
 * class MyManager extends StateManager {
 *   initialize() {
 *     const userId = this.get('userId');      // Read state
 *     this.set('mode', 'qa');                 // Write state
 *     const snapshot = this.getState();       // Readonly copy
 *   }
 * }
 * ```
 */
export abstract class StateManager {
  /**
   * Retrieves a value from global state.
   *
   * Type-safe getter with compile-time key validation.
   *
   * @template T - State key type (compile-time validated)
   * @param key - State property key
   * @returns Current value for the given key (may be undefined)
   *
   * @example
   * ```typescript
   * const userId = this.get('userId');
   * const config = this.get('config');
   * const sessionId = this.get('sessionId');
   * ```
   */
  protected get<T extends keyof State>(key: T): State[T] {
    return globalState[key];
  }

  /**
   * Sets a value in global state.
   *
   * Type-safe setter with compile-time type checking.
   * Changes are immediately visible to all StateManager subclasses.
   *
   * @template T - State key type (compile-time validated)
   * @param key - State property key
   * @param value - New value (type must match State[T])
   *
   * @example
   * ```typescript
   * this.set('sessionId', 'session-123');
   * this.set('mode', Mode.QA);
   * this.set('hasStartSession', true);
   * ```
   */
  protected set<T extends keyof State>(key: T, value: State[T]): void {
    globalState[key] = value;
  }

  /**
   * Returns an immutable snapshot of the entire global state.
   *
   * Creates a shallow copy to prevent accidental mutations.
   * Use for debugging or when multiple state properties are needed.
   *
   * @returns Readonly shallow copy of global state
   *
   * @example
   * ```typescript
   * const snapshot = this.getState();
   * console.log(snapshot.userId, snapshot.sessionId);
   * ```
   */
  protected getState(): Readonly<State> {
    return { ...globalState };
  }
}
