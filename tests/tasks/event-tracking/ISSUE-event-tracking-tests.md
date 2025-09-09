# E2E Testing: Event Tracking Tests

## Overview

This issue covers the implementation of **14 E2E tests** for event tracking functionality in the TraceLog SDK. These tests validate custom events, automatic page view tracking, click interactions, and scroll behavior monitoring.

## Test Coverage

### Custom Event Tracking (4 tests)
- [ ] **011**: Valid custom events with TraceLog.event()
- [ ] **012**: Invalid event name handling and error messages
- [ ] **013**: Invalid metadata validation and sanitization
- [ ] **014**: Metadata sanitization for XSS prevention

### Page View Tracking (3 tests)
- [ ] **015**: Initial page view tracking on library initialization
- [ ] **016**: Navigation event tracking (pushState, replaceState, popstate)
- [ ] **017**: URL normalization and sensitive parameter removal

### Click Tracking (4 tests)
- [ ] **018**: Interactive element click tracking with coordinates
- [ ] **019**: Custom data attributes (data-tl-name, data-tl-value)
- [ ] **020**: Text content extraction from clicked elements
- [ ] **021**: Coordinate calculation for various element sizes

### Scroll Tracking (3 tests)
- [ ] **022**: Window scroll tracking with depth percentages
- [ ] **023**: Custom container scroll tracking
- [ ] **024**: Scroll event suppression after page views

## Detailed Test Requirements

### Custom Event Tests (011-014)

**Test 011: Valid Custom Events**
- Validate TraceLog.event() with valid names and metadata
- Verify data sanitization and API delivery
- Test metadata object structures and size limits
- Confirm event queuing and batching behavior

**Test 012: Invalid Event Names**
- Test rejection of names that are too long (>100 characters)
- Validate XSS pattern detection in event names
- Verify reserved word blocking
- Ensure QA mode shows appropriate error messages

**Test 013: Invalid Metadata**
- Test circular reference detection and handling
- Validate metadata size limits (>10KB rejection)
- Verify invalid type handling (functions, symbols)
- Ensure QA mode error reporting

**Test 014: Metadata Sanitization**
- Test XSS pattern removal from metadata values
- Validate script tag filtering
- Verify preservation of legitimate data
- Confirm sanitization doesn't break valid content

### Page View Tests (015-017)

**Test 015: Initial Page Load**
- Validate automatic page view on TraceLog.init()
- Test URL, referrer, title extraction
- Verify UTM parameter capture
- Confirm timing accuracy

**Test 016: Navigation Events**
- Test history.pushState navigation tracking
- Validate history.replaceState handling
- Verify popstate event detection
- Test hashchange event tracking
- Confirm from_page_url accuracy

**Test 017: URL Normalization**
- Test sensitive query parameter removal
- Validate URL component preservation
- Verify configuration-based filtering
- Test edge cases with complex URLs

### Click Tracking Tests (018-021)

**Test 018: Interactive Elements**
- Test button, link, and form element tracking
- Validate coordinate capture (absolute and relative)
- Verify element attribute extraction
- Test event timing and accuracy

**Test 019: Custom Data Attributes**
- Test data-tl-name custom event generation
- Validate data-tl-value metadata extraction
- Verify combination with standard click tracking
- Test attribute inheritance from parent elements

**Test 020: Text Content Extraction**
- Test text extraction from various element types
- Validate handling of large text containers
- Verify text truncation (>200 characters)
- Test nested element text aggregation

**Test 021: Coordinate Calculation**
- Test absolute coordinate calculation
- Validate relative coordinates within elements
- Verify handling of scrolled containers
- Test coordinates for various element sizes

### Scroll Tracking Tests (022-024)

**Test 022: Window Scroll**
- Test scroll depth percentage calculation
- Validate scroll direction detection (up/down)
- Verify debouncing behavior (200ms)
- Test maximum depth tracking

**Test 023: Custom Container Scroll**
- Test scroll tracking in custom containers
- Validate CSS selector-based configuration
- Verify multiple container handling
- Test nested scrollable elements

**Test 024: Scroll Suppression**
- Test scroll event suppression after page views
- Validate 2-second suppression window
- Verify automatic scroll detection prevention
- Test manual vs automatic scroll differentiation

## Implementation Details

### Test Environment Setup
- Use Playwright for E2E testing
- Create test pages with various interaction elements
- Mock API endpoints for event validation
- Set up different container configurations for scroll tests

### Event Validation
- Verify event structure matches API specifications
- Test event metadata completeness
- Validate timing accuracy and event ordering
- Confirm deduplication behavior

### Browser Testing
- Test across Chrome, Firefox, Safari, Edge
- Validate mobile touch interactions
- Test different screen sizes and orientations
- Verify accessibility interactions

## Success Criteria

### Functional Requirements
- [ ] All 14 tests pass consistently across browsers
- [ ] Event data structure matches API specifications
- [ ] No false positives or missed events
- [ ] Proper error handling in QA mode

### Performance Requirements
- [ ] Event capture latency < 50ms
- [ ] No impact on page scroll performance
- [ ] Click tracking doesn't delay user interactions
- [ ] Memory usage remains stable during testing

### Data Quality Requirements
- [ ] Coordinate calculations accurate within 5px
- [ ] Text extraction preserves meaningful content
- [ ] URL normalization removes sensitive data
- [ ] Metadata sanitization prevents XSS

## Branching Requirements
- Start branch from: `refactor/playwright-e2e-tests`
- Merge changes into: `develop`

## Definition of Done

- [ ] All 14 test cases implemented and passing
- [ ] Cross-browser compatibility validated
- [ ] Performance benchmarks met
- [ ] Event data accuracy verified
- [ ] QA mode error handling tested
- [ ] Documentation updated with test coverage details