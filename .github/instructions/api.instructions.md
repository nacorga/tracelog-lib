applyTo:
  - src/api.ts
  - src/public-api.ts
  - src/app.ts

# Public API & App Layer Review Instructions

## API Architecture Pattern

The public API layer provides the **external interface** users interact with:

```
User Code → public-api.ts (tracelog namespace)
              ↓
           api.ts (implementation)
              ↓
           app.ts (App class)
              ↓
         Managers/Handlers
```

## Critical Checks

### 1. SSR Safety (BLOCKING)
**ALL** public API methods MUST be SSR-safe:

```typescript
// ✅ GOOD: SSR-safe API method
export const init = async (config?: Config): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return; // Silently no-op in Node.js
  }
  // ... implementation
};

// ❌ BAD: Will crash in SSR
export const init = async (config?: Config): Promise<void> => {
  const instance = new App(); // App uses window/document immediately!
};
```

**SSR Requirements:**
- ✅ Check `typeof window === 'undefined'` at the START of every public method
- ✅ Check `typeof document === 'undefined'` at the START of every public method
- ✅ Return early (silently) when not in browser
- ❌ **BLOCK**: Missing SSR checks → Crashes in Next.js, Nuxt, Angular Universal, SvelteKit

### 2. State Management (BLOCKING)
- ✅ Single app instance (`let app: App | null = null`)
- ✅ Prevent multiple initializations (`if (app) { return; }`)
- ✅ Guard flags: `isInitializing`, `isDestroying`
- ✅ Cleanup on errors (call `destroy()` on failed init)
- ❌ **BLOCK**: Multiple app instances → Memory leaks, duplicate events

### 3. Error Handling (HIGH)
- ✅ Try-catch around ALL async operations
- ✅ Cleanup partially initialized state on errors
- ✅ Throw errors with context (`[TraceLog] prefix`)
- ✅ Graceful degradation for non-critical operations
- ⚠️ **HIGH**: Missing error handling → Unhandled promise rejections

### 4. Event Listener Buffering (HIGH)
- ✅ Buffer listeners registered before `init()` completes
- ✅ Flush buffer after initialization
- ✅ Clear buffer on destroy
- ⚠️ **HIGH**: No buffering → Listeners registered before init are lost

## Public API Methods

### `init(config?: Config): Promise<void>`

**Critical checks:**
1. SSR safety check FIRST
2. Global disable check (`window.__traceLogDisabled`)
3. Already initialized check
4. Already initializing check (prevent race condition)
5. Config validation
6. Timeout protection (default: 5 seconds)
7. Cleanup on failure

**Pattern:**
```typescript
export const init = async (config?: Config): Promise<void> => {
  // 1. SSR safety
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // 2. Global disable
  if (window.__traceLogDisabled) {
    return;
  }

  // 3. Already initialized
  if (app) {
    return;
  }

  // 4. Already initializing (prevent race condition)
  if (isInitializing) {
    return;
  }

  isInitializing = true;

  try {
    // 5. Validate config
    const validatedConfig = validateAndNormalizeConfig(config ?? {});
    const instance = new App();

    try {
      // 6. Flush pending listeners
      pendingListeners.forEach(({ event, callback }) => {
        instance.on(event, callback);
      });
      pendingListeners.length = 0;

      // 7. Initialize with timeout
      const initPromise = instance.init(validatedConfig);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`[TraceLog] Initialization timeout after ${TIMEOUT_MS}ms`));
        }, TIMEOUT_MS);
      });

      await Promise.race([initPromise, timeoutPromise]);

      app = instance;
    } catch (error) {
      // Cleanup partially initialized app
      try {
        instance.destroy(true);
      } catch (cleanupError) {
        log('error', 'Failed to cleanup partially initialized app', { error: cleanupError });
      }

      throw error;
    }
  } catch (error) {
    app = null;
    throw error;
  } finally {
    isInitializing = false;
  }
};
```

### `event(name: string, metadata?: Record<string, MetadataType>): void`

**Critical checks:**
1. SSR safety check
2. Not initialized check (throw error - user mistake)
3. Not destroying check (throw error - prevent race condition)
4. Validation before sending

**Pattern:**
```typescript
export const event = (name: string, metadata?: Record<string, MetadataType>): void => {
  // 1. SSR safety
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // 2. Not initialized
  if (!app) {
    throw new Error('[TraceLog] TraceLog not initialized. Please call init() first.');
  }

  // 3. Not destroying
  if (isDestroying) {
    throw new Error('[TraceLog] Cannot send events while TraceLog is being destroyed');
  }

  // 4. Send event
  app.sendCustomEvent(name, metadata);
};
```

### `on<K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void`

**Critical checks:**
1. SSR safety check
2. Buffer listeners if not initialized (IMPORTANT!)
3. Register immediately if initialized

**Listener buffering pattern:**
```typescript
export const on = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
  // 1. SSR safety
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // 2. Buffer if not initialized or initializing
  if (!app || isInitializing) {
    pendingListeners.push({ event, callback } as PendingListener);
    return;
  }

  // 3. Register immediately
  app.on(event, callback);
};
```

### `off<K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void`

**Critical checks:**
1. SSR safety check
2. Remove from pending buffer if not initialized
3. Unregister from app if initialized

### `destroy(): void`

**Critical checks:**
1. SSR safety check
2. Destroy in progress check (prevent double-destroy)
3. Not initialized check (throw error)
4. Force cleanup on errors (MUST succeed)
5. Clear all state (app, flags, buffer)

**Pattern:**
```typescript
export const destroy = (): void => {
  // 1. SSR safety
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // 2. Destroy in progress
  if (isDestroying) {
    throw new Error('[TraceLog] Destroy operation already in progress');
  }

  // 3. Not initialized
  if (!app) {
    throw new Error('[TraceLog] App not initialized');
  }

  isDestroying = true;

  try {
    // 4. Destroy app
    app.destroy();
    app = null;
    isInitializing = false;
    pendingListeners.length = 0;
  } catch (error) {
    // Force cleanup even on errors
    app = null;
    isInitializing = false;
    pendingListeners.length = 0;

    // Log but don't throw - destroy should always succeed
    log('warn', 'Error during destroy, forced cleanup completed', { error });
  } finally {
    isDestroying = false;
  }
};
```

## App Class Pattern

### Initialization Flow
1. **Setup state** - Call `setupState(config)` to initialize global state
2. **Setup integrations** - Load third-party scripts (Google Analytics, etc.)
3. **Create managers** - EventManager, StorageManager, SessionManager
4. **Initialize handlers** - ClickHandler, ScrollHandler, PageViewHandler, etc.
5. **Recover persisted events** - Load events from localStorage
6. **Set initialized flag** - Mark ready for use

### Destroy Flow
1. **Cleanup integrations** - Remove third-party scripts
2. **Stop handlers** - Call `stopTracking()` on all handlers
3. **Clear timers** - `clearTimeout()` for all timers
4. **Flush events** - Send pending events synchronously
5. **Stop managers** - Stop EventManager queue
6. **Remove listeners** - Clear emitter
7. **Reset state** - Clear flags, sessionId, etc.
8. **Set initialized to false** - Prevent further operations

### Error Handling in App
```typescript
// ✅ GOOD: Graceful degradation
async init(config: Config = {}): Promise<void> {
  if (this.isInitialized) {
    return;
  }

  this.managers.storage = new StorageManager();

  try {
    this.setupState(config);
    await this.setupIntegrations();

    this.managers.event = new EventManager(/* ... */);

    this.initializeHandlers();

    await this.managers.event.recoverPersistedEvents().catch((error) => {
      log('warn', 'Failed to recover persisted events', { error });
      // Continue initialization - recovery failure is non-critical
    });

    this.isInitialized = true;
  } catch (error) {
    this.destroy(true); // Force cleanup
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`[TraceLog] TraceLog initialization failed: ${errorMessage}`);
  }
}

// ❌ BAD: No cleanup on failure
async init(config: Config = {}): Promise<void> {
  this.setupState(config);
  await this.setupIntegrations();
  this.initializeHandlers(); // If this throws, state is partially initialized!
}
```

## Testing Requirements

### Unit Tests (api.ts)
- Test SSR safety (mock `window`/`document` as undefined)
- Test state management (prevent double init, etc.)
- Test listener buffering (register before init)
- Test error handling (cleanup on failure)
- Test guard flags (isInitializing, isDestroying)

### Integration Tests (app.ts)
- Test full initialization flow
- Test destroy cleans up all resources
- Test error recovery (partial init failure)
- Test handler lifecycle (start → stop)

### E2E Tests
- Test real-world usage patterns
- Test SSR frameworks (Next.js, Nuxt, Angular Universal)
- Test consent flow (init after consent, destroy on revoke)

## Common Issues

### Critical (Must Fix)
- ❌ Missing SSR safety checks (`typeof window === 'undefined'`)
- ❌ No guard flags (multiple init, double destroy)
- ❌ No cleanup on initialization failure
- ❌ Missing listener buffering (listeners before init lost)
- ❌ State mutation without proper checks

### High Priority
- ⚠️ Missing error handling in async operations
- ⚠️ No timeout protection on initialization
- ⚠️ Throwing errors from `destroy()` (should always succeed)
- ⚠️ Missing global disable check (`window.__traceLogDisabled`)
- ⚠️ No validation before operations

### Medium Priority
- 💡 Complex initialization logic not extracted to methods
- 💡 Missing JSDoc comments on public API
- 💡 No logging for important state changes
- 💡 Duplicate code across API methods
- 💡 Redundant comments that describe obvious operations
- 💡 Comments without contextual value

## Code Comments Policy

**✅ Use comments for:**
- SSR compatibility rationale and edge cases
- Complex initialization flow steps
- State guard patterns (prevent race conditions)
- Error recovery strategies
- Listener buffering mechanism

**❌ NEVER use comments for:**
- Obvious SSR checks (e.g., `// Check window exists`)
- Simple flag checks (e.g., `// Check if initialized`)
- Method call descriptions (e.g., `// Initialize app`)
- Type information in function signatures

## API Layer Checklist

**Before merging API/App changes:**

- [ ] SSR safety checks at start of ALL public methods
- [ ] Global disable check (`window.__traceLogDisabled`)
- [ ] Guard flags (isInitializing, isDestroying)
- [ ] Single app instance enforcement
- [ ] Listener buffering for pre-init registration
- [ ] Cleanup on initialization failure
- [ ] Timeout protection on async init
- [ ] Error handling with context
- [ ] State validation before operations
- [ ] Proper destroy flow (cleanup + reset state)

## Example Review Comments

**Good**: "BLOCKING: Missing SSR safety check at the start of `init()` method. Add `if (typeof window === 'undefined' || typeof document === 'undefined') { return; }` at line 20. This will crash in Next.js/Nuxt/Angular Universal SSR environments."

**Good**: "HIGH: The initialization at line 45 doesn't have timeout protection. Add `Promise.race()` with a timeout to prevent infinite hangs. Example: `await Promise.race([initPromise, timeoutPromise(5000)])`. This prevents the library from hanging indefinitely if initialization fails silently."

**Good**: "BLOCKING: The `destroy()` method throws an error on line 150. Destroy MUST always succeed, even if errors occur. Wrap the destroy logic in try-catch and force cleanup in finally block. Applications should always be able to tear down TraceLog, even if internal cleanup fails."

**Good**: "The listener buffering pattern looks correct. Consider adding a test case for the race condition where listeners are registered during initialization (after init() called but before it completes) to ensure they're properly buffered."
