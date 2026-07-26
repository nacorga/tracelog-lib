# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TraceLog is a **client-first analytics library** that captures user interactions autonomously. Backend integration is optional—the library works standalone by emitting events locally.

**Core Principle**: Client-only first. Events captured locally, network requests are opt-in.

**No internal task/audit refs**: code comments, test/`describe` names, and docs describe *behavior*,
never the task/audit that produced it — no `WP3`, `P0-1`, `DA-5`, `audit Finding N`, `task N`,
`§N`, `ui-big-bang`, or short codes `(A4)`/`(T15)`. Cite external RFCs as "section N". Enforced
write-time by `.claude/hooks/lint-patterns.sh`.

---

## Essential Commands

### Development Workflow
```bash
# Build
npm run build:all           # ESM + CJS + Browser bundles (tsup + Vite)

# Quality Checks (REQUIRED before commit)
npm run check               # Lint + format validation
npm run fix                 # Auto-fix lint/format issues
npm run type-check          # TypeScript strict mode (15+ flags)

# Testing
npm run test:unit           # Vitest unit tests
npm run test:integration    # Vitest integration tests
npm run test:e2e            # Playwright E2E (requires test server)
npm run test:coverage       # Coverage report (90%+ for core logic)

# Development Server
npm run serve               # Test server on localhost:3000
npm run docs:dev            # Docs server with hot reload
```

### Testing Workflow
```bash
# Terminal 1: Start test server for E2E
npm run serve

# Terminal 2: Run E2E tests
npm run test:e2e                    # All E2E tests
npm run test:e2e -- basic-init     # Specific test file

# Unit/Integration (no server needed)
npm run test:unit -- event.manager.test.ts
npm run test:integration -- flows/event-pipeline.test.ts
```

### Release
```bash
npm run release              # Interactive (recommended)
npm run release:patch        # 0.11.2 → 0.11.3
npm run release:minor        # 0.11.2 → 0.12.0
npm run release:major        # 0.11.2 → 1.0.0
```

---

## Architecture Quick Reference

### Core Flow
```
User Interaction → Handler captures → EventManager.track() →
→ Client validation/deduplication/sampling →
→ Queue batching →
→ [Optional: SenderManager → Backend] →
→ Emit via emitter.emit() for local listeners
```

### Component Hierarchy
```
App (orchestrator)
├── Managers (core logic)
│   ├── StateManager (global state - base class for all)
│   ├── StorageManager (localStorage/sessionStorage with fallback)
│   ├── EventManager (queue, dedup, rate limiting)
│   ├── SessionManager (lifecycle, BroadcastChannel sync)
│   ├── SenderManager (SaaS transport, retry, persistence, 429 cooldown)
│   ├── UserManager (UUID generation)
│   └── TimeManager (timestamps with monotonic guarantee)
│
└── Handlers (event capture - extend StateManager)
    ├── SessionHandler (wrapper around SessionManager)
    ├── PageViewHandler (navigation, SPA routes)
    ├── ClickHandler (interactions, PII sanitization)
    ├── ScrollHandler (depth + direction, multi-container)
    ├── PerformanceHandler (Web Vitals via web-vitals lib)
    └── ErrorHandler (JS errors, promise rejections)
```

### State Access Pattern
All components extend `StateManager`:
```typescript
this.get('sessionId')       // Read state
this.set('config', config)  // Write state
this.getState()             // Full snapshot
```

---

## Critical Patterns

### 1. Initialization Order (User-Facing API)
Users must follow this sequence to capture all events:

```typescript
// 1. FIRST: Register listeners (before init)
tracelog.on('event', eventHandler);

// 2. SECOND: Identify the user (optional — can be called before or after init)
tracelog.identify('cust_123', { name: 'Maria Garcia', plan: 'pro' });

// 3. THIRD: Initialize (starts tracking immediately, returns sessionId)
const { sessionId } = await tracelog.init({
  integrations: { tracelog: { projectId: 'proj-123' } },
});

// 4. FOURTH: Custom events (after init)
tracelog.event('button_click', { id: 'signup-cta' });
console.log('Tracked in session:', sessionId);
```

**Why**: `SESSION_START` and `PAGE_VIEW` fire during `App.init()`. Listeners registered after init miss those initial events. Identity registered before init is buffered and applied automatically when `init()` runs.

### 2. Integration Modes

Only two modes are supported in v3:

```typescript
// Standalone (default) — NO network requests
const { sessionId } = await tracelog.init();
tracelog.on('event', (e) => console.log(e)); // Local consumption only

// TraceLog SaaS
await tracelog.init({
  integrations: { tracelog: { projectId: 'proj-123' } },
});
```

**Transport default (zero-DNS).** The SaaS collect endpoint defaults to the hosted host `https://ingest.tracelog.io/p/{projectId}/collect` (a CORS endpoint), so the snippet captures events the moment it is installed — on any host, including `localhost`, with no CNAME/DNS setup. This is the fix for the silent zero-event activation bug: an unconfigured first-party subdomain no longer means zero events.

**Accuracy mode (opt-in).** `integrations.tracelog.firstParty: true` switches transport to the merchant's own first-party subdomain (`https://{projectId}.{rootDomain}/collect`, CNAME → middleware). Only this mode derives the endpoint from the page domain, so only this mode rejects `init()` on `localhost` / raw IP. The URL is chosen once at init (`getCollectApiUrls`) — there is no runtime cross-host fallback; each `SenderManager` owns a single immutable `apiUrl`. For local development, omit `integrations.tracelog` (standalone) or leave `firstParty` off (hosted default).

**Removed in v3:** `integrations.custom`, transformers (`setTransformer` / `removeTransformer`), custom headers (`setCustomHeaders` / `removeCustomHeaders`), multi-integration, `flushImmediately()` / `flushImmediatelySync()` public surface, `setQaMode()` programmatic API, `updateGlobalMetadata()` / `mergeGlobalMetadata()`, viewport handler / events / config, `LONG_TASK` web vital, `relativeX/Y` and extended attribute fields on click data, `is_primary` / `velocity` / `max_depth_reached` on scroll data, `pathname` / `search` / `hash` on page-view data (full URL still on event envelope), `StorageManager.clear()` / `isAvailable()` / `hasQuotaError()`, `TimeManager.getClockSkew()` / `getBootInfo()`.

### 3. Event Queue & Sending

**Core principle**: optimistic removal with localStorage persistence on failure.

- **Batching**: every 10s OR 50-event threshold
- **Transport**: `fetch()` (async) or `navigator.sendBeacon()` (page unload + `critical: true` events; persists on failure)
- **Retries**: up to 2 attempts for transient errors (5xx, timeout) — exponential backoff with jitter (200–300 ms, 400–500 ms)
- **Persistence**: failed events saved to `tracelog_queue:{userId}` in localStorage with `_metadata.idempotency_token` for backend dedup
- **Recovery**: auto-recovered on next `init()` and on `pageshow.persisted === true` (bfcache restore)
- **Cross-tab protection**: 1-second window prevents two tabs from re-sending the same persisted batch
- **429 rate limit**: arms a 60s cooldown mirrored to localStorage and shared across tabs on the same origin
- **Circuit breaker**: after `MAX_CONSECUTIVE_NETWORK_FAILURES` consecutive DNS / connection-refused failures, opens until `CIRCUIT_BREAKER_COOLDOWN_MS` elapses; allows one probe (half-open) before fully closing
- **Health beacon (403 / 404)**: when the domain gate rejects ingest with 403, or the project identifier doesn't resolve (404), emits a diagnostic beacon to the sibling `/client-error` path (`reason: 'events_blocked'` / `'unknown_project'`, never analytics data) so the dashboard can flag "snippet alive, events blocked" or "snippet alive, project id unknown". Throttled to once per 10 min per reason via localStorage (`tlog:beacon:{projectId}:{reason}`, MPA- and multi-tab-safe). Opt out via `integrations.tracelog.healthBeacon: false`. The two reasons are gated differently on purpose: a 403 emits whoever answered (a WAF/CDN blocking ingest is still a real block), while `unknown_project` requires the 404 body to carry the middleware's `UNKNOWN_PROJECT` code **inside its error envelope** (`{ statusCode, error }`, with `statusCode` echoing the HTTP status — an uncorroborated `{ code }` from any responder is not read at all) — in accuracy mode the collect URL is the merchant's own CNAME'd subdomain, so a parked page or default CDN backend answering 404 must never be reported as a bad project id. Server side, an `unknown_project` beacon is attributed **by origin**, never by the identifier it carries (that identifier is by definition the one that doesn't resolve) — see `ProjectsService.recordClientError` in tracelog-api.
- **v2→v3 migration**: `SenderManager` constructor migrates legacy `:saas` queue keys into the new unscoped key on first run, then drops the legacy `:custom` keys (their events were destined for a different backend and must not be forwarded)
- **Auto-flush triggers** (in addition to the 10s / 50-event interval):
  - SPA navigation (`pushState` / `replaceState` / `popstate` / `hashchange`) — opt-in via `flushOnSpaNavigation: true` (default `false`)
  - Document hidden (`visibilitychange` to hidden) — uses `sendBeacon` (sync) so the OS can't abort it mid-suspension. Opt out via `flushOnPageHidden: false`. Covers mobile Safari where `pagehide` / `beforeunload` may not fire
  - `pagehide` / `beforeunload` — always on, uses `sendBeacon`
  - `tracelog.event(name, meta, { critical: true })` — drains the queue via `sendBeacon` synchronously right after the event is tracked. If an async send is in flight when the critical event arrives, the sync flush is deferred via `pendingSyncFlush` and re-runs in the async send's `finally`. Backend MUST deduplicate by `event.id`.

| Error type                        | Retries                                                              | Persistence       |
|-----------------------------------|----------------------------------------------------------------------|-------------------|
| 2xx success                       | None                                                                 | Cleared           |
| 4xx (except 408, 429)             | ❌ None                                                              | ❌ Discarded       |
| 408 Timeout                       | ✅ Up to 2                                                           | ✅ After exhaustion |
| Request timeout (AbortController) | ✅ Up to 2                                                           | ✅ After exhaustion |
| 429 Rate limit                    | ❌ None (60s cooldown, mirrored to localStorage, shared across tabs) | ✅ Immediate       |
| 5xx, network errors               | ✅ Up to 2                                                           | ✅ After exhaustion |
| `sendBeacon` failure              | ❌ None                                                              | ✅ Immediate       |

All persisted batches carry `_metadata.idempotency_token` (deterministic FNV-1a hash of sorted event IDs, salted by `user_id` and `session_id`) for backend deduplication on recovery.

### 4. Session Management

- Cross-tab sync via BroadcastChannel
- Primary tab creates session
- Other tabs receive session ID via broadcast
- Recovery from localStorage on refresh
- No duplicate `SESSION_START` on recovery
- Default timeout: 15 minutes (configurable)
- **Session Mirror**: Session data automatically mirrored to `sessionStorage` on every write. When `localStorage` is empty (e.g., after external redirect), recovery falls back to `sessionStorage` transparently. Zero API surface, zero developer action needed.

---

## Testing Strategy

**CRITICAL**: Only client library requires tests. No tests for middleware/API.

### Test Types

| Type | Tool | Location | Coverage Target |
|------|------|----------|-----------------|
| Unit | Vitest | `tests/unit/` | 90%+ for core logic |
| Integration | Vitest | `tests/integration/` | 75%+ for critical flows |
| E2E | Playwright | `tests/e2e/` | 100% critical user paths |

### TestBridge Architecture

**Key Principle**: Library code should NOT adapt to tests. TestBridge adapts tests to library.

`TestBridge` (`src/test-bridge.ts`) is the adapter layer:
- Only available in `NODE_ENV=development`
- Auto-injected as `window.__traceLogBridge` for E2E tests
- Exposes managers, handlers, state for test validation
- Production code (App, managers, handlers) NEVER modified for tests

**When to use**:
- ❌ Unit tests (isolated components) → Test directly with mocks
- ✅ Unit tests (App initialization) → Need full sequence
- ✅ Integration tests → Need real manager interactions
- ✅ E2E tests → Only way to access internals

### Integration Test Pattern (ALWAYS use bridge.helper.ts)

```typescript
import { initTestBridge, destroyTestBridge, getManagers } from '../helpers/bridge.helper';
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/setup.helper';

describe('Event Pipeline', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();
    bridge = await initTestBridge({ sessionTimeout: 5000 });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should track events', () => {
    bridge.event('test', { key: 'value' });
    const events = bridge.getQueueEvents();
    expect(events).toHaveLength(1);
    expect(events[0].custom_event?.name).toBe('test');
  });
});
```

### E2E Test Pattern (CSP-Safe)

```typescript
import { test, expect } from '@playwright/test';

test('should track clicks', async ({ page }) => {
  await page.goto('/?auto-init=false'); // Prevent auto-init by script.js

  const result = await page.evaluate(async () => {
    // Wait for bridge (CSP-safe internal polling)
    let retries = 0;
    while (!window.__traceLogBridge && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    const bridge = window.__traceLogBridge!;
    bridge.destroy(true); // CRITICAL: Destroy existing instance
    await bridge.init();

    const events: any[] = [];
    bridge.on('event', (event) => events.push(event));

    document.querySelector('#test-button')?.click();
    await new Promise(resolve => setTimeout(resolve, 200));

    return events;
  });

  const clickEvent = result.find(e => e.type === 'click');
  expect(clickEvent).toBeDefined();
});
```

**CRITICAL E2E Rules**:
- ❌ NEVER use `page.waitForFunction()` (CSP-blocked)
- ✅ Use `page.evaluate()` with internal waits
- ✅ Always call `destroy(true)` before `init()` (test isolation)
- ✅ Use `?auto-init=false` in `beforeEach`
- ✅ Wait minimum 200ms after action

### Network Simulation (SpecialApiUrl)

No real server needed for integration tests:

```typescript
import { createConfigWithSuccessSimulation, createConfigWithFailureSimulation } from '../helpers/mocks.helper';

// Success simulation (localhost:8080)
const successConfig = createConfigWithSuccessSimulation();
const bridge = await initTestBridge(successConfig);

// Failure simulation (localhost:9999) - triggers retry + persistence
const failConfig = createConfigWithFailureSimulation();
const bridge = await initTestBridge(failConfig);
```

### Test Acceptance Criteria

**ALL tests must meet these before marking complete**:

```bash
npm run fix          # Auto-fix lint/format (REQUIRED)
npm run type-check   # 0 errors (REQUIRED)
npm test             # 100% pass rate (REQUIRED)
```

**Checklist**:
- [ ] 100% pass rate
- [ ] `npm run fix` executed
- [ ] `npm run type-check` shows 0 errors
- [ ] Coverage targets met (90%+ core, 70%+ overall)
- [ ] No flaky tests (3+ consistent runs)
- [ ] Fast execution (Unit <100ms, Integration <1s, E2E <10s)

---

## Critical Don'ts

### Code
- ❌ DON'T add runtime dependencies (only `web-vitals` allowed)
- ❌ DON'T mutate `globalState` directly (use `StateManager.set()`)
- ❌ DON'T instantiate multiple App instances
- ❌ DON'T call `init()` in SSR (typeof window check required)
- ❌ DON'T change optimistic removal to pessimistic (causes duplicates and infinite queue buildup)
- ❌ DON'T commit without passing `npm run check`

### Testing
- ❌ DON'T use `vi.runAllTimersAsync()` (causes infinite loops with setInterval)
- ✅ USE `vi.advanceTimersByTimeAsync()` + `vi.runOnlyPendingTimersAsync()`
- ❌ DON'T use `page.waitForFunction()` in E2E (CSP-blocked)
- ❌ DON'T use uppercase event types in filters (`'click'` not `'CLICK'`)
- ❌ DON'T pass an `integrations.tracelog.projectId` in standalone tests (omitting `integrations` is the standalone signal)
- ❌ DON'T access `window.__traceLogBridge` directly in integration tests (use `bridge.helper.ts`)
- ❌ DON'T forget `destroy(true)` before `init()` in E2E tests

### Performance
- ❌ DON'T cause memory leaks (always call cleanup in handlers)
- ❌ DON'T block main thread (use passive listeners)
- ❌ DON'T send high-frequency events without throttling

### Logging
- ❌ DON'T use `warn` or `error` for internal operations (use `debug`)
- ❌ DON'T add logs visible in production (users of websites should NEVER see logs)
- ✅ USE `debug` for graceful degradations and internal operations
- ✅ USE `warn` only for issues the integrating developer can fix (visible in dev only)
- ✅ USE `visibility: 'qa'` only for QA mode messages (custom event verification)
- ✅ USE `visibility: 'critical'` only for errors that MUST reach monitoring (Sentry)

---

## Logging Policy

### Visibility Levels
```typescript
type LogVisibility = 'critical' | 'qa';

// Examples:
log('error', 'Critical failure', { visibility: 'critical' }); // Always visible
log('info', 'Custom event tracked', { visibility: 'qa' });    // QA mode only
log('warn', 'Config issue');                                   // Development only
```

| Visibility | Production | Development | Use Case |
|------------|------------|-------------|----------|
| `'critical'` | ✅ Always | ✅ Always | Sentry/monitoring errors |
| `'qa'` | QA mode only | ✅ Always | Custom event verification |
| `undefined` | ❌ Never | ✅ Always | Internal operations |

### Production Behavior
**ZERO logs by default** - Only `visibility: 'critical'` logs are shown.

Users of websites where TraceLog is installed should **NEVER** see console logs unless they activate QA mode.

### Development Behavior
All logs visible for debugging:
- `debug`: Internal operations, graceful degradations, cache operations
- `warn`: Issues the integrating developer can fix (config errors, limits)
- `error`: Critical failures requiring attention

### QA Mode (Production Debugging)
Activate with `?tlog_mode=qa` (persists in `sessionStorage`; deactivate with `?tlog_mode=qa_off`) to see logs marked with `visibility: 'qa'`.

### Golden Rule
**Production = Silent. Development = Verbose.**

If the user cannot take action to fix the issue, use `debug` not `warn`.

---

## Build System

### Tools
- **tsup**: ESM/CJS bundling (esbuild-powered)
- **Vite**: Browser bundles (IIFE + ESM for CDN)
- **TypeScript**: Strict mode enforced (15+ flags)

### Output
```
dist/
├── public-api.js/.cjs       # ESM/CJS bundles
├── public-api.d.ts/.d.mts   # TypeScript declarations
└── browser/
    ├── tracelog.js          # IIFE (window.tracelog)
    └── tracelog.esm.js      # ES Module
```

### Build Process
```bash
npm run build          # tsup bundles ESM + CJS
npm run build:browser  # Vite bundles for CDN
npm run build:all      # Complete build
```

---

## Important Constants

### Config (`src/constants/config.constants.ts`)
- `DEFAULT_SESSION_TIMEOUT_MS`: 900000 (15 min)
- `MAX_EVENTS_QUEUE_LENGTH`: 100
- `SEND_EVENTS_INTERVAL_MS`: 10000 (10s)
- `SCROLL_DEBOUNCE_TIME_MS`: 250ms
- `MAX_SCROLL_EVENTS_PER_SESSION`: 120

### Version (`src/constants/version.constants.ts`)
- `LIB_VERSION`: Sent to backend in `_metadata.client_version`
- Must be manually updated with each release (synced via `scripts/release.js`)

### Event ID (`src/utils/data/uuid.utils.ts`)
- Format: `{timestamp}-{sequence}-{random}` (e.g., `1704067200000-001-a3f9c2`)
- Timestamp: Millisecond precision (13 digits)
- Sequence: Auto-incrementing counter (0-999) for same-millisecond bursts
- Random: Cryptographically secure (3 bytes = 6 hex chars)
- Guarantees: Zero collisions in bursts (1000 events/ms capacity)

### Deduplication
- LRU cache: 1000 fingerprints
- Click precision: 10px coordinate rounding
- Time threshold: 500ms
- Auto-prune: >5 seconds old

---

## Code Patterns

### Adding a Handler

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

3. Cleanup in `App.destroy()`:
```typescript
this.handlers.new?.stopTracking();
```

### Lifecycle Pattern

All handlers implement:
- `startTracking()` - Attach listeners
- `stopTracking()` - Remove listeners, cleanup timers
- Optional `destroy()` - Deep cleanup for managers

---

## Comment Policy

### ✅ Use Comments For
- JSDoc for public APIs (`@param`, `@returns`, `@example`, `@throws`)
- Section organization (`//  ===`) in constants files
- Complex logic explanations (clarify non-obvious algorithms)
- Design rationale (explain "why", not "what")
- Edge cases and special behaviors
- Magic values (timeouts, limits with justification)

### ❌ DON'T Use Comments For
- Repeating code (comments that rephrase what code does)
- Obvious statements (duplicate function/variable names)
- Check pattern (`// Check if X` followed by `if (X)`)
- Silent pattern (`// Silent X` without context)
- Type descriptions (already evident from TypeScript)

---

## Browser Support

- Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- Graceful degradation (IntersectionObserver, BroadcastChannel)
- SSR-safe (all methods no-op in Node.js)

---

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | Quick start, API reference |
| `SECURITY.md` | Privacy, PII sanitization |
| `CHANGELOG.md` | Release history |
| `src/handlers/README.md` | Handler implementations |
| `src/managers/README.md` | Manager details |
| `tests/TESTING_FUNDAMENTALS.md` | Complete testing guide |
| `tests/TESTING_TROUBLESHOOTING.md` | Common test failures & diagnostics |

---

## Key Files

- `src/api.ts` - Public API entry (`init`, `event`, `destroy`, `on`, `off`)
- `src/app.ts` - Main orchestrator
- `src/public-api.ts` - Export aggregator (bundled output)
- `tsup.config.ts` - tsup bundler config (ESM/CJS)
- `vite.config.mjs` - Browser build config
- `tsconfig.json` - Base TypeScript config (strict mode)

---

## Environment Variables

- `NODE_ENV=development` - Enables TestBridge, dev sourcemaps
- `NODE_ENV=production` - Minifies, excludes TestBridge, hidden sourcemaps
