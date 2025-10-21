import { EventListenerManager } from './listeners.types';
import { log } from '../utils';

/**
 * Abstract base class for input listener managers to eliminate code duplication.
 *
 * **Purpose**: DRY principle implementation for MouseListenerManager and KeyboardListenerManager.
 *
 * **Benefits**:
 * - Eliminates code duplication between input managers
 * - Consistent error handling across input managers
 * - Simplified maintenance and updates
 * - Single source of truth for input listener setup/cleanup logic
 *
 * **Architecture**:
 * - Subclasses define `events` array and `logPrefix` string
 * - Base class handles listener registration and cleanup
 * - Non-critical managers: Setup failures log errors but don't throw
 *
 * **Error Handling**:
 * - Setup errors: Logs error without throwing (allows partial functionality)
 * - Cleanup errors: Logs as warnings without throwing
 *
 * @see src/listeners/README.md (lines 99-106) for architectural notes
 */
abstract class BaseInputListenerManager implements EventListenerManager {
  protected readonly onActivity: () => void;
  protected readonly options = { passive: true };
  protected abstract readonly events: string[];
  protected abstract readonly logPrefix: string;

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  /**
   * Registers all events defined in subclass `events` array.
   *
   * All listeners use `{ passive: true }` for optimal performance.
   * Setup failures are logged but don't throw (graceful degradation).
   */
  setup(): void {
    try {
      this.events.forEach((event) => {
        window.addEventListener(event, this.onActivity, this.options);
      });
    } catch (error) {
      log('error', `Failed to setup ${this.logPrefix.toLowerCase()} listeners`, { error });
      // Non-critical: Don't throw, allow partial functionality
    }
  }

  /**
   * Removes all events defined in subclass `events` array to prevent memory leaks.
   *
   * Cleanup errors are logged as warnings but do not throw.
   * Safe to call multiple times (idempotent).
   */
  cleanup(): void {
    try {
      this.events.forEach((event) => {
        window.removeEventListener(event, this.onActivity);
      });
    } catch (error) {
      log('warn', `Error during ${this.logPrefix.toLowerCase()} listeners cleanup`, { error });
    }
  }
}

/**
 * Captures mouse-based user interactions on desktop devices.
 *
 * **Events Tracked**: `mousemove`, `mousedown`, `wheel`
 *
 * **Purpose**: Desktop user activity detection through mouse interactions.
 *
 * **Key Features**:
 * - Core mouse events coverage (move, click, scroll wheel)
 * - Wheel/scroll wheel detection
 * - Optimized for desktop interaction patterns
 * - Passive listeners for optimal performance
 * - Non-critical manager: Setup failures log errors but don't throw
 *
 * **Error Handling**:
 * - Setup errors: Logs error without throwing (allows partial functionality)
 * - Cleanup errors: Logs as warnings without throwing
 *
 * @see src/listeners/README.md (lines 72-84) for detailed documentation
 */
export class MouseListenerManager extends BaseInputListenerManager {
  protected readonly events = ['mousemove', 'mousedown', 'wheel'];
  protected readonly logPrefix = 'MouseListenerManager';
}

/**
 * Monitors keyboard input for user activity detection.
 *
 * **Events Tracked**: `keydown`
 *
 * **Purpose**: Keyboard-based user activity tracking for session management.
 *
 * **Key Features**:
 * - Modern event handling (`keydown` only, no deprecated keypress)
 * - Essential for detecting typing activity
 * - Passive listeners for optimal performance
 * - Non-critical manager: Setup failures log errors but don't throw
 *
 * **Error Handling**:
 * - Setup errors: Logs error without throwing (allows partial functionality)
 * - Cleanup errors: Logs as warnings without throwing
 *
 * @see src/listeners/README.md (lines 86-96) for detailed documentation
 */
export class KeyboardListenerManager extends BaseInputListenerManager {
  protected readonly events = ['keydown'];
  protected readonly logPrefix = 'KeyboardListenerManager';
}
