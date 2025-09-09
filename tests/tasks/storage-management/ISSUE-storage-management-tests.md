# E2E Testing: Storage Management Tests

## Overview

This issue covers the implementation of **2 E2E tests** for storage management functionality in the TraceLog SDK. These tests validate localStorage operations with fallbacks and project-based storage key isolation.

## Test Coverage

### Storage Operations (2 tests)
- [ ] **034**: localStorage operations with fallbacks
- [ ] **035**: Project-based storage key isolation

## Detailed Test Requirements

### Test 034: localStorage Operations with Fallbacks
**Objective**: Validate all storage operations work correctly and gracefully fallback when localStorage is unavailable

**Requirements**:
- Test `StorageManager.get()` operations with valid keys
- Validate `StorageManager.set()` data persistence
- Verify `StorageManager.remove()` key deletion
- Test fallback to in-memory storage when localStorage disabled
- Confirm data type preservation (strings, objects, arrays)
- Validate error handling for storage quota exceeded
- Test storage operations performance and reliability

**Implementation Details**:
- Test standard localStorage read/write operations
- Simulate localStorage unavailable scenarios (disabled, private browsing)
- Test storage quota limitations with large data
- Verify JSON serialization/deserialization accuracy
- Test concurrent storage operations from multiple tabs
- Validate storage key naming conventions

**Storage Methods to Test**:
```typescript
interface StorageManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): boolean;
  remove(key: string): boolean;
  clear(prefix?: string): boolean;
  isAvailable(): boolean;
}
```

**Test Scenarios**:
- Normal localStorage available and working
- localStorage disabled in browser settings
- Private/incognito browsing mode
- Storage quota exceeded scenarios
- Corrupted data in localStorage
- Cross-tab storage synchronization
- Performance with large objects

**Fallback Storage Behavior**:
- In-memory storage as fallback when localStorage unavailable
- Session-scoped data persistence (cleared on page reload)
- Warning logs when fallback storage is used
- Consistent API behavior regardless of storage type

### Test 035: Project-based Storage Key Isolation
**Objective**: Ensure different project IDs use isolated storage keys without data interference

**Requirements**:
- Test storage key prefixing with project ID
- Validate complete data isolation between projects
- Verify key collision prevention
- Test cleanup operations scoped to project
- Confirm storage size calculations per project
- Validate key enumeration and filtering

**Implementation Details**:
- Create storage entries for multiple project IDs
- Test data retrieval only returns project-specific data
- Verify cleanup operations don't affect other projects
- Test key naming pattern: `tl:${projectId}:${dataKey}`
- Validate storage enumeration filtering
- Test project-specific storage quotas

**Key Isolation Patterns**:
```typescript
// Storage key format
const storageKey = `tl:${projectId}:${dataKey}`;

// Example keys for different projects
'tl:project-abc:userId'          // User ID for project-abc
'tl:project-abc:sessionId'       // Session ID for project-abc
'tl:project-xyz:userId'          // User ID for project-xyz (isolated)
'tl:project-xyz:queue'           // Event queue for project-xyz
```

**Isolation Test Scenarios**:
- Multiple projects on same domain
- Identical data keys across different projects
- Storage cleanup affecting only target project
- Cross-project key enumeration prevention
- Storage size calculations per project
- Project key migration scenarios

## Storage Data Types and Formats

### Supported Data Types
- **Primitives**: strings, numbers, booleans
- **Objects**: Plain objects with JSON serialization
- **Arrays**: Arrays of primitives or objects
- **Dates**: Stored as ISO strings, parsed back to Date objects
- **null/undefined**: Handled consistently across storage types

### Storage Key Categories
```typescript
// User-related keys
'tl:${projectId}:userId'         // Persistent user identifier
'tl:${projectId}:sessionId'      // Current session ID

// Configuration keys
'tl:${projectId}:config'         // Remote configuration cache
'tl:${projectId}:sampling'       // Sampling configuration

// Queue and state keys
'tl:${projectId}:queue'          // Pending events queue
'tl:${projectId}:lastFlush'      // Last queue flush timestamp
'tl:${projectId}:state'          // Application state persistence
```

## Browser Compatibility Testing

### localStorage Support
- **Chrome/Firefox/Safari/Edge**: Full localStorage API support
- **IE11**: Basic localStorage with JSON handling
- **Mobile browsers**: Storage availability and quotas
- **Private browsing**: Storage disabled scenarios

### Fallback Storage Testing
- In-memory storage implementation validation
- Session-scoped persistence behavior
- Performance comparison: localStorage vs in-memory
- Memory cleanup on page unload

## Storage Performance Requirements

### Operation Performance
- `get()` operations: <5ms per operation
- `set()` operations: <10ms per operation (including serialization)
- `remove()` operations: <5ms per operation
- Bulk operations: <50ms for 100 items

### Storage Efficiency
- JSON serialization overhead minimization
- Key prefix optimization for fast enumeration
- Storage space utilization tracking
- Automatic cleanup of expired data

## Error Handling and Recovery

### Storage Errors
- `QuotaExceededError`: Storage full scenarios
- `SecurityError`: Storage access denied
- `InvalidStateError`: Storage corruption
- JSON parsing errors from corrupted data

### Recovery Strategies
- Graceful fallback to in-memory storage
- Data validation and corruption detection
- Automatic storage cleanup for space recovery
- Error logging and reporting

## Security Considerations

### Data Protection
- No sensitive data stored in localStorage (client-side accessible)
- Key naming prevents accidental data exposure
- Automatic sanitization of stored data
- Respect for browser privacy modes

### Storage Validation
- Input validation for all storage operations
- Key format validation to prevent injection
- Data size limits to prevent memory exhaustion
- Safe JSON parsing with error handling

## Success Criteria

### Functional Requirements
- [ ] All 2 storage management tests pass consistently
- [ ] localStorage operations work reliably
- [ ] Fallback storage activates when localStorage unavailable
- [ ] Project-based isolation prevents data leaks
- [ ] All supported data types preserved accurately

### Performance Requirements
- [ ] Storage operations meet performance benchmarks
- [ ] Fallback storage performs adequately
- [ ] No memory leaks in in-memory storage
- [ ] Efficient key enumeration and filtering

### Reliability Requirements
- [ ] Storage operations are atomic and consistent
- [ ] Error recovery works for all failure scenarios
- [ ] Cross-tab synchronization functions properly
- [ ] Storage quotas handled gracefully

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
- Mock localStorage availability states
- Test with various browser privacy settings
- Simulate storage quota limitations
- Test concurrent access from multiple tabs

### Data Validation
- Verify JSON serialization round-trip accuracy
- Test with complex nested objects
- Validate data type preservation
- Test edge cases with special characters

### Performance Testing
- Measure storage operation timing
- Test with large datasets
- Validate memory usage in fallback mode
- Benchmark key enumeration performance

## Branching Requirements
- Start branch from: `refactor/playwright-e2e-tests`
- Merge changes into: `develop`

## Definition of Done

- [ ] All 2 test cases implemented and passing
- [ ] localStorage operations validated with fallback testing
- [ ] Project-based isolation verified across scenarios
- [ ] Cross-browser compatibility confirmed
- [ ] Performance requirements met for all operations
- [ ] Error handling and recovery tested thoroughly
- [ ] Security considerations validated
- [ ] Documentation updated with storage specifications