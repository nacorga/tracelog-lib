applyTo:
  - src/integrations/**/*.ts

# Integration Review Instructions

## Integration Architecture Pattern

Integrations are **optional third-party service connectors** (custom backends):

```typescript
export class CustomIntegration {
  private isInitialized = false;

  async initialize(): Promise<void> {
    // Async setup logic
    this.isInitialized = true;
  }

  sendEvent(event: Event): void {
    if (!this.isInitialized) {
      return; // Silently skip if not initialized
    }
    // Forward event to third-party service
  }

  cleanup(): void {
    // Remove scripts, clear state
    this.isInitialized = false;
  }
}
```

## Critical Checks

### 1. Initialization Safety (BLOCKING)
- ✅ Check `isInitialized` before sending data
- ✅ Handle initialization failures gracefully (no throw)
- ✅ Return early if integration not configured
- ✅ Async initialization with proper error handling
- ❌ **BLOCK**: Sending data before initialization → Potential crashes

### 2. Script Injection Safety (BLOCKING)
- ✅ Check if script already exists before injecting
- ✅ Use async/defer attributes on script tags
- ✅ Remove scripts in `cleanup()`
- ✅ Handle script load failures gracefully
- ❌ **BLOCK**: Duplicate script injection → Multiple instances

### 3. Third-Party API Safety (HIGH)
- ✅ Validate third-party API availability
- ✅ Check for ad blockers (graceful degradation)
- ✅ Rate limiting for API calls (prevent abuse)
- ⚠️ **HIGH**: Assuming third-party API exists → Crashes when blocked

### 4. Error Handling (HIGH)
- ✅ Try-catch around all third-party API calls
- ✅ Silent failures (no throw) - integrations are optional
- ✅ Log errors with context via `log()` utility
- ⚠️ **HIGH**: Throwing errors from integrations → Breaks core functionality

## Custom Backend Integration

### URL Validation
```typescript
// ✅ GOOD: Strict URL validation
if (!collectApiUrl.startsWith('http://') && !collectApiUrl.startsWith('https://')) {
  throw new IntegrationValidationError('Custom API URL must use HTTP or HTTPS protocol');
}

const allowHttp = config.allowHttp ?? false;

if (!allowHttp && collectApiUrl.startsWith('http://')) {
  throw new IntegrationValidationError(
    'HTTP not allowed in production. Set allowHttp: true to enable (not recommended)'
  );
}

// ❌ BAD: No protocol validation
if (!collectApiUrl) {
  throw new Error('API URL required');
}
```

### Request Pattern
```typescript
// ✅ GOOD: Proper request handling
async sendBatch(events: Event[]): Promise<void> {
  if (!this.isInitialized || !this.apiUrl) {
    return;
  }

  try {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    log('error', 'Failed to send batch to custom backend', { error });
    // Don't throw - integration failures shouldn't break core library
  }
}

// ❌ BAD: No error handling
async sendBatch(events: Event[]): Promise<void> {
  await fetch(this.apiUrl, {
    method: 'POST',
    body: JSON.stringify({ events }),
  }); // Will throw on network error!
}
```

## Integration Lifecycle

### Initialization Order
1. **Validate configuration** - Check required fields, throw if invalid
2. **Check existing scripts** - Prevent duplicate injection
3. **Inject scripts** - Async load with error handling
4. **Wait for ready** - Verify third-party API available
5. **Set initialized flag** - Mark ready for use

### Event Flow
1. **Check initialized** - Return early if not ready
2. **Validate third-party API** - Check `window.gtag`, `window.dataLayer`, etc.
3. **Transform event** - Convert TraceLog event to third-party format
4. **Send with try-catch** - Handle failures gracefully
5. **Log errors** - Use `log()` for debugging

### Cleanup Flow
1. **Set initialized to false** - Prevent new events
2. **Remove scripts** - Clean up DOM
3. **Clear global state** - Delete `window.gtag`, etc.
4. **Clear references** - Null out instance variables

## Testing Requirements

### Unit Tests
- Test initialization with valid/invalid config
- Test duplicate script injection prevention
- Test event forwarding when initialized/not initialized
- Test cleanup removes all artifacts

### Integration Tests
- Test actual script loading (may require mocks)
- Test interaction with real third-party APIs (in E2E tests)
- Test ad blocker scenarios (graceful degradation)

### E2E Tests
Test integration behavior with actual script loading and third-party API interaction.

## Common Issues

### Critical (Must Fix)
- ❌ Sending events before initialization check
- ❌ No duplicate script injection prevention
- ❌ Throwing errors from integration code (should be silent)
- ❌ Missing cleanup in `cleanup()` method
- ❌ Assuming third-party API exists without check
- ❌ Allowing HTTP in production without explicit opt-in

### High Priority
- ⚠️ Missing try-catch around third-party API calls
- ⚠️ No validation of third-party API response
- ⚠️ No logging of integration failures
- ⚠️ Missing SSR safety checks (`typeof window === 'undefined'`)
- ⚠️ Script injection without async/defer attributes

### Medium Priority
- 💡 Missing JSDoc comments on public methods
- 💡 Complex transformation logic not extracted to helpers
- 💡 Missing test coverage for error paths
- 💡 No rate limiting for third-party API calls
- 💡 Redundant comments describing obvious checks
- 💡 Comments without added integration context

## Code Comments Policy

**✅ Use comments for:**
- Third-party API quirks and workarounds
- Script injection safety mechanisms
- Event transformation logic
- Integration-specific error handling strategies
- Ad blocker detection patterns

**❌ NEVER use comments for:**
- Obvious initialization checks (e.g., `// Check if initialized`)
- Simple API existence checks (e.g., `// Check if API exists`)
- Script element creation (e.g., `// Create script tag`)
- Type information in TypeScript signatures

## Integration Checklist

**Before merging integration changes:**

- [ ] Initialization check before all operations
- [ ] Duplicate script injection prevention
- [ ] Async script loading with error handling
- [ ] Try-catch around all third-party API calls
- [ ] Silent failures (no throw)
- [ ] Proper cleanup in `cleanup()` method
- [ ] SSR-safe (`typeof window === 'undefined'` checks)
- [ ] HTTPS enforcement (unless `allowHttp: true`)
- [ ] Third-party API validation (check existence before use)
- [ ] Error logging with context

## Example Review Comments

**Good**: "BLOCKING: Missing initialization check at line 67. Add `if (!this.isInitialized) { return; }` before calling third-party API. Without this, events will be sent before integration is ready, causing errors."

**Good**: "HIGH: The script injection at line 45 doesn't check for duplicates. Add duplicate check before creating the script element to prevent loading integration scripts multiple times."

**Good**: "MEDIUM: The `sendEvent()` method at line 89 doesn't log failures. Add a catch block: `catch (error) { log('warn', 'Failed to send event', { error }); }` for debugging integration issues."

**Good**: "The integration looks solid. Consider adding a test case for ad blocker scenarios where third-party API is undefined to ensure graceful degradation."
