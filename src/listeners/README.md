# Event Listener Managers

Event listener managers handle browser event registration and cleanup for user activity tracking and session management.

## ActivityListenerManager

Tracks general user activity through window-level events.

**Events Tracked**: `scroll`, `resize`, `focus`

**Purpose**: Detects user engagement and activity patterns for session management.

**Key Features**:
- Passive event listeners for optimal performance
- Window-level event detection
- Clean resource management with proper cleanup

## TouchListenerManager

Captures touch-based interactions on mobile and touch-enabled devices.

**Events Tracked**: `touchstart`, `touchmove`, `touchend`, `orientationchange`

**Purpose**: Mobile and touch device user activity detection.

**Key Features**:
- Essential touch event coverage
- Orientation change detection for mobile devices
- Simplified v1 implementation (removed device motion complexity)
- Passive listeners for smooth touch performance

## VisibilityListenerManager

Monitors page visibility state and window focus for session lifecycle management.

**Events Tracked**: `visibilitychange`, `blur`, `focus`, `online`, `offline`

**Purpose**: Tracks when users switch tabs, minimize windows, or lose network connectivity.

**Key Features**:
- Page Visibility API integration (`visibilitychange`)
- Window focus/blur detection
- Basic network status monitoring
- Simplified v1 architecture (removed mobile-specific complexity)

## UnloadListenerManager

Detects page unload events for session termination and data persistence.

**Events Tracked**: `beforeunload`, `pagehide`

**Purpose**: Ensures proper session ending and final data transmission before page closes.

**Key Features**:
- Reliable unload detection across browsers
- Graceful error handling
- Essential for session boundary tracking

## MouseListenerManager

Captures mouse-based user interactions on desktop devices.

**Events Tracked**: `mousemove`, `mousedown`, `wheel`

**Purpose**: Desktop user activity detection through mouse interactions.

**Key Features**:
- Core mouse events coverage
- Wheel/scroll wheel detection
- Optimized for desktop interaction patterns

## KeyboardListenerManager

Monitors keyboard input for user activity detection.

**Events Tracked**: `keydown`

**Purpose**: Keyboard-based user activity tracking.

**Key Features**:
- Modern event handling (`keydown` only)
- Essential for detecting typing activity

## Architecture Notes

### BaseInputListenerManager

Abstract base class that eliminates code duplication between `MouseListenerManager` and `KeyboardListenerManager`.

**Benefits**:
- DRY principle implementation
- Consistent error handling across input managers
- Simplified maintenance and updates

### Common Interface

All listener managers implement the `EventListenerManager` interface:

```typescript
interface EventListenerManager {
  setup(): void;    // Register event listeners
  cleanup(): void;  // Remove event listeners and prevent memory leaks
}
```

### Error Handling Strategy

- **Setup errors**: Logged but don't throw (graceful degradation)
- **Cleanup errors**: Logged as warnings
- **Consistent patterns**: All managers follow the same error handling approach for v1 reliability

### Performance Considerations

- **Passive listeners**: All events use `{ passive: true }` where possible
- **Memory management**: Proper cleanup prevents memory leaks
- **Minimal overhead**: Focused on essential events only for v1

All listener managers are designed for v1 simplicity, removing over-engineered features while maintaining essential functionality for comprehensive user activity tracking.