---
applyTo: 'src/handlers/**/*.ts'
---

# Handler-Specific Review Instructions

## Handler Architecture Pattern

All event handlers in `src/handlers/` must follow this pattern:

```typescript
export class CustomHandler {
  constructor(private eventManager: EventManager) {}

  startTracking(): void {
    // Attach event listeners
    document.addEventListener('event', this.handleEvent, { passive: true });
  }

  stopTracking(): void {
    // CRITICAL: Remove ALL event listeners
    document.removeEventListener('event', this.handleEvent);
  }

  private handleEvent = (event: Event): void => {
    // Process and track event
    this.eventManager.track({
      /* ... */
    });
  };
}
```

## Critical Checks

### 1. Event Listener Management (BLOCKING)

- ✅ Every `addEventListener()` has a matching `removeEventListener()` in `stopTracking()`
- ✅ Arrow functions used for handlers to maintain `this` context
- ✅ Same function reference used in both add/remove calls
- ❌ **BLOCK**: Missing `removeEventListener()` → Memory leak

### 2. Performance Optimization (BLOCKING)

- ✅ Scroll/touch listeners use `{ passive: true }` option
- ✅ High-frequency events properly debounced
- ✅ No synchronous heavy operations in event handlers
- ❌ **BLOCK**: Missing `{ passive: true }` on scroll/touch → Performance impact

### 3. Dependency Management (BLOCKING)

- ✅ Only import from `types/`, `constants/`, `utils/`
- ✅ Never import from `managers/` (use constructor injection)
- ✅ EventManager injected via constructor
- ❌ **BLOCK**: Import from `managers/` → Circular dependency

### 4. State Access (HIGH)

- ✅ Handlers do NOT extend `StateManager` (only managers do)
- ✅ Access global state through injected managers or via constructor params
- ⚠️ **HIGH**: Handler extending `StateManager` → Wrong pattern

## Handler-Specific Patterns

### Click Handler

- Validate click target detection logic
- Check for proper element filtering (links, buttons)
- Ensure metadata collection is safe (no PII in attributes)

### Scroll Handler

- Verify scroll depth calculation accuracy
- Check for proper container selector handling
- Ensure debounce timing is appropriate (~200ms)

### Page View Handler

- Validate URL sanitization (sensitive query params)
- Check for proper referrer handling
- Ensure navigation timing is accurate

### Performance Handler

- Verify Web Vitals integration (`onLCP`, `onCLS`, `onINP`, `onFCP`, `onTTFB`)
- Check for proper metric attribution
- Ensure single metric reporting per page load

### Viewport Visible Handler

- Validate IntersectionObserver usage
- Check for proper observer cleanup in `stopTracking()`
- Ensure threshold configuration is correct

## Testing Requirements

### Unit Tests

- Test `startTracking()` attaches listeners correctly
- Test `stopTracking()` removes all listeners
- Test event processing logic in isolation
- Mock `EventManager.track()` to verify call arguments

### Integration Tests

- Test handler interaction with real EventManager
- Verify event queueing behavior
- Test handler cleanup prevents memory leaks

### E2E Tests

- Use `window.__traceLogBridge.handlers` to verify handler state
- Test real user interactions trigger correct events
- Verify handlers work across page navigations

## Common Issues

### Critical (Must Fix)

- ❌ Forgot `removeEventListener()` in `stopTracking()`
- ❌ Using inline anonymous function in `addEventListener()` (can't remove)
- ❌ Importing `managers/` directly instead of constructor injection
- ❌ Missing `{ passive: true }` on scroll/touch listeners

### High Priority

- ⚠️ No debouncing on high-frequency events (scroll, resize, mousemove)
- ⚠️ Heavy computation in event handler (blocks main thread)
- ⚠️ No null checks before accessing event properties
- ⚠️ Missing error handling in event processing

### Medium Priority

- 💡 Complex event processing logic not extracted to utils
- 💡 Hardcoded values instead of constants
- 💡 Missing JSDoc comments on public methods
- 💡 Duplicate code across multiple handlers
- 💡 Redundant comments that only repeat code
- 💡 Comments without value (e.g., `// Check if X` before `if (X)`)

## Code Comments Policy

**✅ Use comments for:**

- Complex event processing logic that's non-obvious
- Edge case handling and special behaviors
- Performance optimizations (e.g., "Debounced to prevent main thread blocking")
- Browser compatibility workarounds

**❌ NEVER use comments for:**

- Obvious event listener registration (e.g., `// Add click listener`)
- Repeating method names (e.g., `// Start tracking` before `startTracking()`)
- Simple conditional checks (e.g., `// Check if element exists` before `if (element)`)
- Type information already in TypeScript signatures

## Example Review Comments

**Good**: "The `ClickHandler.stopTracking()` properly removes all event listeners. Consider adding a null check before accessing `event.target` in `handleClick()` to prevent potential errors."

**Bad**: "This code needs work." (Not specific or actionable)

**Good**: "BLOCKING: Missing `removeEventListener('scroll', this.handleScroll)` in `ScrollHandler.stopTracking()`. This will cause a memory leak when handlers are reinitialized. Add the cleanup in line 45."

**Good**: "HIGH: The scroll listener at line 23 is missing `{ passive: true }` option. This can cause jank during scrolling. Change to: `document.addEventListener('scroll', this.handleScroll, { passive: true, capture: false })`"
