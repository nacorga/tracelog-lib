---
applyTo: 'src/managers/**/*.ts'
---

# Manager-Specific Review Instructions

## Manager Architecture Pattern

All managers in `src/managers/` extend `StateManager` for global state access:

```typescript
export class CustomManager extends StateManager {
  // Access global state via this.state
  constructor() {
    super();
    // Initialize manager
  }

  // Public API methods
  public performAction(): void {
    const currentState = this.state;
    // Use state for business logic
  }

  // Private helper methods
  private helperMethod(): void {
    // Internal logic
  }
}
```

## Critical Checks

### 1. State Management (BLOCKING)

- ✅ All managers extend `StateManager`
- ✅ State accessed via `this.state` (read-only reference)
- ✅ State mutations through setters or dedicated update methods
- ❌ **BLOCK**: Direct state mutation (e.g., `this.state.foo = bar`) → State corruption

### 2. Memory Management (BLOCKING)

- ✅ Cleanup methods clear all timers/intervals
- ✅ Event listeners removed in cleanup
- ✅ No circular references to other managers
- ❌ **BLOCK**: Missing cleanup for timers/intervals → Memory leak

### 3. Error Handling (HIGH)

- ✅ Try-catch blocks around critical operations
- ✅ Errors logged with context information
- ✅ Graceful degradation on failures
- ⚠️ **HIGH**: Missing error handling in async operations → Unhandled promise rejections

### 4. Type Safety (BLOCKING)

- ✅ Strict TypeScript mode compliance (no `any` without justification)
- ✅ Proper type guards for runtime validations
- ✅ Return types explicitly defined
- ❌ **BLOCK**: Using `any` without justification → Type safety violation

## Manager-Specific Patterns

### StateManager (Base Class)

- Verify singleton pattern implementation
- Check state initialization logic
- Ensure state updates trigger proper notifications
- Validate state persistence/hydration logic

### EventManager

- Validate event queue management (max size, expiry)
- Check deduplication logic correctness
- Ensure proper event batching for network transmission
- Verify `track()` method validates event structure
- Check event emission via `on('event')` for local consumption

### SessionManager

- Validate session timeout logic (default 15min)
- Check cross-tab synchronization (localStorage)
- Ensure proper session ID generation (UUID v4)
- Verify session start/end event creation
- Check session expiry cleanup

### StorageManager

- Validate localStorage read/write error handling
- Check storage quota exceeded handling
- Ensure proper JSON serialization/deserialization
- Verify storage key namespacing (avoid collisions)

### SenderManager

- Validate network request logic (`sendBeacon` fallback to `fetch`)
- Check retry logic for failed requests
- Ensure proper error handling for network failures
- Verify request batching and throttling
- Check that sender only operates when integration configured

### UserManager

- Validate user identification logic
- Check user metadata validation
- Ensure user privacy (no PII unless explicitly provided)
- Verify user ID persistence across sessions

### PerformanceHandler (Web Vitals)

- Validate Web Vitals integration (`onLCP`, `onCLS`, `onINP`, etc.)
- Check metric attribution (element, URL, load state)
- Ensure single metric report per page load
- Verify metric data structure matches backend expectations

## Testing Requirements

### Unit Tests

- Test state access patterns (`this.state`)
- Test business logic in isolation (mock dependencies)
- Test error handling paths
- Test edge cases (null, undefined, invalid inputs)

### Integration Tests

- Test manager interactions (e.g., EventManager → SenderManager)
- Test state updates propagate correctly
- Test cleanup prevents memory leaks
- Test concurrent operation scenarios

### Coverage Requirements

- **MUST**: 90%+ line coverage for all managers
- **MUST**: 100% coverage for critical paths (event tracking, session management)
- **SHOULD**: Test all error handling branches

## Common Issues

### Critical (Must Fix)

- ❌ Direct state mutation: `this.state.foo = bar` (use setters instead)
- ❌ Missing cleanup for timers: `setInterval()` without `clearInterval()`
- ❌ Circular imports between managers
- ❌ Using `any` type without justification

### High Priority

- ⚠️ Async operations without error handling (`.catch()` or `try-catch`)
- ⚠️ No validation on constructor parameters
- ⚠️ Heavy synchronous operations blocking main thread
- ⚠️ Missing null checks before accessing nested properties

### Medium Priority

- 💡 Complex logic not extracted to utils
- 💡 Magic numbers without constants (use `constants/`)
- 💡 Missing JSDoc comments on public methods
- 💡 Inconsistent naming conventions
- 💡 Redundant comments (e.g., `// Set state` before state assignment)
- 💡 Obvious comments without context

## Code Comments Policy

**✅ Use comments for:**

- State management patterns and design decisions
- Complex business logic that's non-obvious
- Edge cases in session/event handling
- Cross-tab synchronization mechanics
- Queue management strategies

**❌ NEVER use comments for:**

- State access patterns (e.g., `// Get sessionId from state`)
- Obvious method calls (e.g., `// Track event`)
- Simple validations (e.g., `// Check if initialized`)
- Type information evident from TypeScript

## State Management Best Practices

### ✅ Good Patterns

```typescript
// Read state
const currentProject = this.state.config?.integrations?.tracelog?.projectId;

// Update state through setter
this.updateState({ isTracking: true });

// Conditional logic based on state
if (this.state.isInitialized) {
  this.performAction();
}
```

### ❌ Bad Patterns

```typescript
// NEVER: Direct mutation
this.state.isTracking = true;

// NEVER: Mutate nested objects
this.state.config.samplingRate = 0.5;

// NEVER: Reassign state
this.state = { ...this.state, isTracking: true };
```

## Dependency Injection Pattern

Managers should receive dependencies via constructor:

```typescript
export class EventManager extends StateManager {
  constructor(
    private sessionManager: SessionManager,
    private storageManager: StorageManager,
  ) {
    super();
  }

  track(event: Event): void {
    const sessionId = this.sessionManager.getSessionId();
    // Use injected dependencies
  }
}
```

## Example Review Comments

**Good**: "The `SessionManager` properly extends `StateManager` and accesses state via `this.state`. The session timeout logic looks correct. Consider adding error handling for the `localStorage.setItem()` call at line 78 to handle quota exceeded errors."

**Bad**: "This manager has issues." (Not specific or actionable)

**Good**: "BLOCKING: Direct state mutation at line 45: `this.state.isTracking = true`. This bypasses the state update mechanism and can cause sync issues. Use `this.updateState({ isTracking: true })` instead."

**Good**: "HIGH: Missing cleanup for `setInterval()` at line 92. Add `clearInterval(this.sessionCheckInterval)` to the `cleanup()` method at line 110. This will prevent timers from running after the manager is destroyed, causing memory leaks."

**Good**: "MEDIUM: The method `calculateMetrics()` at line 120 uses magic number `86400000`. Extract to a constant: `const ONE_DAY_MS = 24 * 60 * 60 * 1000;` in `constants/time.constants.ts` for better maintainability."
