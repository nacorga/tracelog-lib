/**
 * Common interface for all event listener managers.
 *
 * **Purpose**: Defines the contract that all listener managers must implement.
 *
 * **Implementation Pattern**:
 * - `setup()`: Register event listeners (throw if critical, log if non-critical)
 * - `cleanup()`: Remove event listeners and prevent memory leaks (always safe)
 *
 * **Error Handling Strategy**:
 * - **Critical managers** (Activity, Touch, Unload): Throw on setup failure
 * - **Non-critical managers** (Mouse, Keyboard, Visibility): Log on setup failure, don't throw
 * - **All managers**: Log cleanup errors as warnings, never throw
 *
 * **Implementing Classes**:
 * - ActivityListenerManager (scroll, resize, focus)
 * - TouchListenerManager (touchstart, touchmove, touchend, orientationchange)
 * - VisibilityListenerManager (visibilitychange, blur, focus, online, offline)
 * - UnloadListenerManager (beforeunload, pagehide)
 * - MouseListenerManager (mousemove, mousedown, wheel)
 * - KeyboardListenerManager (keydown)
 *
 * @see src/listeners/README.md (lines 108-125) for error handling strategy
 */
export interface EventListenerManager {
  /**
   * Registers event listeners.
   *
   * Critical managers (Activity, Touch, Unload) must throw on failure.
   * Non-critical managers (Mouse, Keyboard, Visibility) should log errors without throwing.
   */
  setup(): void;

  /**
   * Removes event listeners and cleans up resources.
   *
   * Must be safe to call multiple times (idempotent).
   * Should never throw errors (log as warnings instead).
   */
  cleanup(): void;
}
