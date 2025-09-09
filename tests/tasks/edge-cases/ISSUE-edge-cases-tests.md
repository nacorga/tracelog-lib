# E2E Testing: Edge Cases Tests

## Overview

This issue covers the implementation of **3 E2E tests** for edge cases and comprehensive integration testing in the TraceLog SDK. These tests validate behavior during rapid navigation scenarios, large payload handling, and complete user journey integration.

## Test Coverage

### Edge Cases and Integration (3 tests)
- [ ] **068**: Rapid navigation scenarios and state management
- [ ] **069**: Large payload handling and size limits
- [ ] **070**: Full user journey integration test

## Detailed Test Requirements

### Test 068: Rapid Navigation Scenarios
**Objective**: Test behavior during rapid page navigation, ensuring events are not lost and session continuity is maintained

**Requirements**:
- Test rapid page navigation (SPA routing and full page loads)
- Validate event queue persistence during navigation
- Test session continuity across rapid navigation
- Verify no event loss during fast page transitions
- Test concurrent navigation and event processing
- Validate state management during navigation interruptions

**Rapid Navigation Scenarios**:
```typescript
interface NavigationScenarios {
  spaRouting: {
    frequency: number;        // Navigation frequency (every 100ms)
    routeCount: number;       // Number of routes to navigate (50+)
    eventsDuringNav: boolean; // Generate events during navigation
  };
  pageReloads: {
    frequency: number;        // Reload frequency (every 500ms)
    reloadCount: number;      // Number of reloads (20+)
    persistenceTest: boolean; // Test data persistence
  };
  mixedNavigation: {
    spaAndReload: boolean;    // Mix SPA routing and page reloads
    backForward: boolean;     // Browser back/forward navigation
    newTabsWindows: boolean;  // New tab/window creation
  };
}
```

**Implementation Details**:
- Test navigation using history.pushState() and history.replaceState()
- Verify popstate event handling during rapid navigation
- Test page reload scenarios with event queue persistence
- Validate session ID consistency across navigation
- Test event ordering preservation during navigation
- Verify cleanup and initialization cycles

**Navigation Test Cases**:
- **SPA Rapid Routing**: Navigate between routes every 100ms for 5 seconds
- **Page Reload Stress**: Reload page every 500ms for 10 iterations
- **Back/Forward Navigation**: Rapid browser navigation history traversal
- **Mixed Navigation**: Combination of SPA routing and page reloads
- **Interrupted Navigation**: Navigation during ongoing operations
- **Concurrent Events**: Generate events during active navigation

**State Management Validation**:
- Session continuity across all navigation types
- Event queue persistence and recovery
- Configuration state preservation
- User ID consistency maintenance
- Storage state integrity
- Cross-tab coordination during navigation

### Test 069: Large Payload Handling
**Objective**: Validate handling of events with large metadata objects, ensuring they are either accepted or gracefully rejected with clear errors

**Requirements**:
- Test event metadata size limits (10KB default limit)
- Validate large payload rejection with clear error messages
- Test payload compression and optimization
- Verify memory usage during large payload processing
- Test batch transmission with mixed payload sizes
- Validate QA mode error reporting for oversized payloads

**Payload Size Testing**:
```typescript
interface PayloadSizeTests {
  limits: {
    eventName: number;        // Event name limit (100 chars)
    metadata: number;         // Metadata limit (10KB)
    totalEvent: number;       // Total event size limit (15KB)
    batchSize: number;        // Batch payload limit (1MB)
  };
  testSizes: number[];        // Test payload sizes [1KB, 5KB, 10KB, 20KB, 100KB]
  errorHandling: boolean;     // Test error scenarios
  compression: boolean;       // Test payload compression
}
```

**Implementation Details**:
- Generate test payloads of various sizes
- Test metadata size validation and enforcement
- Verify graceful handling of oversized payloads
- Test batch size limits and splitting
- Validate error messages in QA mode
- Test memory usage during large payload processing

**Large Payload Test Cases**:
- **Gradual Size Increase**: Test payloads from 1KB to 100KB
- **Exact Limit Testing**: Test payloads at exactly 10KB limit
- **Oversized Rejection**: Test payloads exceeding limits
- **Nested Object Depth**: Deep object nesting within size limits
- **Array Payload Testing**: Large arrays within metadata
- **Mixed Batch Sizes**: Batches with varied payload sizes

**Error Handling Validation**:
- Clear error messages for oversized payloads
- Graceful degradation without SDK crashes
- QA mode detailed error reporting
- Production mode silent handling
- Event logging for debugging purposes
- Recovery from payload processing errors

### Test 070: Full User Journey Integration Test
**Objective**: Test complete user journey from library initialization through various interactions to session end, validating all events are tracked correctly

**Requirements**:
- Test end-to-end user journey with all SDK features
- Validate event tracking across complete user session
- Test integration of all SDK components working together
- Verify event ordering and completeness
- Test realistic user interaction patterns
- Validate session lifecycle and event correlation

**Complete User Journey Flow**:
```typescript
interface UserJourneySteps {
  initialization: {
    sdkInit: boolean;         // Library initialization
    configLoading: boolean;   // Remote config loading
    userIdGeneration: boolean; // User ID creation
    sessionStart: boolean;    // Session initiation
  };
  userInteractions: {
    pageViews: number;        // Multiple page navigation
    clicks: number;           // Click interactions
    scrolling: boolean;       // Scroll events
    customEvents: number;     // Custom business events
    formInteractions: boolean; // Form submissions
  };
  sessionManagement: {
    crossTab: boolean;        // Multi-tab coordination
    inactivity: boolean;      // Inactivity handling
    sessionRecovery: boolean; // Session recovery testing
    sessionEnd: boolean;      // Proper session termination
  };
  dataValidation: {
    eventOrdering: boolean;   // Chronological event order
    dataAccuracy: boolean;    // Event data accuracy
    sessionCorrelation: boolean; // Events linked to session
    noDataLoss: boolean;      // Complete data preservation
  };
}
```

**Implementation Details**:
- Simulate realistic 15-minute user session
- Test all major SDK features in sequence
- Validate event data accuracy and completeness
- Test session correlation across all events
- Verify performance metrics collection
- Test error handling during complete journey

**User Journey Test Scenario**:
1. **Session Start (0:00)**:
   - SDK initialization with valid project ID
   - Remote configuration loading
   - User ID generation and storage
   - Initial page view tracking
   - Session start event generation

2. **Active Usage (0:01-10:00)**:
   - Navigate to 5 different pages with automatic page view tracking
   - Perform 20+ click interactions on various elements
   - Scroll through long content pages
   - Generate 10 custom business events
   - Submit forms with validation

3. **Multi-Tab Activity (5:00-8:00)**:
   - Open additional tabs with same project
   - Test cross-tab session coordination
   - Verify activity in one tab extends session in others
   - Test tab leader election and management

4. **Performance Monitoring (ongoing)**:
   - Web Vitals collection throughout session
   - Error tracking for any JavaScript errors
   - Performance impact measurement

5. **Session End (15:00)**:
   - Inactivity timeout or explicit session end
   - Final event queue flush
   - Session end event generation
   - Cleanup and resource disposal

**Integration Validation Points**:
- All components working together seamlessly
- No conflicts between different SDK features
- Event ordering and timing accuracy
- Session continuity across all interactions
- Data integrity throughout entire journey
- Performance remains stable during extended use

## Edge Case Performance Requirements

### Rapid Navigation Performance
- Navigation event processing: <50ms per navigation
- State persistence during navigation: <100ms
- Session continuity maintenance: <10ms overhead
- Event queue recovery after navigation: <200ms

### Large Payload Performance
- Payload size validation: <5ms per event
- Large payload rejection: <10ms processing time
- Batch size optimization: <100ms per batch
- Memory usage during large payload: <20MB peak

### Full Journey Performance
- Complete journey tracking overhead: <5% of total page performance
- Event processing latency: <50ms average
- Session management overhead: <10ms per interaction
- Data accuracy maintained throughout: 100% preservation

## Comprehensive Validation

### Data Integrity Checks
- Event completeness across entire journey
- Timestamp accuracy and ordering
- Session correlation for all events
- No duplicate or missing events
- Metadata preservation and accuracy

### Performance Monitoring
- Memory usage throughout complete journey
- CPU impact during intensive operations
- Network performance during event transmission
- Battery usage consideration for mobile devices

### Error Recovery Testing
- Recovery from navigation interruptions
- Handling of payload processing errors
- Session recovery after unexpected failures
- Graceful degradation during edge conditions

## Success Criteria

### Rapid Navigation
- [ ] No event loss during rapid navigation scenarios
- [ ] Session continuity maintained across all navigation types
- [ ] State management remains consistent during navigation
- [ ] Performance impact acceptable during rapid navigation

### Large Payload Handling
- [ ] Size limits enforced consistently with clear error messages
- [ ] Memory usage remains stable during large payload processing
- [ ] Batch handling works correctly with mixed payload sizes
- [ ] Graceful degradation for oversized payloads

### Complete User Journey
- [ ] All SDK features work together seamlessly
- [ ] Event tracking complete and accurate throughout journey
- [ ] Session management maintains consistency
- [ ] Performance remains stable during extended use
- [ ] Data integrity preserved from start to finish

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
- Create realistic user journey simulation scripts
- Set up performance monitoring and memory profiling
- Configure large payload generation and validation
- Implement navigation stress testing scenarios

### Validation Framework
- Comprehensive event validation across complete journey
- Performance impact measurement throughout testing
- Memory usage monitoring during edge case scenarios
- Data integrity verification at multiple checkpoints

## Branching Requirements
- Start branch from: `refactor/playwright-e2e-tests`
- Merge changes into: `develop`

## Definition of Done

- [ ] All 3 test cases implemented and passing consistently
- [ ] Rapid navigation scenarios validated without event loss
- [ ] Large payload handling tested with proper size limit enforcement
- [ ] Complete user journey integration verified end-to-end
- [ ] Performance requirements met for all edge case scenarios
- [ ] Data integrity maintained throughout all test scenarios
- [ ] Cross-browser compatibility confirmed for all edge cases
- [ ] Memory usage and performance impact measured and acceptable
- [ ] Documentation updated with edge case handling specifications