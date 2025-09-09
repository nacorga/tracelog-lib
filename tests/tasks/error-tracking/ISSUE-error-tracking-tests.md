# E2E Testing: Error Tracking Tests

## Overview

This issue covers the implementation of **3 E2E tests** for error tracking functionality in the TraceLog SDK. These tests validate JavaScript error capture, network error monitoring, and PII sanitization in error messages.

## Test Coverage

### Error Capture Tests (3 tests)
- [ ] **028**: JavaScript error and promise rejection tracking
- [ ] **029**: Network error monitoring (fetch/XHR)
- [ ] **030**: PII sanitization in error messages

## Detailed Test Requirements

### Test 028: JavaScript Error Tracking
**Objective**: Validate JavaScript errors and unhandled promise rejections are captured with appropriate sampling

**Requirements**:
- Test global `window.onerror` handler registration
- Validate `unhandledrejection` event capture
- Verify error message sanitization and stack trace capture
- Test sampling application (default 10% for errors)
- Confirm QA mode bypasses sampling (100% capture)
- Validate error event structure and metadata

**Implementation Details**:
- Trigger various JavaScript errors (syntax, runtime, reference)
- Create unhandled promise rejections
- Test error sampling with different rates
- Verify stack trace preservation and sanitization
- Test error deduplication within time windows
- Validate error source file and line number capture

**Test Scenarios**:
- Synchronous JavaScript errors
- Asynchronous errors in callbacks
- Promise rejection errors
- Errors in event listeners
- Errors in setTimeout/setInterval
- Module loading errors

### Test 029: Network Error Monitoring
**Objective**: Ensure failed HTTP requests are tracked with error details and duration information

**Requirements**:
- Test failed `fetch()` request tracking
- Validate `XMLHttpRequest` error monitoring
- Verify error details capture (status codes, response times)
- Test network timeout handling
- Confirm duration measurement accuracy
- Validate error event payload structure

**Implementation Details**:
- Create failing API requests (404, 500, network timeout)
- Test both fetch and XHR request failures
- Measure request duration accuracy
- Validate error metadata completeness
- Test CORS error handling
- Verify request URL sanitization

**Test Scenarios**:
- 404 Not Found responses
- 500 Internal Server Error responses
- Network timeout errors
- CORS-blocked requests
- DNS resolution failures
- Connection refused errors

### Test 030: PII Sanitization in Error Messages
**Objective**: Verify error messages containing sensitive data are properly sanitized before tracking

**Requirements**:
- Test email pattern detection and sanitization
- Validate phone number pattern removal
- Verify credit card number sanitization
- Test URL parameter sanitization in error messages
- Confirm legitimate data preservation
- Validate sanitization doesn't break error debugging

**Implementation Details**:
- Create errors with embedded PII in messages
- Test regex pattern matching for sensitive data
- Verify sanitization replacement patterns
- Test edge cases with partial matches
- Validate performance impact of sanitization
- Test sanitization in stack traces

**PII Patterns to Test**:
- Email addresses: `user@example.com` → `[EMAIL]`
- Phone numbers: `(555) 123-4567` → `[PHONE]`
- Credit cards: `4111-1111-1111-1111` → `[CARD]`
- SSN patterns: `123-45-6789` → `[SSN]`
- URLs with tokens: `api.com?token=abc123` → `api.com?token=[REDACTED]`

## Error Event Structure

### Standard Error Event
```typescript
{
  type: 'ERROR',
  timestamp: Date,
  sessionId: string,
  error: {
    message: string,        // Sanitized error message
    source: string,         // Source file URL (sanitized)
    lineno: number,         // Line number
    colno: number,          // Column number
    stack: string,          // Sanitized stack trace
    type: 'javascript' | 'network' | 'promise',
    sampled: boolean
  }
}
```

### Network Error Event
```typescript
{
  type: 'ERROR',
  timestamp: Date,
  sessionId: string,
  error: {
    message: string,        // HTTP error description
    type: 'network',
    url: string,           // Sanitized request URL
    method: string,        // HTTP method
    status: number,        // HTTP status code
    duration: number,      // Request duration in ms
    sampled: boolean
  }
}
```

## Browser Compatibility Testing

### Modern Browsers
- Test full error handling API support
- Validate Error object property access
- Test Promise.allSettled error handling
- Verify fetch API error scenarios

### Legacy Browser Support
- Test graceful degradation for missing APIs
- Validate XHR error handling fallbacks
- Test error object property compatibility
- Verify stack trace availability

## Performance Considerations

### Sampling Strategy
- Default 10% sampling rate for errors
- QA mode 100% sampling override
- Configurable sampling per error type
- Rate limiting for high-frequency errors

### Memory Management
- Error message size limits (max 1KB)
- Stack trace truncation (max 2KB)
- Error event deduplication (5-minute window)
- Cleanup of error event listeners

## Success Criteria

### Functional Requirements
- [ ] All 3 error tracking tests pass consistently
- [ ] JavaScript errors captured with accurate metadata
- [ ] Network errors include timing and status information
- [ ] PII sanitization removes sensitive data effectively
- [ ] Error sampling rates applied correctly

### Data Quality Requirements
- [ ] Error messages remain useful after sanitization
- [ ] Stack traces preserve debugging information
- [ ] Error source attribution is accurate
- [ ] Network error timing is precise (<50ms accuracy)

### Performance Requirements
- [ ] Error handling doesn't impact page performance
- [ ] Sanitization processing <10ms per error
- [ ] Memory usage remains stable with frequent errors
- [ ] No error tracking loops or recursion

## Security Requirements

### PII Protection
- [ ] Email addresses fully sanitized
- [ ] Phone numbers completely removed
- [ ] Credit card patterns detected and masked
- [ ] URL parameters with tokens sanitized
- [ ] No sensitive data in error payloads

### Error Information Preservation
- [ ] Debugging information remains useful
- [ ] Stack traces maintain structural integrity
- [ ] Error types and categories preserved
- [ ] Source file references remain meaningful

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
- Create controlled error scenarios
- Mock network failures and timeouts
- Set up PII injection test cases
- Configure error sampling rates for testing

### Error Validation
- Compare captured errors against expected patterns
- Validate error event timing accuracy
- Test error deduplication behavior
- Verify sampling rate compliance

## Branching Requirements
- Start branch from: `refactor/playwright-e2e-tests`
- Merge changes into: `develop`

## Definition of Done

- [ ] All 3 test cases implemented and passing
- [ ] JavaScript and network error capture validated
- [ ] PII sanitization thoroughly tested
- [ ] Cross-browser compatibility verified
- [ ] Performance impact measured and acceptable
- [ ] Security requirements met for data protection
- [ ] Error sampling behavior validated
- [ ] Documentation updated with error handling specifications