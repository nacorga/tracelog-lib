# E2E Testing: Queue Management Tests

## Overview

This issue covers the implementation of **4 E2E tests** for event queue management functionality in the TraceLog SDK. These tests validate event queuing, batching, transmission, queue persistence, size limits, and immediate flush capabilities.

## Test Coverage

### Event Queue Operations (4 tests)
- [ ] **036**: Event queue processing and batching
- [ ] **037**: Queue persistence across page loads
- [ ] **038**: Queue size limits and overflow handling
- [ ] **039**: Immediate flush capabilities (sync/async)

## Detailed Test Requirements

### Test 036: Event Queue Processing and Batching
**Objective**: Validate events are properly queued, batched, and sent to the API endpoint with deduplication

**Requirements**:
- Test event queuing with automatic batching (default 10 events or 30 seconds)
- Validate event deduplication within queue (5-minute threshold)
- Verify batch transmission to API endpoint with correct payload format
- Test queue processing intervals and timing
- Confirm retry logic for failed batch transmissions
- Validate event ordering preservation in queue

**Implementation Details**:
- Generate multiple events rapidly and test queuing behavior
- Test batch size threshold triggering (10 events)
- Test time-based batching (30-second intervals)
- Verify deduplication logic for identical events
- Test network failure scenarios with retry mechanisms
- Validate batch payload structure and compression

**Queue Processing Logic**:
```typescript
interface EventQueue {
  maxSize: number;           // Maximum events in queue (1000)
  batchSize: number;         // Events per batch (10)
  flushInterval: number;     // Automatic flush interval (30s)
  deduplicationWindow: number; // Duplicate detection window (5min)
}
```

**Test Scenarios**:
- Rapid event generation (>10 events quickly)
- Slow event generation (time-based batching)
- Duplicate event filtering
- Network failure during batch transmission
- Queue state consistency across processing cycles
- Batch retry with exponential backoff

### Test 037: Queue Persistence Across Page Loads
**Objective**: Ensure unsent events are persisted to storage and recovered after page reload or browser restart

**Requirements**:
- Test queue state persistence to localStorage on page unload
- Validate queue recovery on page load with preserved event order
- Verify unsent events are not lost during navigation
- Test queue state consistency across browser sessions
- Confirm queue cleanup after successful transmission
- Validate queue size limits persist across reloads

**Implementation Details**:
- Add events to queue and trigger page reload before transmission
- Test queue recovery with exact event preservation
- Verify timestamp consistency for recovered events
- Test queue persistence with localStorage unavailable
- Validate queue state cleanup after successful batch sending
- Test navigation scenarios (SPA routing, page refresh, browser restart)

**Persistence Scenarios**:
- Page reload with pending events in queue
- Browser restart with unsent events
- Navigation between pages with queued events
- Multiple tabs with separate queue states
- Storage unavailable fallback behavior
- Queue corruption recovery mechanisms

### Test 038: Queue Size Limits and Overflow Handling
**Objective**: Validate event queues don't exceed maximum size limits and oldest events are discarded appropriately

**Requirements**:
- Test maximum queue size enforcement (default 1000 events)
- Validate oldest event removal when limit exceeded (FIFO behavior)
- Verify queue size monitoring and reporting
- Test memory usage optimization for large queues
- Confirm queue performance remains stable at maximum capacity
- Validate queue size configuration and limits

**Implementation Details**:
- Generate events beyond maximum queue size
- Test FIFO (First In, First Out) overflow behavior
- Verify memory usage doesn't grow unbounded
- Test queue size reporting and monitoring
- Validate configuration of custom queue limits
- Test performance with maximum queue capacity

**Queue Size Management**:
```typescript
interface QueueLimits {
  maxEvents: number;         // Maximum events (1000)
  maxMemory: number;         // Memory limit estimation
  cleanupThreshold: number;  // Cleanup trigger point (900)
  evictionStrategy: 'fifo' | 'priority'; // Overflow handling
}
```

**Overflow Test Scenarios**:
- Gradual queue filling to maximum capacity
- Rapid event generation exceeding limits
- Queue cleanup and memory optimization
- Priority-based event retention
- Storage space limitations affecting queue size
- Performance impact at maximum capacity

### Test 039: Immediate Flush Capabilities
**Objective**: Test events can be immediately flushed using both async and sync methods, particularly during page unload

**Requirements**:
- Test `EventManager.flush()` for immediate async queue processing
- Validate `EventManager.flushSync()` for synchronous transmission during page unload
- Verify `navigator.sendBeacon()` usage for reliable page unload transmission
- Test flush operations don't interfere with normal queue processing
- Confirm successful transmission acknowledgment for flushed events
- Validate flush failure handling and fallback mechanisms

**Implementation Details**:
- Test manual flush triggering with immediate transmission
- Test synchronous flush during `beforeunload` event
- Verify `sendBeacon()` usage for guaranteed delivery
- Test flush operations with network failures
- Validate queue state after successful/failed flush operations
- Test concurrent flush and normal queue processing

**Flush Mechanisms**:
```typescript
interface FlushCapabilities {
  flush(): Promise<boolean>;          // Async flush with retry
  flushSync(): boolean;              // Sync flush for page unload
  autoFlush: boolean;                // Enable automatic flushing
  flushOnUnload: boolean;            // Flush on page unload
}
```

**Flush Test Scenarios**:
- Manual flush during active session
- Automatic flush on page unload/beforeunload
- Flush during network connectivity issues
- Concurrent flush operations
- Flush with empty vs populated queue
- Flush failure recovery and retry

## Queue Event Structure

### Queue Event Format
```typescript
interface QueuedEvent {
  id: string;                // Unique event identifier
  timestamp: Date;           // Event creation time
  type: EventType;           // Event type classification
  data: any;                 // Event-specific data
  metadata?: any;            // Additional metadata
  retryCount?: number;       // Failed transmission attempts
  queuedAt: Date;           // Time added to queue
}
```

### Batch Transmission Format
```typescript
interface EventBatch {
  projectId: string;         // Target project identifier
  events: QueuedEvent[];     // Batch of events
  batchId: string;          // Unique batch identifier
  timestamp: Date;          // Batch creation time
  compressed?: boolean;     // Compression applied
}
```

## Performance Requirements

### Queue Operations Performance
- Event queuing: <5ms per event
- Queue deduplication: <10ms per duplicate check
- Batch processing: <100ms per batch (10 events)
- Queue persistence: <50ms for full queue save
- Queue recovery: <100ms for full queue restoration

### Memory Management
- Queue memory usage: <10MB for 1000 events
- Memory cleanup after batch transmission
- Efficient event serialization/deserialization
- Garbage collection optimization

## Network and Reliability Testing

### Transmission Scenarios
- Successful batch transmission with 200 response
- Network failures (timeout, connection refused)
- Server errors (500, 503) with retry logic
- Rate limiting (429) with exponential backoff
- Large batch transmission (>100KB payload)

### Reliability Requirements
- Event loss prevention during network issues
- Queue integrity across application lifecycle
- Atomic batch operations (all or nothing)
- Idempotent retry mechanisms

## Success Criteria

### Functional Requirements
- [ ] All 4 queue management tests pass consistently
- [ ] Event batching works with size and time triggers
- [ ] Queue persistence prevents event loss during navigation
- [ ] Queue size limits prevent memory exhaustion
- [ ] Immediate flush works for critical scenarios

### Performance Requirements
- [ ] Queue operations meet performance benchmarks
- [ ] Memory usage remains within acceptable limits
- [ ] Queue processing doesn't block main thread
- [ ] Batch transmission completes within timeout

### Reliability Requirements
- [ ] No event loss during normal operations
- [ ] Queue recovery works after all failure scenarios
- [ ] Network failures handled gracefully with retry
- [ ] Queue state consistency maintained

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
- Mock API endpoints for batch reception
- Simulate network failures and delays
- Test with various batch sizes and intervals
- Create high-frequency event generation scenarios

### Queue State Validation
- Verify event ordering preservation
- Test deduplication algorithm accuracy
- Validate queue size calculations
- Confirm persistence state consistency

## Branching Requirements
- Start branch from: `refactor/playwright-e2e-tests`
- Merge changes into: `develop`

## Definition of Done

- [ ] All 4 test cases implemented and passing
- [ ] Event queuing and batching validated thoroughly
- [ ] Queue persistence tested across all scenarios
- [ ] Size limits and overflow handling working correctly
- [ ] Immediate flush capabilities tested for reliability
- [ ] Cross-browser compatibility verified
- [ ] Performance requirements met for all operations
- [ ] Network failure scenarios handled appropriately
- [ ] Documentation updated with queue management specifications