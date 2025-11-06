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
- Passive listeners for smooth touch performance

## VisibilityListenerManager

Monitors page visibility state and window focus for session lifecycle management with dual callback routing.

**Events Tracked**: `visibilitychange`, `blur`, `focus`, `online`, `offline`

**Purpose**: Tracks when users switch tabs, minimize windows, or lose network connectivity. Routes events to different callbacks based on whether they indicate user engagement or visibility changes.

**Key Features**:
- **Dual Callback Architecture**:
  - `onActivity` callback: Triggered by `focus` and `online` events (positive user engagement)
  - `onVisibilityChange` callback: Triggered by `visibilitychange`, `blur`, and `offline` events (visibility/connectivity changes)
- Page Visibility API integration (`visibilitychange`)
- Window focus/blur detection
- Basic network status monitoring (`online`/`offline`)
- Passive listeners for optimal performance

**Callback Routing**:
```typescript
constructor(
  onActivity: () => void,        // Called for: focus, online
  onVisibilityChange: () => void // Called for: visibilitychange, blur, offline
)
```

## Architecture Notes

### Common Interface

All listener managers implement the `EventListenerManager` interface:

```typescript
interface EventListenerManager {
  setup(): void;    // Register event listeners
  cleanup(): void;  // Remove event listeners and prevent memory leaks
}
```

### Error Handling Strategy

- **Setup errors**:
  - **Critical managers** (Activity, Touch): Log error and throw to prevent incomplete initialization
  - **Visibility managers**: Log error with graceful degradation (no throw)
- **Cleanup errors**: All managers log as warnings without throwing
- **Rationale**: Critical activity detection failures should halt initialization, while visibility-specific failures allow partial functionality

### Performance Considerations

- **Passive listeners**: All events use `{ passive: true }` where possible
- **Memory management**: Proper cleanup prevents memory leaks
