import { EmitterCallback, EmitterMap } from '../types';

/**
 * Type-safe event emitter for TraceLog internal events
 *
 * **Purpose**: Provides pub/sub mechanism for internal library events with full TypeScript
 * type safety through `EmitterMap` interface.
 *
 * **Supported Events** (defined in `EmitterMap`):
 * - `event`: Individual events as they are tracked (EventData)
 * - `queue`: Complete event batches before transmission (EventsQueue)
 * - `consent-changed`: Consent state changes for all integrations (ConsentState)
 *
 * **Key Features**:
 * - **Type Safety**: Callbacks receive correctly typed data based on event name
 * - **Memory Management**: Listeners stored in Map for efficient lookup and cleanup
 * - **Synchronous**: All callbacks execute immediately when event is emitted
 * - **No Error Isolation**: Errors in callbacks propagate to caller (by design)
 *
 * **Use Cases**:
 * - External event consumption via `tracelog.on('event', callback)`
 * - Integration testing via `window.__traceLogBridge.on('event', callback)`
 * - Custom analytics integrations
 * - Real-time event monitoring
 *
 * @example
 * ```typescript
 * const emitter = new Emitter();
 *
 * // Subscribe to events
 * const callback = (event: EventData) => {
 *   console.log('Event tracked:', event.type);
 * };
 * emitter.on('event', callback);
 *
 * // Emit event (type-safe)
 * emitter.emit('event', {
 *   id: '123',
 *   type: EventType.CLICK,
 *   page_url: 'https://example.com',
 *   timestamp: Date.now(),
 *   click_data: { x: 100, y: 200, tag: 'button' }
 * });
 *
 * // Unsubscribe
 * emitter.off('event', callback);
 *
 * // Clear all listeners (destroy/cleanup)
 * emitter.removeAllListeners();
 * ```
 *
 * @see EmitterMap for event type definitions
 * @see src/api.ts for public on/off API
 */
export class Emitter {
  private readonly listeners: Map<string, EmitterCallback[]> = new Map();

  /**
   * Subscribes to an event channel
   *
   * **Behavior**:
   * - Creates event channel if it doesn't exist
   * - Appends callback to list of listeners for this event
   * - Same callback can be registered multiple times (will fire multiple times)
   *
   * **Type Safety**: Callback receives data type matching the event name
   *
   * @param event - Event name to subscribe to
   * @param callback - Function to call when event is emitted
   *
   * @example
   * ```typescript
   * emitter.on('event', (eventData) => {
   *   // eventData is typed as EventData
   *   console.log(eventData.type);
   * });
   * ```
   */
  on<K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribes from an event channel
   *
   * **Behavior**:
   * - Removes first occurrence of callback from listener list
   * - If callback not found, no error is thrown
   * - If callback was registered multiple times, only one instance is removed
   *
   * **Important**: Must use same function reference passed to `on()`
   *
   * @param event - Event name to unsubscribe from
   * @param callback - Function reference to remove (must match `on()` reference)
   *
   * @example
   * ```typescript
   * const callback = (data) => console.log(data);
   * emitter.on('event', callback);
   * emitter.off('event', callback); // Unsubscribes successfully
   *
   * // BAD: Won't work (different function reference)
   * emitter.on('event', (data) => console.log(data));
   * emitter.off('event', (data) => console.log(data)); // No effect
   * ```
   */
  off<K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void {
    const callbacks = this.listeners.get(event);

    if (callbacks) {
      const index = callbacks.indexOf(callback);

      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emits an event with data to all subscribed listeners
   *
   * **Behavior**:
   * - Calls all registered callbacks for this event synchronously
   * - Callbacks execute in registration order
   * - If no listeners, no-op (no error thrown)
   * - Errors in callbacks are NOT caught (propagate to caller)
   *
   * **Type Safety**: Data type must match event name's expected type
   *
   * @param event - Event name to emit
   * @param data - Event data (type must match EmitterMap[event])
   *
   * @example
   * ```typescript
   * // Emit event data
   * emitter.emit('event', eventData);
   *
   * // Emit queue data
   * emitter.emit('queue', {
   *   user_id: 'user-123',
   *   session_id: 'session-456',
   *   device: DeviceType.Desktop,
   *   events: [event1, event2]
   * });
   * ```
   */
  emit<K extends keyof EmitterMap>(event: K, data: EmitterMap[K]): void {
    const callbacks = this.listeners.get(event);

    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(data);
      });
    }
  }

  /**
   * Removes all listeners for all events
   *
   * **Purpose**: Cleanup method called during `App.destroy()` to prevent memory leaks
   *
   * **Behavior**:
   * - Clears all event channels
   * - Listeners cannot be restored (new subscriptions required)
   * - Called automatically during library teardown
   *
   * **Use Cases**:
   * - Application teardown
   * - Component unmounting in SPA frameworks
   * - Test cleanup
   *
   * @example
   * ```typescript
   * // During destroy
   * emitter.removeAllListeners();
   * // All subscriptions cleared
   * ```
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }
}
