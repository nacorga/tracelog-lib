# E2E Test Organization

This directory contains GitHub issue templates for TraceLog SDK E2E tests, organized by functional context.

## Directory Structure

### 🚀 Core Functionality

#### `initialization/` (4 tests)
Library initialization scenarios and error handling
- 001: Successful initialization
- 002: Invalid project ID handling  
- 003: Browser environment validation
- 004: Duplicate initialization prevention

#### `session-management/` (6 tests)
User session lifecycle and cross-tab coordination
- 005: Session start behavior
- 006: Default session timeout (15min)
- 007: Custom session timeout configuration
- 008: Session recovery after page reload
- 009: Cross-tab session coordination
- 010: Page unload session termination

#### `event-tracking/` (14 tests)
All event capture mechanisms and validation
- **Custom Events**: 011-014 (valid events, validation, sanitization)
- **Page Views**: 015-017 (initial load, navigation, URL normalization)
- **Click Tracking**: 018-021 (elements, attributes, text, coordinates)
- **Scroll Tracking**: 022-024 (window, containers, suppression)

### ⚡ Performance & Monitoring

#### `performance-tracking/` (4 tests)
Web performance metrics and library overhead
- 025: Web Vitals collection (LCP, CLS, FCP, TTFB, INP)
- 026: Long task detection with throttling
- 027: Web Vitals fallback mechanisms
- 065: Library performance impact assessment

#### `error-tracking/` (3 tests)
JavaScript error capture and sanitization
- 028: JavaScript error and promise rejection tracking
- 029: Network error monitoring (fetch/XHR)
- 030: PII sanitization in error messages

### 🔧 System Infrastructure

#### `user-management/` (3 tests)
User identification and device detection
- 031: User ID generation and persistence
- 032: User ID recovery across sessions
- 033: Device type classification (mobile/tablet/desktop)

#### `storage-management/` (2 tests)
Local storage operations and isolation
- 034: localStorage operations with fallbacks
- 035: Project-based storage key isolation

#### `queue-management/` (4 tests)
Event queuing, batching, and transmission
- 036: Event queue processing and batching
- 037: Queue persistence across page loads
- 038: Queue size limits and overflow handling
- 039: Immediate flush capabilities (sync/async)

#### `configuration/` (8 tests)
Sampling, URL exclusions, tagging, and remote config
- **Sampling**: 040-041 (event sampling, web vitals sampling)
- **URL Exclusions**: 042-043 (path exclusions, session continuity)
- **Tagging**: 044-045 (page view tags, click event tags)
- **Remote Config**: 053-054 (loading, validation)

### 🔌 Integrations & Security

#### `integrations/` (5 tests)
External service integrations and API communication
- **Google Analytics**: 046-047 (initialization, event forwarding)
- **API Communication**: 050-052 (delivery, failure handling, rate limiting)

#### `security-qa/` (4 tests)
Security measures and QA mode functionality
- **QA Mode**: 048-049 (enhanced logging, error throwing)
- **Security**: 055-056 (XSS prevention, data sanitization)

### 🌐 Compatibility & Reliability

#### `browser-compatibility/` (2 tests)
Cross-browser support and graceful degradation
- 063: Modern browser feature support
- 064: Graceful degradation for missing APIs

#### `system-reliability/` (8 tests)
Memory management, cleanup, and data accuracy
- **Lifecycle**: 057-058 (destroy functionality, memory leak prevention)
- **Activity Detection**: 059-060 (user activity, inactivity detection)
- **Multi-tab**: 061-062 (tab coordination, leader election)
- **Data Accuracy**: 066-067 (deduplication, timestamp consistency)

#### `edge-cases/` (3 tests)
Edge cases and comprehensive integration testing
- 068: Rapid navigation scenarios
- 069: Large payload handling
- 070: Full user journey integration test

## Test Coverage Summary

| Category | Test Count | Priority |
|----------|------------|----------|
| **Core Functionality** | 24 | High |
| **Performance & Monitoring** | 7 | High |
| **System Infrastructure** | 17 | Medium |
| **Integrations & Security** | 9 | Medium |
| **Compatibility & Reliability** | 13 | Medium |
| **Total** | **70** | |

## Usage

Each directory contains markdown files that can be used as GitHub issue templates. The files follow a consistent structure:

- **Description**: Test objective from E2E_TESTS.json
- **Test Requirements**: Specific testable criteria
- **Acceptance Criteria**: Success conditions
- **Priority**: High/Medium based on functionality criticality
- **Labels**: Contextual tags for organization

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

- Tests are designed for **Playwright E2E** implementation
- File naming: `NNN-kebab-case-title.md`
- Priority assignment: Core functionality = High, Others = Medium
- Each test maps to specific TraceLog SDK capabilities