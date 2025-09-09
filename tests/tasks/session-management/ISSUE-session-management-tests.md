# E2E Testing: Session Management Tests

## Overview

This issue covers the implementation of **6 E2E tests** for session management functionality in the TraceLog SDK. These tests validate session lifecycle, timeout handling, cross-tab coordination, and session recovery mechanisms.

## Test Coverage

### Session Lifecycle Management (6 tests)
- [ ] **005**: Session creation and initialization
- [ ] **006**: Session timeout handling (15-minute default)
- [ ] **007**: Session recovery after browser restart
- [ ] **008**: Cross-tab session sharing and synchronization
- [ ] **009**: Activity-based session extension
- [ ] **010**: Session end event generation and cleanup

## Detailed Test Requirements

### Test 005: Session Creation and Initialization
**Objective**: Validate new sessions are created correctly with proper session IDs, timestamps, and initial events

**Requirements**:
- Test session ID generation (UUID format)
- Validate session start timestamp accuracy
- Test session start event generation
- Verify session metadata collection (device type, user agent, etc.)
- Test session storage and persistence
- Validate session state initialization

**Session Data Structure**:
```typescript
interface Session {
  sessionId: string;          // UUID v4 format
  userId: string;            // Associated user ID
  startTime: Date;           // Session start timestamp
  lastActivity: Date;        // Last activity timestamp
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;         // Browser user agent
  referrer?: string;         // Session referrer
  isRecovered: boolean;      // Session recovery flag
}
```

**Implementation Details**:
- Test session ID uniqueness across multiple initializations
- Verify session start event includes proper metadata
- Test session persistence to localStorage
- Validate session correlation with user ID
- Test device type classification accuracy
- Verify timestamp precision and accuracy

**Success Criteria**:
- Unique session ID generated for each new session
- Session start event captured with complete metadata
- Session data persisted correctly in storage
- Device type accurately determined and stored
- Session timestamps within acceptable accuracy (±100ms)

### Test 006: Session Timeout Handling
**Objective**: Test sessions properly timeout after period of inactivity (15 minutes default) with configurable timeout values

**Requirements**:
- Test default 15-minute session timeout
- Validate configurable timeout values (5min, 30min, 60min)
- Test inactivity detection accuracy
- Verify session end event generation on timeout
- Test timeout behavior with page visibility changes
- Validate timeout reset on user activity

**Timeout Configuration**:
```typescript
interface SessionTimeoutConfig {
  timeout: number;           // Session timeout in milliseconds (15min default)
  warningTime: number;      // Warning before timeout (optional)
  checkInterval: number;    // Inactivity check interval (30s)
  activityEvents: string[]; // Events that reset timeout
}
```

**Implementation Details**:
- Test session timeout with simulated inactivity periods
- Verify timeout configuration during initialization
- Test activity detection resets timeout correctly
- Validate session end event with timeout reason
- Test timeout behavior when page is hidden/visible
- Verify timeout persistence across page reloads

**Timeout Test Scenarios**:
- Complete inactivity for full timeout period
- Activity just before timeout (should reset)
- Multiple activity bursts during session
- Page visibility changes during timeout period
- Browser tab switching during timeout countdown
- Custom timeout values (shorter and longer periods)

### Test 007: Session Recovery After Browser Restart
**Objective**: Validate sessions are properly recovered from storage after browser restart with session continuity

**Requirements**:
- Test session data recovery from localStorage after restart
- Validate session continuation vs new session creation logic
- Test session age validation (max 24 hours for recovery)
- Verify recovered session metadata accuracy
- Test session recovery failure handling
- Validate session recovery event generation

**Session Recovery Logic**:
```typescript
interface SessionRecovery {
  maxRecoveryAge: number;    // Maximum session age for recovery (24h)
  recoveryGracePeriod: number; // Grace period for recovery (30min)
  validateSessionData: boolean; // Validate recovered session integrity
  recoveryCriteria: {
    maxAge: boolean;         // Check session age
    dataIntegrity: boolean;  // Validate session data
    userConsistency: boolean; // Same user ID
  };
}
```

**Implementation Details**:
- Test session recovery with valid stored session data
- Verify session age checking (recent vs expired sessions)
- Test session data integrity validation
- Validate new session creation when recovery fails
- Test recovery event generation with recovery metadata
- Verify user ID consistency during recovery

**Recovery Test Scenarios**:
- Browser restart within recovery window (should recover)
- Browser restart after recovery window (new session)
- Corrupted session data in storage (new session)
- Missing session data (new session)
- User ID mismatch in stored session (new session)
- Partial session data recovery

### Test 008: Cross-Tab Session Sharing
**Objective**: Test multiple tabs share the same session through BroadcastChannel with proper synchronization

**Requirements**:
- Test session sharing across multiple tabs
- Validate BroadcastChannel communication for session updates
- Test session leader election among tabs
- Verify activity sharing across tabs (activity in one extends all)
- Test session end propagation to all tabs
- Validate fallback behavior when BroadcastChannel unavailable

**Cross-Tab Communication**:
```typescript
interface CrossTabSession {
  channel: BroadcastChannel;  // Communication channel
  messages: {
    SESSION_START: SessionStartMessage;
    SESSION_ACTIVITY: ActivityMessage;
    SESSION_END: SessionEndMessage;
    LEADER_ELECTION: LeaderElectionMessage;
  };
  leaderElection: boolean;    // Tab leader management
  syncInterval: number;       // Synchronization interval (10s)
}
```

**Implementation Details**:
- Test session creation in first tab propagates to others
- Verify activity in any tab extends session in all tabs
- Test tab leader election and responsibilities
- Validate session end in one tab affects all tabs
- Test BroadcastChannel message reliability
- Verify localStorage fallback when BroadcastChannel unavailable

**Cross-Tab Test Scenarios**:
- Open multiple tabs, verify same session ID
- Activity in tab A extends timeout in tab B
- Close leading tab, verify leader re-election
- Session timeout in leader tab ends session in all tabs
- BroadcastChannel unavailable, test localStorage polling
- Rapid tab opening/closing stress test

### Test 009: Activity-Based Session Extension
**Objective**: Validate user activity properly extends session duration with accurate activity detection

**Requirements**:
- Test activity detection through mouse, keyboard, touch events
- Validate scroll-based activity detection
- Test page focus/blur activity handling
- Verify activity timestamp updates
- Test activity debouncing to prevent excessive updates
- Validate activity sharing across tabs

**Activity Detection Sources**:
```typescript
interface ActivityDetection {
  mouseEvents: string[];     // mousemove, click, mousedown
  keyboardEvents: string[]; // keydown, keypress, keyup
  touchEvents: string[];    // touchstart, touchmove, touchend
  scrollEvents: string[];   // scroll, wheel
  focusEvents: string[];    // focus, blur, visibilitychange
  customEvents: string[];   // Custom activity indicators
}
```

**Implementation Details**:
- Test various activity types reset session timeout
- Verify activity detection uses passive event listeners
- Test activity debouncing prevents excessive processing
- Validate activity timestamp accuracy
- Test activity detection performance impact
- Verify cross-tab activity propagation

**Activity Test Scenarios**:
- Mouse movement and clicks extend session
- Keyboard input resets timeout countdown
- Touch gestures on mobile devices
- Scroll activity detection and debouncing
- Page focus changes and visibility events
- Rapid activity burst handling

### Test 010: Session End Event Generation
**Objective**: Test session end events are properly generated with correct reasons and cleanup is performed

**Requirements**:
- Test session end event generation for timeout scenarios
- Validate session end for explicit termination
- Test session end event metadata (duration, reason, event count)
- Verify proper cleanup after session end
- Test session end event transmission reliability
- Validate new session creation after session end

**Session End Scenarios**:
```typescript
interface SessionEndReasons {
  TIMEOUT: 'timeout';        // Inactivity timeout
  NEW_SESSION: 'new_session'; // Explicit new session
  TAB_CLOSE: 'tab_close';    // Browser tab closed
  DESTROY: 'destroy';        // SDK destroyed
  ERROR: 'error';           // Error condition
}
```

**Session End Event Structure**:
```typescript
interface SessionEndEvent {
  type: 'SESSION_END';
  sessionId: string;         // Ending session ID
  userId: string;           // Associated user ID
  startTime: Date;          // Session start time
  endTime: Date;            // Session end time
  duration: number;         // Session duration in ms
  reason: SessionEndReason; // End reason
  eventCount: number;       // Total events in session
  lastActivity: Date;       // Last activity timestamp
}
```

**Implementation Details**:
- Test session end event generation for all end scenarios
- Verify session end event includes complete metadata
- Test session cleanup after end event
- Validate session end event transmission using sendBeacon
- Test new session creation after previous session ends
- Verify session end event deduplication

## Session Performance Requirements

### Session Management Performance
- Session creation: <100ms
- Session recovery: <200ms
- Activity detection latency: <50ms per event
- Cross-tab synchronization: <100ms message propagation
- Session end processing: <200ms
- Storage operations: <50ms per operation

### Memory and Storage Efficiency
- Session data storage: <1KB per session
- Cross-tab message overhead: <100 bytes per message
- Activity detection memory usage: <500KB
- Session cleanup: Complete resource disposal

## Cross-Browser Session Compatibility

### BroadcastChannel Support
- Chrome/Edge: Full BroadcastChannel support
- Firefox: Full BroadcastChannel support
- Safari: BroadcastChannel support in 15.4+
- Fallback: localStorage-based cross-tab communication

### Storage Compatibility
- localStorage: Universal support across target browsers
- sessionStorage: Available for temporary session data
- Storage quota: Efficient usage with cleanup

## Success Criteria

### Functional Requirements
- [ ] All 6 session management tests pass consistently
- [ ] Sessions created and managed correctly throughout lifecycle
- [ ] Timeout handling accurate with configurable values
- [ ] Session recovery works after browser restart
- [ ] Cross-tab coordination maintains session consistency
- [ ] Activity detection extends sessions appropriately
- [ ] Session end events generated with complete metadata

### Performance Requirements
- [ ] Session operations meet performance benchmarks
- [ ] Cross-tab communication efficient and reliable
- [ ] Activity detection doesn't impact application performance
- [ ] Memory usage remains stable during extended sessions

### Reliability Requirements
- [ ] Session continuity maintained across browser restarts
- [ ] Cross-tab coordination works reliably
- [ ] Session timeout accuracy within ±30 seconds
- [ ] Session data integrity maintained throughout lifecycle

### Test Structure and Style
**IMPORTANT**: All tests must follow the style and structure of `/tests/e2e/app.spec.ts`. Use this file as the reference for:

- Test organization using `test.describe()` blocks
- Async/await patterns with Playwright
- Page navigation and loading patterns (`page.goto('/')`, `page.waitForLoadState('domcontentloaded')`)
- Console message monitoring with `page.on('console', ...)` 
- Element selection using `page.getByTestId()` and similar selectors
- Assertion patterns with `expect()` and `toContainText()`, `toHaveLength()`, etc.
- Timeout handling with `page.waitForTimeout()` when needed
- Test naming conventions and structure

**Example test structure following app.spec.ts style**:
```typescript
test.describe('Lorem Ipsum', () => {
  test('should ...', async ({ page }) => {
    // Follow app.spec.ts patterns for page navigation and assertions
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test implementation following established patterns
  });
});
```

## Implementation Notes

### Test Environment Setup
- Configure multi-tab test scenarios
- Set up controlled timing for timeout testing
- Mock BroadcastChannel for fallback testing
- Create activity simulation for various input types

### Session State Validation
- Verify session data accuracy at each lifecycle stage
- Test session correlation across events
- Validate cross-tab synchronization consistency
- Monitor session cleanup completeness

## Branching Requirements
- Start branch from: `refactor/playwright-e2e-tests`
- Merge changes into: `develop`

## Definition of Done

- [ ] All 6 test cases implemented and passing
- [ ] Session lifecycle managed correctly from creation to end
- [ ] Timeout handling accurate and configurable
- [ ] Session recovery working after browser restart
- [ ] Cross-tab session coordination functioning properly
- [ ] Activity detection extending sessions correctly
- [ ] Session end events generated with complete metadata
- [ ] Cross-browser compatibility verified
- [ ] Performance requirements met for all session operations
- [ ] Documentation updated with session management specifications