# E2E Testing: Performance Tracking Tests

## Overview

This issue covers the implementation of **4 E2E tests** for performance tracking functionality in the TraceLog SDK. These tests validate Web Vitals collection, long task detection, fallback mechanisms, and library performance impact assessment.

## Test Coverage

### Performance Metrics (4 tests)
- [ ] **025**: Web Vitals collection (LCP, CLS, FCP, TTFB, INP)
- [ ] **026**: Long task detection with throttling
- [ ] **027**: Web Vitals fallback mechanisms
- [ ] **065**: Library performance impact assessment

## Detailed Test Requirements

### Test 025: Web Vitals Collection
**Objective**: Validate Core Web Vitals metrics are collected and reported accurately

**Requirements**:
- Test LCP (Largest Contentful Paint) detection and timing
- Validate CLS (Cumulative Layout Shift) score calculation
- Verify FCP (First Contentful Paint) measurement
- Test TTFB (Time to First Byte) accuracy
- Validate INP (Interaction to Next Paint) for user interactions
- Confirm proper sampling configuration (default 10%)
- Test metric reporting to API endpoint

**Implementation Details**:
- Create test pages with known performance characteristics
- Use web-vitals library integration
- Validate metric values against expected ranges
- Test sampling behavior with different rates
- Verify event structure and metadata

### Test 026: Long Task Detection
**Objective**: Ensure long tasks are detected and tracked with appropriate throttling

**Requirements**:
- Test detection of tasks >50ms duration
- Validate task attribution to scripts/functions
- Verify throttling prevents excessive events (max 10/minute)
- Test sampling application (default 1% for long tasks)
- Confirm task metadata includes duration and start time
- Test PerformanceObserver integration

**Implementation Details**:
- Create artificial long tasks with setTimeout
- Verify task detection accuracy
- Test throttling behavior with rapid long tasks
- Validate event payload structure
- Test graceful handling when PerformanceObserver unavailable

### Test 027: Web Vitals Fallback
**Objective**: Validate fallback performance tracking when web-vitals library unavailable

**Requirements**:
- Test native PerformanceObserver API usage
- Validate metric calculation without web-vitals dependency
- Verify fallback accuracy compared to web-vitals
- Test graceful degradation when APIs unavailable
- Confirm event structure consistency

**Implementation Details**:
- Mock web-vitals library unavailability
- Test native Performance API implementations
- Validate metric accuracy within acceptable ranges
- Test browser compatibility for fallback methods
- Verify error handling for unsupported browsers

### Test 065: Library Performance Impact
**Objective**: Assess TraceLog SDK impact on host application performance

**Requirements**:
- Test library initialization time (<100ms)
- Validate memory usage impact (<5MB under normal operation)
- Verify no memory leaks after 1000+ events
- Test event processing latency (<50ms per event)
- Confirm passive event listeners usage
- Validate non-blocking behavior on main thread

**Implementation Details**:
- Measure performance before/after library initialization
- Monitor memory usage during extended test runs
- Test with high-frequency event generation
- Validate CPU usage during event processing
- Use Performance.measureUserAgentSpecificMemory where available

## Browser-Specific Testing

### Chrome/Chromium
- Full Web Vitals support validation
- PerformanceObserver long task detection
- Memory measurement APIs
- DevTools performance profiling integration

### Firefox
- Alternative performance measurement methods
- Graceful degradation testing
- Performance API compatibility
- Memory usage monitoring

### Safari
- WebKit-specific performance metrics
- Mobile Safari performance testing
- Touch interaction performance
- Battery usage considerations

### Edge
- Chromium-based feature validation
- Legacy Edge compatibility testing
- Performance comparison with Chrome

## Performance Benchmarks

### Acceptable Ranges
- **LCP**: 0-4000ms (varies by page complexity)
- **CLS**: 0-0.5 (layout stability)
- **FCP**: 0-2000ms (first paint timing)
- **TTFB**: 0-800ms (server response)
- **INP**: 0-500ms (interaction responsiveness)

### Library Overhead Limits
- **Initialization**: <100ms
- **Event Processing**: <50ms per event
- **Memory Usage**: <5MB baseline
- **CPU Usage**: <5% during active tracking

## Success Criteria

### Functional Requirements
- [ ] All 4 performance tests pass consistently
- [ ] Web Vitals metrics within expected ranges
- [ ] Long task detection accuracy >95%
- [ ] Fallback mechanisms work without web-vitals
- [ ] Library overhead within acceptable limits

### Performance Requirements
- [ ] Metric collection doesn't impact page performance
- [ ] Event processing doesn't block main thread
- [ ] Memory usage remains stable over time
- [ ] No performance regressions in host application

### Compatibility Requirements
- [ ] Works across all target browsers
- [ ] Graceful degradation in unsupported environments
- [ ] Mobile performance equivalent to desktop
- [ ] No conflicts with other performance monitoring

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

### Test Environment
- Use Playwright with performance monitoring enabled
- Create controlled performance scenarios
- Implement memory leak detection
- Set up performance baseline measurements

### Data Validation
- Compare against known performance tools
- Validate sampling rate application
- Test event deduplication for performance metrics
- Verify timestamp accuracy and consistency

## Branching Requirements
- Start branch from: `refactor/playwright-e2e-tests`
- Merge changes into: `develop`

## Definition of Done

- [ ] All 4 test cases implemented and passing
- [ ] Performance benchmarks validated across browsers
- [ ] Library overhead measured and within limits
- [ ] Fallback mechanisms tested and working
- [ ] Memory leak testing completed successfully
- [ ] Cross-browser compatibility verified
- [ ] Documentation updated with performance specifications