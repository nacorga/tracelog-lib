# TraceLog Library - Copilot Review Instructions

## Code Review Priorities

### 1. Memory Safety (CRITICAL)
- **Event Listeners**: Verify all event listeners have matching `removeEventListener()` calls in `stopTracking()`
- **Timer Cleanup**: Check for timer/interval cleanup in `cleanup()` methods
- **Circular References**: Ensure no circular references between handlers and managers
- **Memory Leaks**: Flag missing cleanup patterns that could cause memory leaks

### 2. TypeScript Strict Mode
- **Zero Type Errors**: No TypeScript errors accepted (strict mode enforced)
- **Type Safety**: No `any` types without explicit justification
- **Type Guards**: Proper type guards for runtime validations
- **Null Safety**: Proper handling of nullable types

### 3. Client-Only Architecture
- **Autonomous Operation**: Library must work without backend dependencies
- **Optional Integrations**: Backend integrations (tracelog, custom) are optional
- **No Required Network**: No required network calls for core functionality
- **Event Emission**: Events always emitted via `on('event')` regardless of backend config

### 4. Performance
- **Passive Listeners**: Event listeners use `{ passive: true }` for scroll/touch events
- **Non-Blocking**: No synchronous operations blocking main thread
- **Minimal Impact**: Minimize performance impact on host application
- **Debouncing**: Proper debouncing for high-frequency events

### 5. Testing Requirements
- **Coverage Target**: 90%+ line coverage for core logic (handlers, managers, utils)
- **E2E Testing**: E2E tests use `window.__traceLogBridge` for internal state access
- **CSP Compliance**: Use `page.evaluate()` NOT `page.waitForFunction()` in E2E tests
- **Test Types**: Unit tests (Vitest), Integration tests (Vitest), E2E tests (Playwright)

### 6. Architecture Patterns
- **StateManager Pattern**: All managers extend `StateManager` for global state access via `this.state`
- **Handler Pattern**: Handlers implement `startTracking()` and `stopTracking()`
- **No Circular Deps**: Handlers import `types/` ONLY, never `managers/`
- **Queue Structure**: `sessionId` goes in `queue.session_id`, NOT in individual events

### 7. SSR/SSG Safety (CRITICAL)
- **SSR Compatibility**: Library works in SSR frameworks (Next.js, Nuxt, Angular Universal, SvelteKit)
- **Window/Document Checks**: ALL public API methods check `typeof window === 'undefined'`
- **Silent No-Op**: Methods return early (silently) when not in browser environment
- **No SSR Errors**: Never throw errors or access browser APIs in Node.js

### 8. Security & Privacy (CRITICAL)
- **PII Protection**: Auto-redact emails, phones, credit cards, API keys in text/errors
- **Input Protection**: NEVER capture values from `<input>`, `<textarea>`, `<select>`
- **URL Filtering**: Remove sensitive query params (token, auth, key, password, etc.)
- **XSS Protection**: Sanitize all user-provided strings against XSS patterns
- **Element Exclusion**: Respect `data-tlog-ignore` attribute on sensitive elements

### 9. Acceptance Criteria
- **Lint & Format**: Must pass `npm run check` (ESLint + Prettier)
- **Build Success**: Zero build errors (`npm run build:all` for ESM + CJS + Browser)
- **Type Check**: Zero type errors (`npm run type-check`)
- **Tests Pass**: All tests passing (`npm run test`)
- **Coverage**: 90%+ coverage for core logic (`npm run test:coverage`)

## Common Pitfalls to Flag

### Critical Issues (Must Block PR)
- ❌ Missing `removeEventListener()` in `stopTracking()` → Memory leak
- ❌ Importing `managers/` from handlers → Circular dependency
- ❌ Direct state mutation (e.g., `this.state.foo = bar`) → Use setters only
- ❌ `page.waitForFunction()` in E2E tests → CSP violation
- ❌ `sessionId` in individual events → Wrong queue structure (should be in `queue.session_id`)
- ❌ New runtime dependencies → Only `web-vitals` allowed
- ❌ Missing SSR safety checks (`typeof window === 'undefined'`) → Crashes in SSR
- ❌ Missing XSS sanitization on user strings → Security vulnerability
- ❌ Missing PII redaction in error messages → Privacy violation
- ❌ Side effects in utility functions → Wrong pattern
- ❌ Throwing errors from integrations → Breaks core functionality

### High Priority Issues
- ⚠️ Missing `{ passive: true }` in scroll/touch listeners → Performance impact
- ⚠️ Synchronous heavy operations → Blocks main thread
- ⚠️ Missing error handling → Potential crashes
- ⚠️ Missing tests for new handlers/managers → Coverage gap
- ⚠️ Using `any` type without justification → Type safety issue
- ⚠️ Boolean-only validation (no error message) → Hard to debug
- ⚠️ Missing initialization checks in integrations → Sends data before ready
- ⚠️ No duplicate script injection prevention → Multiple instances
- ⚠️ Missing listener buffering before init → Lost listeners

### Medium Priority Issues
- 💡 Missing JSDoc comments on public APIs → Documentation gap
- 💡 Complex logic without explanatory comments → Maintainability concern
- 💡 Magic numbers without constants → Readability issue
- 💡 Duplicate code → Refactoring opportunity
- 💡 Redundant comments that repeat code → Remove for clarity
- 💡 Obvious comments without value → Replace with self-documenting code

## Code Style

### Code Comments Policy

**✅ Use comments for:**
- JSDoc on public APIs with `@param`, `@returns`, `@example`, `@throws`
- Complex/non-obvious logic explanations
- Design rationale ("why" decisions, not "what" code does)
- Edge cases and special behavior documentation
- Magic values justification (timeouts, limits, thresholds)
- Important patterns context (BroadcastChannel, multi-tab sync)

**❌ NEVER use comments for:**
- Repeating what code does (e.g., `// Set sessionId`)
- Obvious statements that duplicate function/variable names
- Pattern `// Check if X` followed by `if (X)`
- Pattern `// Silent X` without additional context
- Redundant descriptions before self-explanatory code
- Type descriptions already evident from TypeScript

**Examples:**
```typescript
// ❌ BAD: Redundant
// Check if user exists
if (user) { }

// ✅ GOOD: Explains edge case
// Skip validation during recovery to prevent infinite loops
// when multiple tabs fail simultaneously (1s window protection)
if (isRecovering) { }
```

### Dependencies
- **Runtime**: Single runtime dependency allowed: `web-vitals` only
- **Build**: ESM/CJS dual support required (both must build successfully)
- **TypeScript**: TypeScript 5.7 strict mode enforced
- **Browser Support**: Modern browsers with graceful degradation

### Naming Conventions
- **Handlers**: `*.handler.ts` - Event capture implementations
- **Managers**: `*.manager.ts` - Core business logic
- **Utils**: `*.utils.ts` - Pure functions (no side effects)
- **Types**: `*.types.ts` - TypeScript type definitions
- **Tests**: `*.test.ts` (unit/integration), `*.spec.ts` (E2E)

### File Structure
```
src/
├── handlers/              # Event capture (click, scroll, page-view, etc.)
├── managers/              # Core logic (state, event, session, storage, sender, user)
├── integrations/          # Third-party (Google Analytics)
├── listeners/             # Low-level event listeners
├── utils/                 # Utilities (browser, data, network, security, validations)
├── types/                 # TypeScript definitions
├── constants/             # Configuration constants
└── public-api.ts          # Library entry point
```

## Event Types

Validate that events conform to these types:
- `PAGE_VIEW` - Navigation tracking
- `CLICK` - User interactions
- `SCROLL` - Scroll depth/engagement
- `SESSION_START/END` - Session boundaries
- `CUSTOM` - Business-specific events
- `WEB_VITALS` - Performance metrics (LCP, CLS, INP, FCP, TTFB)
- `ERROR` - JavaScript errors
- `VIEWPORT_VISIBLE` - Element visibility tracking

## Configuration Options

All configuration options are optional. Review for:
- **sessionTimeout**: Session duration (default: 15min, range: 1min-24hr)
- **globalMetadata**: Data added to all events
- **primaryScrollSelector**: Custom scroll container (default: window)
- **sensitiveQueryParams**: URL parameter filtering (extends defaults)
- **samplingRate**: Client-side event sampling (0-1, default: 1.0)
- **errorSampling**: Client-side error sampling (0-1, default: 1.0)
- **pageViewThrottleMs**: Page view throttle (default: 1000ms)
- **clickThrottleMs**: Click throttle (default: 300ms)
- **maxSameEventPerMinute**: Rate limit per event type (default: 100)
- **allowHttp**: Enable HTTP for testing (should only be `true` in dev/test)
- **viewport**: Element visibility tracking config (optional)
  - **elements**: Array of selectors with optional id/name
  - **threshold**: Visibility threshold (0-1, default: 0.5)
  - **minDwellTime**: Min time visible before tracking (default: 2000ms)
  - **cooldownPeriod**: Time before re-tracking (default: 30000ms)
  - **maxTrackedElements**: Max elements to track (default: 50)
- **integrations**: Optional backend integrations (tracelog, custom)
  - **tracelog**: `{ projectId: string }` - TraceLog SaaS integration
  - **custom**: `{ collectApiUrl: string; allowHttp?: boolean; headers?: Record<string, string>; fetchCredentials?: RequestCredentials }` - Custom backend

## Security & Privacy

- **Input Sanitization**: Sanitize all metadata and custom event data
- **URL Filtering**: Respect sensitive query parameter configuration
- **CSP Compliance**: Ensure Content Security Policy compatibility
- **Data Minimization**: Only collect necessary data
- **IP Masking**: Never log full IP addresses in middleware/API

## Documentation Updates

When reviewing code changes, verify:
- ✅ Relevant `*.md` files updated (except CHANGELOG.md - auto-generated)
- ✅ JSDoc comments added for new public APIs
- ✅ README.md updated for new features
- ✅ Migration guides included for breaking changes

## Development Workflow

### Pre-Commit Checklist (MUST Run)
Before EVERY commit, the following MUST pass (use `/precommit` to validate):
- ✅ Zero build errors (`npm run build:all`)
- ✅ Zero type errors (`npm run type-check`)
- ✅ Zero lint errors (`npm run lint`)
- ✅ 100% test pass rate (`npm run test`)
- ✅ 90%+ core logic coverage (`npm run test:coverage`)

### Quick Commands Reference

Suggest running these commands when relevant:
- **`/precommit`** - Full acceptance criteria validation (REQUIRED before commit)
- **`/new-feature [desc]`** - Interactive feature development (40-50% faster)
- **`/compare-branch [branch]`** - Pre-merge audit (REQUIRED before merging)
- **`/coverage`** - Test coverage analysis
- **`/security-audit`** - GDPR/privacy compliance scan
- **`/perf`** - Bundle size & performance check
- **`/fix`** - Auto-fix lint/format issues
- `npm run check` - Lint + format check
- `npm run test` - Run all tests
- `npm run build:all` - Build all bundles

### Automation Pipeline

This project uses specialized agents (`.claude/` folder):
- **feature-orchestrator** (`/new-feature`) - USE FOR ALL NEW FEATURES
- **clean-code-architect** - General improvements, refactoring
- **test-guardian** (`/coverage`) - Test coverage enforcement
- **type-safety-enforcer** - TypeScript strict mode validation
- **memory-leak-detector** - Event listener cleanup validation
- **security-privacy-advisor** (`/security-audit`) - GDPR/PII compliance

### Development Hooks (Auto-Run)

These hooks run automatically:
1. **PreToolUse (Edit/Write)** - Runs `npm run type-check` → BLOCKS if errors
2. **PostToolUse (Edit)** - Runs related tests → Immediate feedback
3. **SessionStart** - Shows git status, health check
4. **UserPromptSubmit** - Warns about unnecessary file creation

## Path-Scoped Instructions

For more detailed, context-specific guidance, see:
- **Handlers**: [.github/instructions/handlers.instructions.md](.github/instructions/handlers.instructions.md) - Event capture patterns, memory management
- **Managers**: [.github/instructions/managers.instructions.md](.github/instructions/managers.instructions.md) - State management, business logic
- **Utils**: [.github/instructions/utils.instructions.md](.github/instructions/utils.instructions.md) - Security, validation, pure functions
- **Integrations**: [.github/instructions/integrations.instructions.md](.github/instructions/integrations.instructions.md) - Third-party service integration
- **API**: [.github/instructions/api.instructions.md](.github/instructions/api.instructions.md) - Public API, SSR safety, state management

## Common Mistakes to Flag

### Memory Leaks
1. **Missing `removeEventListener()`** in `stopTracking()` → Use `memory-leak-detector` agent
2. **Missing `clearTimeout()`/`clearInterval()`** in cleanup methods
3. **Circular references** between handlers and managers

### Circular Dependencies
1. **Handlers importing `managers/`** → Import `types/` only, inject managers via constructor
2. **Managers importing from each other** without proper abstraction

### State Management
1. **Direct state mutation** (`this.state.foo = bar`) → Use setters only
2. **Mutating nested objects** (`this.state.config.samplingRate = 0.5`) → Create new object

### CSP Violations
1. **`page.waitForFunction()`** in E2E tests → Use `page.evaluate()` instead
2. **Inline scripts** without nonce → Not applicable for library, but check test pages

### Queue Structure
1. **`sessionId` in individual events** → Goes in `queue.session_id`, not per-event
2. **Missing event validation** before adding to queue

### SSR Issues
1. **Missing `typeof window === 'undefined'`** checks in public API → Crashes in Node.js
2. **Accessing browser APIs** without checks → ReferenceError in SSR

### Security Issues
1. **Missing XSS sanitization** on user strings → Security vulnerability
2. **Missing PII redaction** in error messages → Privacy violation
3. **Not respecting `data-tlog-ignore`** attribute → Tracks sensitive elements
4. **Capturing input values** from form fields → NEVER allowed

### Integration Issues
1. **Sending data before initialization** check → Crashes when third-party not ready
2. **Missing duplicate script prevention** → Multiple instances loaded
3. **Throwing errors** from integrations → Should fail silently

## Review Response Style

- **Be Specific**: Reference file paths and line numbers
- **Explain Impact**: Describe why an issue matters (e.g., "This causes a memory leak because...")
- **Suggest Fixes**: Provide actionable suggestions with code examples
- **Prioritize**: Use severity labels (BLOCKING, HIGH, MEDIUM) for issue triage
- **Be Constructive**: Focus on code improvement, not personal criticism
- **Reference Docs**: Link to relevant instruction files for deeper context
- **Suggest Commands**: Recommend `/precommit`, `/coverage`, `/security-audit` when relevant
- **Flag Patterns**: Call out violations of architecture patterns (StateManager, Handler, etc.)
