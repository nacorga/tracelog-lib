# E2E Testing: User Management Tests

## Overview

This issue covers the implementation of **3 E2E tests** for user management functionality in the TraceLog SDK. These tests validate user ID generation and persistence, user ID recovery across sessions, and device type classification.

## Test Coverage

### User Identity Management (3 tests)
- [ ] **031**: User ID generation and persistence
- [ ] **032**: User ID recovery across sessions
- [ ] **033**: Device type classification (mobile/tablet/desktop)

## Detailed Test Requirements

### Test 031: User ID Generation and Persistence
**Objective**: Validate unique user IDs are generated and persisted correctly across sessions

**Requirements**:
- Test UUID v4 generation for new users
- Validate localStorage persistence with project-scoped keys
- Verify user ID consistency across page reloads
- Test fallback behavior when localStorage unavailable
- Confirm user ID uniqueness across different projects
- Validate user ID format and length requirements

**Implementation Details**:
- Test first-time visitor user ID creation
- Verify localStorage key format: `tl:${projectId}:userId`
- Test user ID retrieval on subsequent visits
- Validate UUID format compliance (8-4-4-4-12 pattern)
- Test behavior with disabled localStorage
- Verify project isolation for user IDs

**Test Scenarios**:
- New visitor without existing user ID
- Returning visitor with valid stored user ID
- localStorage unavailable/disabled scenario
- Multiple projects on same domain
- User ID persistence across browser sessions
- Incognito/private browsing mode behavior

### Test 032: User ID Recovery Across Sessions
**Objective**: Ensure user IDs are properly recovered after browser restarts and storage clearing scenarios

**Requirements**:
- Test user ID persistence after browser restart
- Validate recovery after localStorage clearing
- Verify user ID consistency with session recovery
- Test graceful handling of corrupted user ID data
- Confirm new user ID generation when recovery fails
- Validate user ID migration between SDK versions

**Implementation Details**:
- Clear localStorage and test user ID recreation
- Simulate browser restart scenarios
- Test partial localStorage corruption handling
- Verify user ID format validation on recovery
- Test fallback to new ID generation
- Validate session continuity with recovered user IDs

**Recovery Scenarios**:
- Browser restart with intact localStorage
- localStorage manually cleared by user
- Storage quota exceeded scenarios
- Corrupted user ID data in storage
- SDK version upgrade migrations
- Cross-domain user ID isolation

### Test 033: Device Type Classification
**Objective**: Validate devices are correctly classified based on screen size, user agent, and input capabilities

**Requirements**:
- Test mobile device detection (screen width < 768px)
- Validate tablet classification (768px ≤ width < 1024px)
- Verify desktop identification (width ≥ 1024px)
- Test user agent string analysis for device hints
- Validate touch capability detection
- Confirm device type persistence during session

**Implementation Details**:
- Test with various viewport sizes and device emulation
- Validate user agent parsing for mobile indicators
- Test touch event capability detection
- Verify orientation change handling
- Test device type consistency during session
- Validate device metadata in events

**Classification Rules**:
```typescript
interface DeviceClassification {
  type: 'mobile' | 'tablet' | 'desktop';
  screenWidth: number;
  screenHeight: number;
  touchCapable: boolean;
  userAgent: string;
  orientation?: 'portrait' | 'landscape';
}
```

**Device Type Logic**:
- **Mobile**: `width < 768px OR mobileUserAgent`
- **Tablet**: `768px ≤ width < 1024px AND touchCapable`
- **Desktop**: `width ≥ 1024px AND !mobileUserAgent`

## User Data Structure

### User ID Storage Format
```typescript
// localStorage key: 'tl:${projectId}:userId'
{
  userId: string,           // UUID v4 format
  createdAt: Date,         // First generation timestamp
  lastSeen: Date,          // Last activity timestamp
  deviceType: 'mobile' | 'tablet' | 'desktop',
  version: string          // SDK version that created the ID
}
```

### Event User Context
```typescript
{
  userId: string,          // Persistent user identifier
  sessionId: string,       // Current session ID
  deviceType: string,      // Classified device type
  isNewUser: boolean,      // First session for this user
  isRecovered: boolean     // User ID recovered from storage
}
```

## Browser Compatibility Testing

### localStorage Support
- Test full localStorage API availability
- Validate graceful degradation without localStorage
- Test storage quota limitations
- Verify cross-tab storage synchronization

### Device Detection APIs
- Test `navigator.userAgent` parsing
- Validate `window.screen` dimensions access
- Test `navigator.maxTouchPoints` for touch detection
- Verify `matchMedia` for orientation detection

## Privacy and Security Considerations

### User ID Privacy
- User IDs are not personally identifiable
- No correlation with real-world identity
- Project-scoped isolation prevents cross-site tracking
- Respect browser privacy settings (DNT, incognito)

### Storage Security
- No sensitive data stored with user ID
- Validate storage keys to prevent injection
- Respect localStorage security policies
- Handle storage access exceptions gracefully

## Performance Requirements

### ID Generation Performance
- User ID generation <10ms
- localStorage operations <5ms
- Device classification <20ms
- No blocking operations during initialization

### Memory Usage
- Minimal memory footprint for user data
- Efficient device type caching
- Cleanup of temporary detection variables

## Success Criteria

### Functional Requirements
- [ ] All 3 user management tests pass consistently
- [ ] User IDs generated uniquely and persistently
- [ ] Device type classification accuracy >95%
- [ ] Recovery mechanisms work after storage clearing
- [ ] Cross-browser compatibility maintained

### Data Consistency Requirements
- [ ] User IDs remain consistent across sessions
- [ ] Device type detection stable during session
- [ ] Project isolation prevents ID collisions
- [ ] Recovery gracefully handles corrupted data

### Performance Requirements
- [ ] User ID operations don't delay initialization
- [ ] Device classification completes within timing requirements
- [ ] Storage operations are non-blocking
- [ ] Memory usage remains minimal

## Test Environment Setup

### Device Emulation
- Use Playwright device emulation for mobile/tablet testing
- Test various screen resolutions and orientations
- Simulate different user agent strings
- Test touch vs mouse input scenarios

### Storage Testing
- Test localStorage availability and quotas
- Simulate storage disabled scenarios
- Test cross-tab storage synchronization
- Validate storage cleanup and migration

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

### User ID Generation
- Use crypto.randomUUID() where available
- Fallback to custom UUID generation
- Validate UUID format with regex
- Test uniqueness across multiple generations

### Device Classification
- Combine multiple detection methods for accuracy
- Cache classification results during session
- Handle dynamic viewport changes
- Test orientation change scenarios

## Branching Requirements
- Start branch from: `refactor/playwright-e2e-tests`
- Merge changes into: `develop`

## Definition of Done

- [ ] All 3 test cases implemented and passing
- [ ] User ID generation and persistence validated
- [ ] Device classification accuracy verified across devices
- [ ] Cross-browser compatibility confirmed
- [ ] Storage recovery mechanisms tested thoroughly
- [ ] Performance requirements met
- [ ] Privacy considerations validated
- [ ] Documentation updated with user management specifications