# E2E Testing: Integrations Tests

## Overview

This issue covers the implementation of **5 E2E tests** for external integrations in the TraceLog SDK. These tests validate Google Analytics integration, API communication, error handling, and rate limiting compliance.

## Test Coverage

### External Integrations (5 tests)

#### Google Analytics Integration (2 tests)
- [ ] **046**: Google Analytics initialization and setup
- [ ] **047**: Event forwarding to Google Analytics

#### API Communication (3 tests)
- [ ] **050**: Event delivery to TraceLog API
- [ ] **051**: Network failure handling and retry logic
- [ ] **052**: Rate limiting compliance and queuing

## Detailed Test Requirements

### Google Analytics Integration Tests (046-047)

**Test 046: Google Analytics Initialization**
**Objective**: Test Google Analytics integration initializes correctly with valid measurement ID

**Requirements**:
- Test GA4 initialization with valid measurement ID
- Validate gtag library loading and configuration
- Test GA configuration with TraceLog integration settings
- Verify GA initialization doesn't interfere with TraceLog
- Test custom GA configuration parameters
- Validate error handling for invalid measurement IDs

**GA Integration Configuration**:
```typescript
interface GoogleAnalyticsConfig {
  measurementId: string;      // GA4 measurement ID (G-XXXXXXXXXX)
  customDimensions?: Record<string, string>; // Custom dimensions mapping
  customEvents?: string[];    // Event name mapping for GA
  debugMode?: boolean;       // GA debug mode
  cookieFlags?: string;      // Cookie configuration
}
```

**Implementation Details**:
- Test gtag script loading and initialization
- Verify measurement ID validation
- Test GA configuration parameters
- Validate custom dimension setup
- Test debug mode activation
- Verify error handling for invalid configurations

**Test Scenarios**:
- Valid GA4 measurement ID initialization
- Invalid measurement ID error handling
- Missing gtag library graceful degradation
- Custom configuration parameter application
- Multiple GA property setup conflicts
- GA initialization timing and async loading

**Test 047: Event Forwarding to Google Analytics**
**Objective**: Validate custom TraceLog events are properly forwarded to Google Analytics with correct parameters

**Requirements**:
- Test custom event forwarding with gtag('event', ...)
- Validate event parameter mapping and transformation
- Test event name conversion for GA compatibility
- Verify selective event forwarding configuration
- Test event metadata preservation in GA parameters
- Validate GA event limits and parameter constraints

**Event Forwarding Logic**:
```typescript
interface GAEventForwarding {
  enabledEvents: string[];    // TraceLog events to forward
  eventMapping: Record<string, string>; // TL event to GA event mapping
  parameterMapping: Record<string, string>; // Parameter transformations
  maxParameters: number;      // GA parameter limit (25)
  parameterPrefix?: string;   // Custom parameter prefix
}
```

**Implementation Details**:
- Test event forwarding for different TraceLog event types
- Verify parameter transformation and mapping
- Test GA event name restrictions and conversion
- Validate parameter limits and truncation
- Test selective forwarding configuration
- Verify forwarding doesn't impact TraceLog performance

**Forwarded Event Examples**:
- TraceLog `PAGE_VIEW` → GA `page_view`
- TraceLog `CLICK` → GA `click_interaction`
- TraceLog custom events → GA custom events
- TraceLog session events → GA session events
- Performance metrics → GA custom metrics

### API Communication Tests (050-052)

**Test 050: Event Delivery to TraceLog API**
**Objective**: Test events are successfully delivered to the TraceLog API endpoint with correct headers and payload structure

**Requirements**:
- Test POST request to `/api/collect` endpoint
- Validate request headers (Content-Type, Authorization, User-Agent)
- Test payload structure and JSON serialization
- Verify batch event transmission format
- Test API response handling (success/error)
- Validate request timeout configuration

**API Request Structure**:
```typescript
interface APIRequest {
  url: string;                // API endpoint URL
  method: 'POST';            // HTTP method
  headers: {
    'Content-Type': 'application/json';
    'User-Agent': string;    // SDK version and browser info
    'X-TL-Project': string;  // Project identifier
  };
  body: EventBatch;          // Serialized event batch
  timeout: number;           // Request timeout (30s)
}
```

**Implementation Details**:
- Test successful event batch transmission
- Verify request header accuracy and completeness
- Test JSON serialization and payload structure
- Validate API response processing
- Test concurrent request handling
- Verify request retry logic for temporary failures

**Test Scenarios**:
- Successful batch transmission with 200 OK
- Large batch payload transmission (>100KB)
- Concurrent batch transmissions
- Request timeout handling
- Invalid API endpoint handling
- Authentication and authorization validation

**Test 051: Network Failure Handling and Retry Logic**
**Objective**: Validate retry logic, exponential backoff, and event persistence when API requests fail

**Requirements**:
- Test retry logic for network failures (timeout, connection refused)
- Validate exponential backoff timing (1s, 2s, 4s, 8s, max 30s)
- Test maximum retry attempts (default 5 attempts)
- Verify event persistence during retry cycles
- Test different failure scenarios (DNS, TCP, HTTP errors)
- Validate failure event logging and reporting

**Retry Configuration**:
```typescript
interface RetryConfig {
  maxAttempts: number;       // Maximum retry attempts (5)
  initialDelay: number;      // Initial retry delay (1000ms)
  maxDelay: number;         // Maximum retry delay (30000ms)
  backoffMultiplier: number; // Backoff multiplier (2)
  retryableStatuses: number[]; // HTTP status codes to retry
}
```

**Implementation Details**:
- Test various network failure scenarios
- Verify retry timing with exponential backoff
- Test retry attempt counting and limits
- Validate event queue persistence during retries
- Test success after retry attempts
- Verify error logging and monitoring

**Network Failure Scenarios**:
- DNS resolution failures
- Connection timeout (slow network)
- Connection refused (server down)
- HTTP 5xx server errors
- Request timeout after connection
- Network connectivity loss during request

**Test 052: Rate Limiting Compliance and Queuing**
**Objective**: Test rate limiting is respected and events are properly queued when API rate limits are exceeded

**Requirements**:
- Test rate limit detection via HTTP 429 responses
- Validate rate limit header parsing (Retry-After, X-RateLimit-*)
- Test event queuing during rate limiting periods
- Verify automatic retry after rate limit expiration
- Test rate limiting doesn't cause event loss
- Validate rate limit backoff calculation

**Rate Limiting Implementation**:
```typescript
interface RateLimitHandling {
  detectRateLimit: (response: Response) => boolean;
  parseRetryAfter: (headers: Headers) => number;
  queueEvents: (batch: EventBatch) => void;
  scheduleRetry: (delay: number) => void;
  maxQueueSize: number;      // Queue limit during rate limiting
}
```

**Implementation Details**:
- Mock API responses with 429 status codes
- Test Retry-After header parsing and compliance
- Verify event queuing during rate limit periods
- Test automatic retry scheduling
- Validate queue overflow handling during extended rate limiting
- Test rate limit recovery and normal transmission resumption

**Rate Limiting Test Scenarios**:
- API returns 429 with Retry-After header
- Extended rate limiting with queue overflow
- Rate limit recovery and normal operations
- Multiple concurrent requests hitting rate limits
- Rate limiting during high-frequency event generation
- Queue persistence during rate limit periods

## Integration Configuration

### Combined Integration Setup
```typescript
interface IntegrationConfig {
  googleAnalytics?: GoogleAnalyticsConfig;
  api: {
    endpoint: string;         // TraceLog API endpoint
    timeout: number;         // Request timeout
    retryConfig: RetryConfig; // Retry configuration
    rateLimitConfig: RateLimitHandling;
  };
  enabledIntegrations: string[]; // Active integrations list
}
```

### Integration Priority and Fallbacks
- Primary: TraceLog API (always enabled)
- Secondary: Google Analytics (optional)
- Fallbacks: Local storage for failed transmissions
- Error handling: Graceful degradation without data loss

## Performance Requirements

### Integration Performance
- GA initialization: <500ms additional load time
- Event forwarding: <10ms additional latency per event
- API request processing: <100ms for batch preparation
- Rate limiting detection: <5ms per response

### Memory and Resource Usage
- GA integration: <1MB additional memory overhead
- API client: <500KB memory usage
- Request queuing: Efficient memory management
- Integration cleanup: Proper resource disposal

## Security and Privacy Considerations

### Data Protection
- No PII forwarded to Google Analytics without explicit consent
- API transmission encrypted (HTTPS only)
- Authentication tokens secured and rotated
- Request headers sanitized for sensitive information

### Integration Isolation
- GA integration failures don't impact TraceLog functionality
- API failures handled gracefully with retry mechanisms
- Integration configuration validated for security
- External service dependencies minimized

## Success Criteria

### Functional Requirements
- [ ] All 5 integration tests pass consistently
- [ ] Google Analytics integration works with valid configuration
- [ ] Event forwarding to GA preserves important data
- [ ] API communication succeeds with proper error handling
- [ ] Rate limiting compliance prevents service disruption

### Performance Requirements
- [ ] Integration overhead within acceptable limits
- [ ] Event forwarding doesn't impact TraceLog performance
- [ ] API requests complete within timeout requirements
- [ ] Retry logic performs efficiently

### Reliability Requirements
- [ ] Integration failures don't break core functionality
- [ ] Event loss prevented during network issues
- [ ] Rate limiting handled gracefully
- [ ] Recovery mechanisms work after all failure types

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
- Mock Google Analytics gtag API for testing
- Create controlled API response scenarios
- Simulate network failures and delays
- Test rate limiting with controlled API responses

### Integration Validation
- Verify GA event transmission with GA Measurement Protocol
- Test API request/response cycles with mock endpoints
- Validate retry logic with network simulation
- Test rate limiting with controlled API responses

## Priority

**Medium** - Important for external service integration but not critical for core tracking

## Labels

- `e2e-testing`
- `integrations`
- `medium-priority`
- `playwright`
- `google-analytics`
- `api-communication`
- `rate-limiting`

## Definition of Done

- [ ] All 5 test cases implemented and passing
- [ ] Google Analytics integration validated with event forwarding
- [ ] API communication tested with success and failure scenarios
- [ ] Network failure handling and retry logic working correctly
- [ ] Rate limiting compliance verified with queuing behavior
- [ ] Cross-browser compatibility confirmed
- [ ] Performance requirements met for all integrations
- [ ] Security considerations validated for external data transmission
- [ ] Documentation updated with integration specifications