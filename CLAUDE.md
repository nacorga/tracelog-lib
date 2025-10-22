# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TraceLog is a client-side JavaScript analytics library that automatically tracks user interactions with optional backend integrations. The library is **fully autonomous** - it requires no backend to function and only sends events to servers when explicitly configured.

**Key Principle**: Client-only first. The library captures events locally and emits them via event listeners. Network requests are opt-in via integration configuration.

## Essential Commands

### Development & Building
```bash
# Build all outputs (ESM + CJS + Browser bundles)
npm run build:all

# Type checking (required before commit)
npm run type-check

# Code quality checks (lint + format validation)
npm run check

# Auto-fix code issues
npm run fix
```

### Testing
```bash
# Unit tests only (Vitest)
npm run test:unit

# Integration tests (Vitest)
npm run test:integration

# E2E tests (Playwright - requires test server)
npm run test:e2e

# Coverage report (must hit 90%+ for core logic)
npm run test:coverage

# Start test server for E2E (runs on localhost:3000)
npm run serve
```

### Testing Workflow
```bash
# Terminal 1: Start test server
npm run serve

# Terminal 2: Run E2E tests
npm run test:e2e

# Or: Run specific E2E test file
npm run test:e2e -- basic-initialization
```

## Architecture

### Core Flow
```
User Interaction → Handler captures → EventManager.track() →
→ Queue batching → [Optional: SenderManager sends to backend] →
→ Emit via emitter.emit() for local listeners
```

### Component Hierarchy

**App** (orchestrator)
  ├── **Managers** (core business logic)
  │   ├── StateManager (global state - base class for all components)
  │   ├── StorageManager (localStorage/sessionStorage wrapper with fallback)
  │   ├── EventManager (event queue, deduplication, rate limiting, sending coordination)
  │   ├── SessionManager (session lifecycle, cross-tab sync via BroadcastChannel)
  │   └── UserManager (UUID generation and persistence)
  │
  ├── **Handlers** (event capture - extend StateManager)
  │   ├── SessionHandler (wrapper around SessionManager)
  │   ├── PageViewHandler (navigation, SPA route changes)
  │   ├── ClickHandler (click interactions with PII sanitization)
  │   ├── ScrollHandler (scroll depth, velocity, multi-container)
  │   ├── PerformanceHandler (Web Vitals via web-vitals library)
  │   ├── ErrorHandler (JS errors, promise rejections)
  │   └── ViewportHandler (element visibility via IntersectionObserver)
  │
  └── **Integrations** (optional)
      └── GoogleAnalyticsIntegration (forwards custom events to GA4)

### State Management Pattern

All managers and handlers extend `StateManager` for shared state access:

```typescript
// All components can access global state
this.get('sessionId')
this.set('config', config)
this.getState() // Full state snapshot
```

### Transformer System

Runtime event transformation hooks for custom data manipulation:

**Available Hooks**:
- **`beforeSend`**: Per-event transformation (applied in `EventManager.buildEventPayload()` BEFORE deduplication, sampling, and queueing)
- **`beforeBatch`**: Batch transformation (applied in `SenderManager` BEFORE network transmission)

**Application Timeline**:
```
User Event → Handler → EventManager.buildEventPayload()
  ↓
  beforeSend transformer applied here (standalone mode OR custom backend only)
  ↓
Deduplication check → Sampling check → Add to queue
  ↓
Queue flush trigger → EventManager.buildEventsPayload()
  ↓
  beforeBatch transformer applied here (standalone mode only)
  ↓
  [If backend configured] → SenderManager.send() → beforeBatch transformer applied
  ↓
Network transmission (fetch/sendBeacon) OR local emission only
```

**Integration Behavior**:
- ✅ **Standalone Mode (no backend)**: Both `beforeSend` and `beforeBatch` applied in EventManager, events emitted to local listeners with transformations
- ✅ **Custom Backend (only)**: Both `beforeSend` and `beforeBatch` applied
- ❌ **TraceLog SaaS (only)**: Both transformers silently ignored (schema protection)
- ⚠️ **Multi-Integration (SaaS + Custom)**: SaaS receives original events, custom receives transformed events (per-integration in SenderManager)
- ❌ **Google Analytics**: Neither transformer applied (forwards `tracelog.event()` calls as-is)

**API Methods**:
```typescript
tracelog.setTransformer(hook, fn)      // Set transformer (validates fn is function)
tracelog.removeTransformer(hook)        // Remove transformer
app.getTransformer(hook)                // Get transformer (internal)
```

**Error Handling**:
- Input validation: Throws error if `fn` is not a function
- Runtime exceptions caught and logged
- Original event/batch used as fallback on error
- Returning `null` filters out event/batch

### Initialization Flow

1. `api.init(config)` → validates config and normalizes it
2. `App.init()` begins initialization:
   - **Step 1**: Create StorageManager (localStorage/sessionStorage wrapper with fallback)
   - **Step 2**: Setup state (config, userId, device, pageUrl, mode detection)
   - **Step 3**: Initialize ConsentManager (loads persisted consent, enables emitter)
   - **Step 4**: Log consent state if `waitForConsent` enabled
   - **Step 5**: Setup integrations (Google Analytics if configured and consented)
     - If `waitForConsent: true` and no consent → deferred initialization
     - Later initialized via `handleConsentGranted()` when consent granted
   - **Step 6**: Initialize EventManager (receives transformers from App, creates SenderManagers)
   - **Step 7**: Initialize handlers (Session, PageView, Click, Scroll, Performance, Error, Viewport)
     - Handlers are conditionally created based on `disabledEvents` config
   - **Step 8**: Recover persisted events from localStorage (non-fatal errors logged)
   - **Step 9**: Set `isInitialized = true`
3. Pending listeners and transformers applied during steps 6-7
4. Initial events fire (SESSION_START, PAGE_VIEW) during handler initialization

### Recommended User Initialization Order

**Critical for developers:** Users should follow this sequence to capture all events:

```typescript
// 1. FIRST: Register event listeners (before init)
tracelog.on('event', eventHandler);
tracelog.on('queue', queueHandler);

// 2. SECOND: Configure transformers (before init)
// Works in standalone mode (no backend) and custom backend mode
tracelog.setTransformer('beforeSend', (event) => { /* transform */ });
tracelog.setTransformer('beforeBatch', (batch) => { /* transform */ });

// 3. THIRD: Initialize (starts tracking immediately)
await tracelog.init({ /* config */ });

// 4. FOURTH: Send custom events (after init completes)
tracelog.event('custom_event', { /* metadata */ });
```

**Why this order matters:**
- **Listeners before init**: `SESSION_START` and `PAGE_VIEW` events fire during `App.init()` → `SessionHandler.startTracking()` → `SessionManager.startNewSession()`. Listeners registered after `init()` miss these events.
- **Transformers before init**: `beforeSend` is applied in `EventManager.buildEventPayload()` which runs for initial events. Setting transformers after init means initial events won't be transformed.
- **Custom events after init**: Calling `tracelog.event()` before `init()` throws an error (app not initialized check in `api.ts`).

**Technical flow during init:**
```
tracelog.init()
  → App.init()
    → SessionHandler.startTracking()
      → SessionManager.startNewSession()
        → EventManager.track({ type: SESSION_START })
          → EventManager.buildEventPayload() [beforeSend applied here]
            → emitter.emit('event', sessionStartEvent) [listeners called here]
    → PageViewHandler.startTracking()
      → EventManager.track({ type: PAGE_VIEW })
        → [same flow as above]
```

## Critical Patterns

### Client-Side Controls

**Everything happens in the browser** - no backend required:
- Event Control (`disabledEvents` - disable specific auto-tracked events)
- Sampling (`samplingRate`, `errorSampling`)
- Deduplication (LRU cache with 1000-entry fingerprints)
- Rate limiting (50 events/sec, per-event-name limits)
- Validation and sanitization
- Event batching (10-second intervals or 50-event threshold)

### Integration Modes

```typescript
// 1. Standalone (no backend) - DEFAULT
// Events only emitted to local listeners, transformers applied
tracelog.on('event', (event) => console.log('Event:', event));
tracelog.on('queue', (queue) => console.log('Queue:', queue));

tracelog.setTransformer('beforeSend', (event) => ({
  ...event,
  customField: 'Added by transformer'
}));

tracelog.setTransformer('beforeBatch', (queue) => ({
  ...queue,
  queueCustomField: 'Batch transformed'
}));

await tracelog.init();
// Transformers applied, events visible in listeners with custom fields

// 2. TraceLog SaaS
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'project-id' }
  }
});

// 3. Custom Backend
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'https://api.example.com/collect',
      allowHttp: false  // Only true for testing
    }
  }
});

// 4. Google Analytics/GTM
await tracelog.init({
  integrations: {
    google: {
      measurementId: 'G-XXXXXX',      // GA4 (optional)
      containerId: 'GTM-XXXXXXX'       // GTM (optional)
    }
  }
});

// 5. With Event Control (disable optional events)
await tracelog.init({
  disabledEvents: ['scroll', 'web_vitals', 'error']
  // Core events (PAGE_VIEW, CLICK, SESSION) still tracked
});

// 6. Multi-Integration - Simultaneous sending
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'project-id' },           // Analytics dashboard
    custom: { collectApiUrl: 'https://warehouse.com' } // Data warehouse
  }
});
// Events sent to BOTH endpoints independently with:
// - Independent error handling (4xx/5xx per integration)
// - Independent retry/persistence (separate localStorage keys)
// - Parallel sending (non-blocking)
```

### Multi-Integration Architecture

**State Structure:**
```typescript
interface State {
  collectApiUrls: {       // Multi-integration support
    saas?: string;        // TraceLog SaaS URL
    custom?: string;      // Custom backend URL
  };
  // ... other fields
}
```

**SenderManager (Per-Integration):**
- Each integration has its own `SenderManager` instance
- Constructor: `new SenderManager(storage, 'saas' | 'custom', 'https://...')`
- Storage keys: `tlog:queue:{userId}:saas`, `tlog:queue:{userId}:custom`
- Independent error handling, retry logic, and persistence

**EventManager (Orchestration):**
- Manages array of `SenderManager[]` (0-2 instances)
- Parallel async sending: `Promise.allSettled()`
- Sync sending (sendBeacon): All must succeed
- Independent recovery per integration

**Error Handling:**
| Integration | Error Type | Behavior |
|-------------|-----------|----------|
| SaaS | 4xx (permanent) | Clear storage, no retry |
| SaaS | 5xx (temporary) | Persist to `tlog:queue:{userId}:saas`, retry next page |
| Custom | 4xx (permanent) | Clear storage, no retry |
| Custom | 5xx (temporary) | Persist to `tlog:queue:{userId}:custom`, retry next page |

### Event Queue & Sending

- Events batched in EventManager queue
- Sent every 10 seconds OR when 50-event threshold reached
- Uses `navigator.sendBeacon()` for page unload (synchronous)
- Uses `fetch()` for normal operation (asynchronous)
- **NO in-session retries** - Events removed from queue immediately after send attempt
- Failed events persist in localStorage for next-page recovery
- 4xx errors = permanent failure (cleared, not persisted)
- 5xx/network errors = removed from queue + persisted for next-page recovery
- Recovery guard prevents concurrent recovery attempts during rapid navigation
- Multi-tab protection prevents data loss when multiple tabs fail simultaneously (1s window)

### Testing Bridge (E2E Only)

E2E tests use `window.__traceLogBridge` injected when `NODE_ENV=development`:

```typescript
// In Playwright tests
const result = await page.evaluate(async () => {
  await window.__traceLogBridge!.init();
  window.__traceLogBridge!.sendCustomEvent('test', { key: 'value' });
  return window.__traceLogBridge!.getSessionData();
});
```

**Important**: Bridge only available in dev builds. Production builds exclude it.

## Build System

### Build Tool: tsup

The library uses [tsup](https://tsup.egoist.dev/) for bundling - a fast TypeScript bundler powered by esbuild.

### Output Structure
```
dist/
├── public-api.js        # ESM bundle
├── public-api.cjs       # CommonJS bundle
├── public-api.d.ts      # TypeScript declarations (ESM)
├── public-api.d.mts     # TypeScript declarations (CJS)
├── public-api.js.map    # Source map (ESM)
├── public-api.cjs.map   # Source map (CJS)
└── browser/             # Vite → Browser bundles
    ├── tracelog.js      # IIFE format (window.tracelog)
    └── tracelog.esm.js  # ES Module format
```

### TypeScript Configuration

**Strict Mode Enforced** (15+ flags):
- All `strict` compiler options enabled
- `noUnusedLocals`, `noUnusedParameters`
- `noImplicitReturns`, `noFallthroughCasesInSwitch`
- `noUncheckedIndexedAccess`, `noImplicitOverride`

Target: ES2022, Lib: DOM + ES2022

### Build Process

1. `npm run build` → tsup bundles ESM + CJS (single files)
2. `npm run build:browser` → Vite bundles for CDN/script tags
3. `npm run build:all` → Complete build (tsup + browser)

## Testing Strategy

### Unit Tests (Vitest)
- Location: `tests/unit/`
- Coverage: 90%+ required for core logic
- Mock-heavy: localStorage, BroadcastChannel, fetch, DOM APIs
- Focus: Individual functions and classes

### Integration Tests (Vitest)
- Location: `tests/integration/`
- Focus: Component interactions (e.g., EventManager + SessionManager)
- No full App instantiation

### E2E Tests (Playwright)
- Location: `tests/e2e/`
- Browser: Chromium + Mobile Chrome (CI), all browsers (local)
- Server: `http://localhost:3000` (auto-started)
- Bridge: `window.__traceLogBridge` for test control
- Patterns: See `.cursor/rules/e2e.mdc` for CSP-safe patterns

**Critical E2E Rules**:
- ❌ Never use `page.waitForFunction()` (CSP-blocked)
- ✅ Use `page.evaluate()` with internal waits
- ✅ Clear localStorage/sessionStorage in `beforeEach`
- ✅ Check `queue.session_id` (NOT in individual events)
- ✅ MUST follow E2E patterns in [tests/TESTING_GUIDE.md](tests/TESTING_GUIDE.md)

## Security & Privacy

### Automatic Protections

1. **Input Value Protection**: NEVER captures values from `<input>`, `<textarea>`, `<select>`
2. **PII Sanitization**: Redacts emails, phones, credit cards, API keys, tokens from text/errors
3. **URL Parameter Filtering**: Removes 15 default sensitive params (token, auth, key, etc.)
4. **Element Exclusion**: Respects `data-tlog-ignore` attribute

### Developer Responsibilities

1. **Consent Management**: Only call `init()` after user grants consent
2. **Custom Event Sanitization**: YOU must sanitize metadata passed to `tracelog.event()`
3. **Sensitive Elements**: Mark payment forms, admin actions with `data-tlog-ignore`
4. **URL Params**: Extend `sensitiveQueryParams` config for app-specific params

See [SECURITY.md](./SECURITY.md) for complete guide.

## Code Comments Policy

### When to Use Comments

**✅ Use comments for:**
- **JSDoc for public APIs**: Complete documentation with `@param`, `@returns`, `@example`, `@throws`
- **Section organization**: Organizational section comments (e.g., `//  ===`) in constants files
- **Complex logic explanations**: Clarify non-obvious logic or algorithms
- **Design rationale**: Explain "why" (design decisions) rather than "what" (code description)
- **Edge cases**: Document special behaviors and edge case handling
- **Important patterns**: Context about critical patterns (BroadcastChannel, multi-tab sync, etc.)
- **Magic values**: Explain timeouts, limits, thresholds with justification

**❌ DO NOT use comments for:**
- **Repeating code**: Comments that only rephrase what the code does
- **Obvious statements**: Comments that duplicate function/variable names
- **Check pattern**: Comments like "Check if X" followed by `if (X)`
- **Silent pattern**: Comments like "Silent X" without additional context
- **Redundant descriptions**: Comments before self-explanatory code
- **Type descriptions**: Comments describing types already evident from TypeScript

### Examples

```typescript
// ❌ BAD: Redundant comment
// Check if user is authenticated
if (isAuthenticated) { ... }

// ✅ GOOD: Explains "why" and edge case
// Skip session validation during recovery to prevent infinite loops
// when multiple tabs fail simultaneously (1s window protection)
if (isRecovering) { ... }

// ❌ BAD: Obvious comment
// Set session ID
this.set('sessionId', newSessionId);

// ✅ GOOD: Explains design decision
// Store session ID in queue root (not per-event) to reduce payload size
// and maintain consistency across multi-integration sends
this.set('sessionId', newSessionId);
```

## Code Patterns

### Adding a New Handler

1. Create `src/handlers/new-handler.handler.ts`:
```typescript
export class NewHandler extends StateManager {
  constructor(private eventManager: EventManager) {
    super();
  }

  startTracking(): void {
    document.addEventListener('event', this.handleEvent, { passive: true });
  }

  stopTracking(): void {
    document.removeEventListener('event', this.handleEvent);
  }

  private handleEvent = (event: Event): void => {
    this.eventManager.track({
      type: EventType.CUSTOM,
      custom_event: { name: 'new_event', metadata: {} }
    });
  };
}
```

2. Register in `App.initHandlers()`:
```typescript
this.handlers.new = new NewHandler(this.managers.event);
this.handlers.new.startTracking();
```

3. Add cleanup in `App.destroy()`:
```typescript
this.handlers.new?.stopTracking();
```

### State Access Pattern

```typescript
// Reading state
const sessionId = this.get('sessionId');
const config = this.get('config');

// Writing state
this.set('sessionId', newSessionId);

// Full snapshot
const state = this.getState();
```

### Transformer Pattern

Transformers are stored in the `App` class and passed to `EventManager` and `SenderManager`:

```typescript
// In App class
private readonly transformers: TransformerMap = {};

// TransformerMap interface (from transformer.types.ts)
interface TransformerMap {
  beforeSend?: BeforeSendTransformer;
  beforeBatch?: BeforeBatchTransformer;
}

// Setting a transformer with validation
setTransformer(hook: TransformerHook, fn: (data: EventData | EventsQueue) => EventData | EventsQueue | null): void {
  if (typeof fn !== 'function') {
    throw new Error(`[TraceLog] Transformer must be a function, received: ${typeof fn}`);
  }
  this.transformers[hook] = fn as BeforeSendTransformer & BeforeBatchTransformer;
}

// In EventManager.buildEventPayload() - beforeSend application with minimal validation
const collectApiUrls = this.get('collectApiUrls');
const hasCustomBackend = Boolean(collectApiUrls?.custom);
const beforeSendTransformer = this.transformers.get('beforeSend');

if (beforeSendTransformer && hasCustomBackend) {
  try {
    const transformed = beforeSendTransformer(payload);
    if (transformed === null) return null; // Filter event

    // Minimal validation: only check for 'type' field (allows custom schemas)
    if (transformed && typeof transformed === 'object' && 'type' in transformed) {
      payload = transformed as EventData;
    } else {
      log('warn', 'beforeSend transformer returned invalid data, using original');
    }
  } catch (error) {
    log('error', 'beforeSend transformer threw error, using original event', { error });
  }
}

// In SenderManager - beforeBatch application with minimal validation
// Note: beforeSend is NO LONGER applied here (moved to EventManager)
const beforeBatchTransformer = this.transformers.get('beforeBatch');

if (this.integrationId === 'saas') {
  return body; // Skip for SaaS
}

if (beforeBatchTransformer) {
  const transformed = beforeBatchTransformer(body);
  if (transformed === null) return null; // Filter batch

  // Minimal validation: only check for 'events' array (allows custom schemas)
  if (transformed && typeof transformed === 'object' && 'events' in transformed && Array.isArray(transformed.events)) {
    return transformed as EventsQueue;
  } else {
    // Fallback to original on invalid return
    log('warn', 'beforeBatch transformer returned invalid data, using original');
    return body;
  }
}
```

**Validation Philosophy:**
- Only validates discriminator fields (`type` for events, `events` for batches)
- Allows completely custom schemas for custom backend integrations
- Falls back to original data if transformer returns invalid structure
- Designed for maximum flexibility while maintaining type safety

### Manager/Handler Lifecycle

All handlers implement:
- `startTracking()` - Attach listeners, initialize
- `stopTracking()` - Remove listeners, cleanup timers
- Optional `destroy()` - Deep cleanup for managers

## Important Constants

### Config (src/constants/config.constants.ts)
- `DEFAULT_SESSION_TIMEOUT_MS`: 900000 (15 minutes)
- `MAX_EVENTS_QUEUE_LENGTH`: 100
- `MAX_PENDING_EVENTS`: 100
- `SEND_EVENTS_INTERVAL_MS`: 10000 (10 seconds)
- `SCROLL_DEBOUNCE_TIME_MS`: 250ms
- `MAX_SCROLL_EVENTS_PER_SESSION`: 120

### Deduplication
- LRU cache: 1000 fingerprints
- Click precision: 10px coordinate rounding
- Time threshold: 500ms
- Auto-prune: >5 seconds old

## Critical Don'ts

### Dependencies
- ❌ DON'T add runtime dependencies (only `web-vitals` allowed)
- ❌ DON'T break ESM/CJS dual compatibility
- ❌ DON'T commit without passing `npm run check`

### Performance
- ❌ DON'T cause memory leaks (always call cleanup in handlers)
- ❌ DON'T block main thread (use passive listeners)
- ❌ DON'T send high-frequency events without throttling

### State & Architecture
- ❌ DON'T mutate `globalState` directly (use StateManager.set)
- ❌ DON'T instantiate multiple App instances
- ❌ DON'T call init() in SSR (typeof window check required)

### Testing
- ❌ DON'T use `page.waitForFunction()` in E2E tests (CSP-blocked)
- ❌ DON'T skip data isolation in test beforeEach hooks
- ❌ DON'T access internal APIs (_app, etc.) in tests
- ❌ DON'T use uppercase event types in filters (use lowercase: `'click'` not `'CLICK'`)
- ❌ DON'T ignore [tests/TESTING_GUIDE.md](tests/TESTING_GUIDE.md) patterns - they prevent common E2E failures

## File Naming Conventions

- Handlers: `*.handler.ts` (e.g., `click.handler.ts`)
- Managers: `*.manager.ts` (e.g., `event.manager.ts`)
- Types: `*.types.ts` (e.g., `event.types.ts`)
- Utils: `*.utils.ts` (e.g., `sanitize.utils.ts`)
- Constants: `*.constants.ts` (e.g., `config.constants.ts`)

## Release Process

```bash
# Automated release (recommended)
npm run release              # Interactive prompts

# Manual version bump
npm run release:patch        # 0.11.2 → 0.11.3
npm run release:minor        # 0.11.2 → 0.12.0
npm run release:major        # 0.11.2 → 1.0.0

# Dry run (test changelog generation)
npm run release:dry-run
```

Release script (`scripts/release.js`):
1. Runs quality checks (lint, format, type-check)
2. Builds all outputs
3. Generates changelog
4. Commits + tags version
5. Pushes to GitHub
6. Publishes to npm

## Environment Variables

- `NODE_ENV=development` - Enables test bridge, dev sourcemaps
- `NODE_ENV=production` - Minifies, excludes test bridge, hidden sourcemaps

## Documentation

- [README.md](./README.md) - Quick start, API reference
- [SECURITY.md](./SECURITY.md) - Privacy & security guide
- [CHANGELOG.md](./CHANGELOG.md) - Release history
- [src/handlers/README.md](./src/handlers/README.md) - Handler implementations
- [src/managers/README.md](./src/managers/README.md) - Manager details
- [tests/TESTING_GUIDE.md](./tests/TESTING_GUIDE.md) - Complete testing guide

## Key Files

- `src/api.ts` - Public API entry point (`init`, `event`, `destroy`, `on`, `off`)
- `src/app.ts` - Main orchestrator class
- `src/public-api.ts` - Export aggregator (what gets bundled)
- `tsup.config.ts` - tsup bundler configuration (ESM/CJS)
- `vite.config.mjs` - Browser build configuration
- `tsconfig.json` - Base TypeScript config (strict mode)

## Browser Compatibility

- Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- Graceful degradation if APIs unavailable (IntersectionObserver, BroadcastChannel)
- SSR-safe (all methods no-op in Node.js)

## Workflow Tips

### Pre-commit Flow
```bash
npm run check        # Lint + format validation
npm run type-check   # TypeScript strict checks
npm run test:unit    # Run unit tests
```

### Debugging E2E Tests
```bash
# 1. Start server
npm run serve

# 2. Enable headed mode + trace
npx playwright test --headed --trace on

# 3. View trace on failure
npx playwright show-trace tests-results/trace.zip
```

### Testing Specific Components
```bash
# Single unit test file
npm run test:unit -- event.manager.test.ts

# Single E2E test
npm run test:e2e -- basic-initialization

# Watch mode (unit tests)
npm run test:unit:watch
```

## CI/CD

- GitHub Actions: `.github/workflows/ci.yml`
- Runs on: Push to develop/main, PRs
- Tests: Unit + Integration + E2E (Chromium + Mobile Chrome)
- Coverage: Uploads to Codecov
- Build: Verifies all outputs build successfully

## Additional Context

### Why Client-Only Architecture?

TraceLog is designed to work **without any backend** to maximize flexibility:
- Use as standalone analytics (local event consumption)
- Integrate with TraceLog SaaS (optional)
- Send to custom backend (optional)
- Forward to Google Analytics (optional)

This means network requests are **opt-in**, not required.

### Session Management

Sessions sync across tabs via BroadcastChannel:
- Primary tab creates session
- Other tabs receive session ID via broadcast
- Session recovered from localStorage on refresh
- No duplicate SESSION_START events on recovery

### Event Lifecycle

1. Handler captures interaction
2. EventManager validates + deduplicates
3. EventManager applies sampling + rate limiting
4. EventManager adds to queue
5. EventManager emits via emitter (for local listeners)
6. EventManager batches and sends (if backend configured)
7. SenderManager transmits via fetch/sendBeacon
8. Failed events persist for next-page recovery

### QA Mode

**Activation/Deactivation via URL:**
```bash
# Activate
?tlog_mode=qa

# Deactivate
?tlog_mode=qa_off
```

**Programmatic API:**
```typescript
tracelog.setQaMode(true);   // Enable
tracelog.setQaMode(false);  // Disable
```

**Features:**
- Custom events logged to console (not sent to backend)
- Strict validation (throws errors instead of silent failures)
- Events still emitted to `on('event')` listeners
- State persisted in sessionStorage across page reloads
- URL param auto-cleaned after detection
- Useful for manual testing and debugging

**Usage:**
```typescript
// Via URL
http://localhost:3000?tlog_mode=qa

// Via code
await tracelog.init();
tracelog.setQaMode(true);
tracelog.event('test', { key: 'value' }); // Logged to console
