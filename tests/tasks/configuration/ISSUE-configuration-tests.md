# E2E Testing: Configuration Tests

## Overview

This issue covers the implementation of **8 E2E tests** for configuration functionality in the TraceLog SDK. These tests validate sampling configuration, URL exclusion rules, tagging system, and remote configuration loading.

## Test Coverage

### Configuration Management (8 tests)

#### Sampling Configuration (2 tests)
- [ ] **040**: Event sampling configuration and rate application
- [ ] **041**: Web Vitals sampling with separate rates

#### URL Exclusion Rules (2 tests)
- [ ] **042**: Path exclusion patterns and wildcard matching
- [ ] **043**: Session event handling on excluded paths

#### Tagging System (2 tests)
- [ ] **044**: Page view tagging based on URL patterns
- [ ] **045**: Click event tagging with conditional logic

#### Remote Configuration (2 tests)
- [ ] **053**: Remote configuration loading and merging
- [ ] **054**: Configuration validation and fallback handling

## Detailed Test Requirements

### Sampling Configuration Tests (040-041)

**Test 040: Event Sampling Configuration**
**Objective**: Validate sampling rates are properly applied to reduce event volume while maintaining consistent user sampling

**Requirements**:
- Test configurable sampling rates for different event types (0.0-1.0)
- Validate user-consistent sampling (same user always sampled or not)
- Verify QA mode bypasses sampling (100% collection)
- Test sampling configuration inheritance and overrides
- Confirm sampling statistics and reporting accuracy
- Validate sampling persistence across sessions

**Implementation Details**:
```typescript
interface SamplingConfig {
  defaultRate: number;        // Default sampling rate (0.1 = 10%)
  eventTypes: {
    pageView: number;         // Page view sampling (0.5 = 50%)
    click: number;            // Click event sampling (0.3 = 30%)
    scroll: number;           // Scroll event sampling (0.1 = 10%)
    custom: number;           // Custom event sampling (1.0 = 100%)
    error: number;            // Error event sampling (1.0 = 100%)
  };
  userConsistent: boolean;    // Consistent sampling per user
  qaMode: boolean;           // QA mode override (100% sampling)
}
```

**Test Scenarios**:
- Configure various sampling rates and verify application
- Test user consistency across multiple sessions
- Validate QA mode sampling override
- Test sampling with high-frequency events
- Verify sampling statistics accuracy

**Test 041: Web Vitals Sampling**
**Objective**: Test separate sampling rates for performance metrics and long tasks

**Requirements**:
- Test Web Vitals specific sampling configuration (default 10%)
- Validate long task additional sampling reduction (default 1%)
- Verify performance impact of sampling on metric accuracy
- Test sampling coordination with general event sampling
- Confirm performance metric sampling persistence

**Web Vitals Sampling Config**:
```typescript
interface PerformanceSamplingConfig {
  webVitals: number;          // Web Vitals sampling (0.1 = 10%)
  longTasks: number;          // Long task sampling (0.01 = 1%)
  performanceObserver: number; // Performance observer sampling
  navigationTiming: number;   // Navigation timing sampling
}
```

### URL Exclusion Tests (042-043)

**Test 042: Path Exclusion Patterns**
**Objective**: Verify events are not tracked on pages matching excluded URL path patterns

**Requirements**:
- Test exact path exclusion matching (`/admin/dashboard`)
- Validate wildcard pattern exclusions (`/api/*`, `/temp/**`)
- Test regex pattern exclusions for complex matching
- Verify case sensitivity and encoding handling
- Test exclusion pattern priority and precedence
- Validate exclusion configuration inheritance

**Exclusion Pattern Examples**:
```typescript
interface ExclusionConfig {
  paths: string[];            // Exact path matches
  patterns: string[];         // Wildcard patterns (* and **)
  regex: string[];           // Regular expression patterns
  caseSensitive: boolean;    // Case sensitivity for matching
  queryParams: boolean;      // Include query params in matching
}
```

**Test Scenarios**:
- Navigate to exact excluded paths
- Test wildcard pattern matching with various URLs
- Validate regex pattern exclusions
- Test query parameter handling in exclusions
- Verify exclusion doesn't affect other tracking

**Test 043: Session Events on Excluded Paths**
**Objective**: Ensure session start/end events are tracked on excluded paths when necessary for session continuity

**Requirements**:
- Test session start events on excluded paths
- Validate session end events when navigating from excluded paths
- Verify session continuity across excluded and included pages
- Test session timeout handling on excluded paths
- Confirm session metadata preservation on excluded pages

**Session Exclusion Logic**:
- Session events bypass URL exclusions when needed for continuity
- Session metadata (start/end) tracked regardless of page exclusion
- Session timeout management continues on excluded pages
- Cross-tab session coordination includes excluded tabs

### Tagging System Tests (044-045)

**Test 044: Page View Tagging**
**Objective**: Test page view events are properly tagged based on URL patterns, device type, and UTM parameters

**Requirements**:
- Test URL pattern-based tagging with wildcard matching
- Validate device type tagging (mobile, tablet, desktop)
- Test UTM parameter extraction and tagging
- Verify conditional tagging logic (AND/OR operations)
- Test tag inheritance and priority resolution
- Validate tag metadata structure and limits

**Page View Tagging Config**:
```typescript
interface PageViewTagging {
  rules: TagRule[];
  deviceTags: boolean;        // Automatically tag device type
  utmTags: boolean;          // Extract UTM parameters as tags
  customTags: Record<string, any>; // Static custom tags
}

interface TagRule {
  condition: TagCondition;
  tags: string[];
  priority: number;
  logic: 'AND' | 'OR';
}
```

**Test Scenarios**:
- Navigate to pages matching various tagging rules
- Test device type automatic tagging
- Validate UTM parameter extraction
- Test conditional logic combinations (AND/OR)
- Verify tag priority resolution

**Test 045: Click Event Tagging**
**Objective**: Validate click events are tagged based on element selectors, attributes, and conditions

**Requirements**:
- Test CSS selector-based click tagging
- Validate element attribute-based tagging (data-*, class, id)
- Test text content-based tagging rules
- Verify parent element tag inheritance
- Test complex conditional tagging logic
- Validate tag metadata size and structure limits

**Click Tagging Config**:
```typescript
interface ClickTagging {
  selectors: SelectorTagRule[];
  attributes: AttributeTagRule[];
  textContent: TextTagRule[];
  inheritFromParent: boolean;
}

interface SelectorTagRule {
  selector: string;           // CSS selector
  tags: string[];            // Tags to apply
  includeText: boolean;      // Include element text
  maxDepth: number;          // Parent traversal depth
}
```

### Remote Configuration Tests (053-054)

**Test 053: Remote Configuration Loading**
**Objective**: Validate remote configuration is properly loaded from API and merged with local configuration

**Requirements**:
- Test configuration loading from API endpoint
- Validate configuration merging with local defaults
- Test configuration caching and TTL (Time To Live)
- Verify configuration update propagation
- Test configuration loading timeout handling
- Validate configuration format and validation

**Remote Config Flow**:
1. SDK initialization triggers config request
2. API returns project-specific configuration
3. Configuration merged with local defaults
4. Configuration cached with TTL
5. Configuration applied to SDK behavior

**Configuration Structure**:
```typescript
interface RemoteConfig {
  sampling: SamplingConfig;
  exclusions: ExclusionConfig;
  tagging: TaggingConfig;
  performance: PerformanceConfig;
  integrations: IntegrationConfig;
  version: string;
  ttl: number;               // Cache TTL in seconds
}
```

**Test 054: Configuration Validation and Fallback**
**Objective**: Test invalid configuration responses are handled gracefully with fallback to default configuration

**Requirements**:
- Test malformed JSON configuration response handling
- Validate schema validation for configuration objects
- Test partial configuration merging
- Verify fallback to default configuration on errors
- Test configuration version compatibility
- Validate error reporting and logging

**Fallback Scenarios**:
- Network failure loading remote configuration
- Invalid JSON in configuration response
- Schema validation failures
- Partial configuration corruption
- Version incompatibility
- Timeout during configuration loading

## Configuration Priority and Inheritance

### Priority Order (highest to lowest)
1. **Runtime overrides** (init() parameters)
2. **Remote configuration** (from API)
3. **Local configuration** (default values)
4. **SDK defaults** (hardcoded fallbacks)

### Configuration Merging Logic
- Object properties deep merged (not replaced)
- Arrays completely replaced (no merging)
- Primitive values overridden completely
- Validation applied after merging

## Performance Requirements

### Configuration Loading
- Remote configuration loading: <2 seconds timeout
- Configuration merging: <50ms processing time
- Configuration validation: <20ms per ruleset
- Configuration caching: <10ms persistence

### Runtime Performance
- Sampling decision: <1ms per event
- URL exclusion matching: <5ms per pattern
- Tagging rule evaluation: <10ms per event
- Configuration lookup: <1ms per access

## Success Criteria

### Functional Requirements
- [ ] All 8 configuration tests pass consistently
- [ ] Sampling rates applied accurately across event types
- [ ] URL exclusions prevent tracking on specified paths
- [ ] Tagging system applies tags based on rules correctly
- [ ] Remote configuration loading and fallback working

### Performance Requirements
- [ ] Configuration operations meet timing requirements
- [ ] Sampling decisions don't impact event performance
- [ ] Pattern matching performs efficiently
- [ ] Configuration loading doesn't delay initialization

### Reliability Requirements
- [ ] Configuration fallback prevents SDK failures
- [ ] Invalid configurations handled gracefully
- [ ] Configuration persistence survives browser sessions
- [ ] Configuration updates propagate correctly

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
- Mock remote configuration API endpoints
- Create test pages with various URL patterns
- Set up elements with different tagging attributes
- Configure sampling test scenarios with statistics

### Configuration Validation
- Test configuration schema validation
- Verify rule priority and precedence
- Test configuration inheritance chains
- Validate performance impact measurements

## Priority

**Medium** - Important for SDK flexibility and customization

## Labels

- `e2e-testing`
- `configuration`
- `medium-priority`
- `playwright`
- `sampling`
- `url-exclusions`
- `tagging-system`
- `remote-config`

## Definition of Done

- [ ] All 8 test cases implemented and passing
- [ ] Sampling configuration validated with statistical accuracy
- [ ] URL exclusion patterns tested across various scenarios
- [ ] Tagging system verified for both page views and clicks
- [ ] Remote configuration loading and fallback thoroughly tested
- [ ] Cross-browser compatibility confirmed
- [ ] Performance requirements met for all configuration operations
- [ ] Error handling validated for all failure scenarios
- [ ] Documentation updated with configuration specifications