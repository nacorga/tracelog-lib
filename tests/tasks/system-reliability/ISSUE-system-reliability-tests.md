# E2E Testing: System Reliability Tests

## Overview

This issue covers the implementation of **8 E2E tests** for system reliability in the TraceLog SDK. These tests validate library cleanup, memory management, activity detection, multi-tab coordination, and data accuracy.

## Test Coverage

### System Reliability (8 tests)

#### Lifecycle Management (2 tests)
- [ ] **057**: Library destroy functionality and cleanup
- [ ] **058**: Memory leak prevention across initialization cycles

#### Activity Detection (2 tests)
- [ ] **059**: User activity recognition through various input methods
- [ ] **060**: Inactivity detection and session timeout handling

#### Multi-Tab Coordination (2 tests)
- [ ] **061**: Cross-tab session coordination and synchronization
- [ ] **062**: Tab leader election and management

#### Data Accuracy (2 tests)
- [ ] **066**: Event deduplication and duplicate detection
- [ ] **067**: Timestamp consistency and accuracy

## Detailed Test Requirements

### Lifecycle Management Tests (057-058)

**Test 057: Library Destroy Functionality**
**Objective**: Validate TraceLog.destroy() properly cleans up all resources and restores environment to pre-initialization state

**Requirements**:
- Test complete cleanup of all event listeners
- Validate timer and interval cleanup (setTimeout, setInterval)
- Verify storage cleanup and data removal
- Test BroadcastChannel closure and cleanup
- Confirm observer cleanup (PerformanceObserver, IntersectionObserver)
- Validate state reset and memory release

**Cleanup Checklist**:
```typescript
interface DestroyCleanup {
  eventListeners: string[];      // All DOM event listeners to remove
  timers: number[];             // Active timers to clear
  observers: Observer[];        // Performance/Intersection observers
  storage: string[];           // Storage keys to clean
  broadcastChannels: BroadcastChannel[]; // Channels to close
  intervals: number[];         // Active intervals to clear
}
```

**Implementation Details**:
- Test destroy() method removes all DOM event listeners
- Verify timer cleanup prevents memory leaks
- Test storage key removal for project-specific data
- Validate BroadcastChannel closure
- Test observer disconnection and cleanup
- Verify global state reset to initial conditions

**Cleanup Verification**:
- DOM event listeners: Verify complete removal
- Memory usage: Monitor for proper garbage collection
- Storage: Confirm project data removal
- Network requests: Cancel pending requests
- Background processes: Stop all SDK-initiated processes

**Test 058: Memory Leak Prevention**
**Objective**: Test repeated initialization and destruction cycles don't cause memory leaks or accumulate resources

**Requirements**:
- Test multiple init() → destroy() cycles without memory growth
- Validate event listener accumulation prevention
- Test storage cleanup preventing data accumulation
- Verify observer cleanup preventing memory leaks
- Test closure cleanup and garbage collection
- Validate performance stability over multiple cycles

**Memory Leak Testing**:
```typescript
interface MemoryLeakTests {
  initDestroycycles: number;    // Number of cycles to test (100+)
  memoryThreshold: number;      // Acceptable memory growth (5MB max)
  gcForce: boolean;            // Force garbage collection
  monitoringInterval: number;   // Memory check interval (1s)
  leakDetection: string[];     // Types of leaks to detect
}
```

**Implementation Details**:
- Run 100+ initialization/destruction cycles
- Monitor memory usage using Performance.measureUserAgentSpecificMemory()
- Test with memory profiling tools (Chrome DevTools)
- Verify event listener count remains stable
- Test storage size remains bounded
- Validate timer/interval cleanup

### Activity Detection Tests (059-060)

**Test 059: User Activity Recognition**
**Objective**: Validate user activity is properly detected through mouse, keyboard, touch, scroll, and visibility events

**Requirements**:
- Test mouse movement and click activity detection
- Validate keyboard input activity recognition
- Test touch events for mobile activity detection
- Verify scroll activity detection
- Test page visibility change handling
- Validate activity timeout reset functionality

**Activity Detection Sources**:
```typescript
interface ActivitySources {
  mouse: string[];             // mousemove, mousedown, click
  keyboard: string[];          // keydown, keypress, keyup
  touch: string[];            // touchstart, touchmove, touchend
  scroll: string[];           // scroll, wheel
  visibility: string[];       // visibilitychange, focus, blur
  custom: string[];          // Custom activity indicators
}
```

**Implementation Details**:
- Test activity detection across all input methods
- Verify activity timestamp updates correctly
- Test activity detection in different page states
- Validate passive event listener usage
- Test activity detection performance impact
- Verify cross-tab activity coordination

**Activity Test Scenarios**:
- Mouse interaction (movement, clicks)
- Keyboard input (typing, shortcuts)
- Touch gestures (taps, swipes, scrolls)
- Page focus/blur events
- Page visibility changes
- Programmatic vs user-initiated activity

**Test 060: Inactivity Detection and Session Timeout**
**Objective**: Test user inactivity is correctly identified and triggers appropriate session timeout behavior

**Requirements**:
- Test inactivity timer accuracy (default 15 minutes)
- Validate session timeout behavior on inactivity
- Test inactivity detection with custom timeout values
- Verify activity resets inactivity timer correctly
- Test inactivity handling across multiple tabs
- Validate session end event generation on timeout

**Inactivity Management**:
```typescript
interface InactivityConfig {
  timeout: number;             // Inactivity timeout (15min default)
  warningTime: number;        // Warning before timeout (1min)
  checkInterval: number;      // Activity check interval (30s)
  gracePeriod: number;       // Grace period after timeout (10s)
  crossTab: boolean;         // Cross-tab inactivity coordination
}
```

**Implementation Details**:
- Test configurable inactivity timeout values
- Verify session timeout triggers correctly
- Test activity resets during near-timeout scenarios
- Validate session end event with 'inactivity' reason
- Test inactivity detection with page hidden/visible
- Verify cross-tab activity coordination

### Multi-Tab Coordination Tests (061-062)

**Test 061: Cross-Tab Session Coordination**
**Objective**: Validate multiple tabs coordinate properly through BroadcastChannel for session management

**Requirements**:
- Test session sharing across multiple tabs
- Validate session synchronization between tabs
- Test session event coordination (start/end)
- Verify activity sharing across tabs
- Test session timeout coordination
- Validate BroadcastChannel message reliability

**Cross-Tab Communication**:
```typescript
interface CrossTabMessages {
  sessionStart: SessionStartMessage;
  sessionEnd: SessionEndMessage;
  activity: ActivityMessage;
  heartbeat: HeartbeatMessage;
  leaderElection: LeaderElectionMessage;
  configUpdate: ConfigUpdateMessage;
}
```

**Implementation Details**:
- Test session creation and sharing across tabs
- Verify session ID consistency across tabs
- Test activity propagation between tabs
- Validate session timeout coordination
- Test BroadcastChannel reliability and fallbacks
- Verify message serialization/deserialization

**Multi-Tab Test Scenarios**:
- Open multiple tabs with same project ID
- Test session start in first tab propagation
- Verify activity in one tab extends session in others
- Test session end propagation across tabs
- Validate tab closure session cleanup
- Test BroadcastChannel unavailable fallback

**Test 062: Tab Leader Election and Management**
**Objective**: Test tab leader election works correctly when tabs are opened/closed and ensures only one tab manages session timing

**Requirements**:
- Test leader election algorithm correctness
- Validate leader responsibilities (session timing, cleanup)
- Test leader re-election when current leader closes
- Verify only leader manages session timeouts
- Test leader heartbeat and health monitoring
- Validate leader change notification propagation

**Leader Election Logic**:
```typescript
interface LeaderElection {
  algorithm: 'timestamp' | 'random' | 'priority';
  heartbeatInterval: number;   // Leader heartbeat (10s)
  electionTimeout: number;     // Election timeout (5s)
  leaderTTL: number;          // Leader validity (30s)
  responsibilities: string[];  // Leader duties
}
```

**Implementation Details**:
- Test leader election with multiple tabs
- Verify leader responsibilities isolation
- Test leader re-election on tab closure
- Validate heartbeat mechanism reliability
- Test leader failure detection and recovery
- Verify session timing only managed by leader

### Data Accuracy Tests (066-067)

**Test 066: Event Deduplication**
**Objective**: Test duplicate events are properly identified and deduplicated while preserving legitimate repeated events

**Requirements**:
- Test duplicate detection within time windows (5 minutes)
- Validate event fingerprinting for deduplication
- Test legitimate repeated event preservation
- Verify deduplication performance impact
- Test deduplication across page reloads
- Validate deduplication storage and cleanup

**Deduplication Strategy**:
```typescript
interface DeduplicationConfig {
  timeWindow: number;         // Deduplication window (5min)
  fingerprinting: 'content' | 'hash' | 'timestamp';
  maxCacheSize: number;      // Max dedupe cache (1000 events)
  storageKey: string;        // Persistent dedupe storage
  preserveTypes: string[];   // Events that allow duplicates
}
```

**Implementation Details**:
- Test duplicate detection accuracy
- Verify event fingerprinting algorithm
- Test deduplication cache management
- Validate storage-based deduplication persistence
- Test legitimate duplicate preservation
- Verify cleanup of old deduplication data

**Deduplication Test Cases**:
- Identical events within time window
- Similar events with minor differences
- Legitimate repeated events (multiple clicks)
- Events across page navigation
- High-frequency event deduplication
- Storage-based deduplication recovery

**Test 067: Timestamp Consistency and Accuracy**
**Objective**: Validate event timestamps are accurate, consistent, and properly ordered in the event queue

**Requirements**:
- Test timestamp accuracy against system time
- Validate timestamp consistency across events
- Test timestamp ordering in event queue
- Verify timestamp preservation across storage operations
- Test timezone handling and UTC normalization
- Validate high-resolution timestamp usage

**Timestamp Management**:
```typescript
interface TimestampConfig {
  precision: 'millisecond' | 'microsecond';
  source: 'Date.now' | 'performance.now' | 'hrtime';
  timezone: 'UTC' | 'local';
  ordering: boolean;         // Ensure chronological order
  accuracy: number;          // Acceptable drift (100ms)
}
```

**Implementation Details**:
- Test timestamp accuracy within acceptable range (±100ms)
- Verify event ordering preservation
- Test timestamp handling across time zones
- Validate high-resolution timestamp when available
- Test timestamp consistency during clock adjustments
- Verify timestamp serialization/deserialization

## System Reliability Metrics

### Performance Benchmarks
- Destroy operation: Complete cleanup within 500ms
- Memory growth: <5MB over 100 init/destroy cycles
- Activity detection latency: <50ms
- Cross-tab communication: <100ms message propagation
- Deduplication: <10ms per event check
- Timestamp accuracy: ±100ms from system time

### Reliability Requirements
- Zero memory leaks over extended operation
- 100% resource cleanup on destroy
- 99.9% activity detection accuracy
- Cross-tab coordination 99% reliability
- <0.1% false positive deduplication rate
- Timestamp ordering 100% consistency

## Success Criteria

### Lifecycle Management
- [ ] Library destroy completely cleans up all resources
- [ ] No memory leaks detected over multiple init/destroy cycles
- [ ] All timers, listeners, and observers properly cleaned up
- [ ] Storage cleanup removes project-specific data

### Activity and Session Management
- [ ] User activity detected accurately across all input methods
- [ ] Inactivity detection triggers session timeout correctly
- [ ] Cross-tab coordination maintains session consistency
- [ ] Leader election ensures single session manager

### Data Integrity
- [ ] Event deduplication prevents duplicates while preserving legitimate repeats
- [ ] Timestamps accurate and consistently ordered
- [ ] Data accuracy maintained across all system operations

## Test Implementation Guidelines

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
- Configure memory monitoring and profiling tools
- Set up multi-tab test scenarios with controlled timing
- Create high-frequency event generation for stress testing
- Implement precise timestamp accuracy measurement

### Reliability Testing
- Use browser development tools for memory analysis
- Test with various system clock conditions
- Validate cross-tab scenarios with controlled tab lifecycle
- Test deduplication with comprehensive event patterns

## Branching Requirements
- Start branch from: `refactor/playwright-e2e-tests`
- Merge changes into: `develop`

## Definition of Done

- [ ] All 8 test cases implemented and passing consistently
- [ ] Library cleanup and memory management validated thoroughly
- [ ] Activity detection and inactivity handling working correctly
- [ ] Multi-tab coordination and leader election functioning properly
- [ ] Event deduplication and timestamp accuracy verified
- [ ] Performance benchmarks met for all reliability operations
- [ ] Cross-browser compatibility confirmed for all reliability features
- [ ] Long-term stability tested with extended operation cycles
- [ ] Documentation updated with system reliability specifications