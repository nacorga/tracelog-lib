# TraceLog Client Library (@tracelog/lib)

> Lightweight web analytics library for tracking user behavior. Works standalone or with optional backend integrations.

---

# ⚠️ Critical Instructions

**READ THIS FIRST** - These override default behavior:

1. **NEVER create files** unless absolutely necessary for the task
2. **ALWAYS prefer editing** existing files to creating new ones
3. **NEVER proactively create documentation** (*.md) files unless explicitly requested
4. **ALWAYS update documentation** when making code changes
5. **Use `/new-feature`** for ALL new features - it's 40-50% faster and more thorough
6. **Run `/precommit`** before every commit - no exceptions
7. **Run `/compare-branch`** before merging - prevents issues from reaching main

---

# Development

## Automation Pipeline

**IMPORTANT**: This project uses a comprehensive Claude Code automation pipeline (`.claude/` folder) with:
- **6 Custom Agents** - Specialized AI assistants for different tasks
- **7 Slash Commands** - Quick commands for common operations
- **4 Development Hooks** - Automated validations during development

📖 **Full Pipeline Documentation**: [.claude/README.md](./.claude/README.md)

## Agent Usage Policy

### When to Use Which Agent

**IMPORTANT**: Always use the appropriate specialized agent for the task:

1. **`feature-orchestrator`** ⭐ PROACTIVE USE REQUIRED
   - **When**: Starting ANY new feature (handlers, managers, integrations)
   - **Command**: `/new-feature [description]`
   - **What it does**: Interactive requirements gathering → architecture planning → automated implementation → quality validation
   - **Time savings**: 40-50% faster than manual workflow

2. **`clean-code-architect`**
   - **When**: General code improvements, refactoring, bug fixes
   - **Use for**: Code that doesn't require specialized validation

3. **`test-guardian`**
   - **When**: After adding features or modifying core code
   - **Command**: `/coverage`
   - **Enforces**: 90%+ coverage for handlers/managers/utils

4. **`type-safety-enforcer`**
   - **When**: Before committing code
   - **Command**: Part of `/precommit`
   - **Enforces**: Zero TypeScript errors with strict mode

5. **`memory-leak-detector`**
   - **When**: Creating/modifying event handlers or managers
   - **Checks**: Event listener cleanup, timer management, stopTracking() implementations

6. **`security-privacy-advisor`**
   - **When**: Before production release
   - **Command**: `/security-audit`
   - **Validates**: GDPR compliance, PII protection, consent management

**Note**: Slash commands automatically invoke their specialized agents

## Technical Requirements

**MUST** follow these requirements:
- TypeScript 5.7 strict mode enforced - **ZERO type errors accepted**
- Single runtime dependency: `web-vitals` - No exceptions
- Dual ESM/CJS support required - Both must build successfully
- **Documentation Updates**: When making code changes, **YOU MUST** update relevant *.md files to keep them synchronized
- **Documentation Style**: Describe CURRENT STATE only. **NEVER** reference versions, improvements, or use phrases like "New in vX.X.X", "Optimized", "75% reduction". Documentation should be timeless and factual.

## Development Hooks (Automated)

**IMPORTANT**: Hooks run automatically during development. Understand what they do:

1. **PreToolUse (Edit/Write)** - Runs `npm run type-check` before any file edit
   - **Blocks edits** if type errors exist
   - Ensures clean baseline before changes

2. **PostToolUse (Edit)** - Runs related tests after file edits
   - Automatic test execution based on modified module
   - Immediate feedback on changes

3. **SessionStart** - Runs on Claude Code session start
   - Displays git status, health check, available commands
   - Sets development context

4. **UserPromptSubmit** - Validates prompts before execution
   - Warns about unnecessary file creation
   - Reminds about CLAUDE.md guidelines

📖 **Hook Details**: [.claude/README.md#-development-hooks](./.claude/README.md#-development-hooks)

# Acceptance Criteria

**IMPORTANT**: All changes **MUST** meet these requirements before commit:

- ✅ **Zero build errors** → Verify: `npm run build:all` - **BLOCKS COMMIT**
- ✅ **Zero type errors** → Verify: `npm run type-check` - **BLOCKS COMMIT**
- ✅ **Zero lint errors** → Verify: `npm run lint` (warnings acceptable) - **BLOCKS COMMIT**
- ✅ **100% test pass rate** → Verify: `npm run test` - **BLOCKS COMMIT**
- ✅ **90%+ core logic coverage** → Verify: `npm run test:coverage` - **BLOCKS COMMIT**

💡 **Quick validation**: Run `/precommit` (validates all criteria automatically)

📖 **Full validation details**: [.claude/README.md#-acceptance-criteria](./.claude/README.md#-acceptance-criteria)

# Commands Reference

## 🎯 Slash Commands (Custom)

**IMPORTANT**: Use these slash commands for automated workflows. Full details in [.claude/README.md](./.claude/README.md)

### Primary Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/new-feature [desc]` | ⭐ **Interactive feature development** | Starting ANY new feature |
| `/precommit` | Full acceptance criteria validation | Before every commit |
| `/compare-branch [branch]` | Pre-merge audit & quality check | Before merging branches |
| `/coverage` | Test coverage analysis | After code changes |
| `/security-audit` | GDPR/privacy compliance scan | Before production |
| `/perf` | Bundle size & performance check | After dependencies/features |
| `/fix` | Auto-fix lint/format issues | When lint errors exist |

**Example Usage**:
```bash
# Start new feature (recommended workflow)
/new-feature viewport visibility tracking

# Pre-commit validation
/precommit

# Before merging to main
/compare-branch main

# Check test coverage
/coverage
```

📖 **Command Details**: [.claude/README.md#-custom-slash-commands](./.claude/README.md#-custom-slash-commands)

## 🔨 NPM Scripts

### Build & Quality
```bash
npm run build:all          # Build ESM + CJS + Browser bundles (production)
npm run build:browser:dev  # Build browser bundle (development, for testing)
npm run type-check         # TypeScript type checking (no emit)
npm run type-check:watch   # Watch mode for type checking
npm run check              # Run lint + format check (fast validation)
npm run fix                # Auto-fix lint/format issues
```

### Testing
```bash
# Unit & Integration Tests (Vitest)
npm run test:unit          # Run unit tests
npm run test:integration   # Run integration tests
npm run test:coverage      # Generate coverage report (90%+ target)

# E2E Tests (Playwright)
npm run test:e2e           # Run E2E tests (auto-starts test server)

# Run All
npm run test               # Run all tests (unit + integration + E2E)
```

### Local Development
```bash
npm run serve:test         # Start test server on localhost:3000
npm run docs:dev           # Build + serve demo page (auto-opens browser)
npm run docs:gh-pages      # Build production demo for GitHub Pages
```

### Release Management
```bash
npm run release            # Interactive release (prompts for version)
npm run release:patch      # Release patch version (0.11.0 → 0.11.1)
npm run release:minor      # Release minor version (0.11.0 → 0.12.0)
npm run release:major      # Release major version (0.11.0 → 1.0.0)
npm run release:dry-run    # Preview release without publishing
npm run changelog:generate # Generate full changelog
npm run changelog:preview  # Preview changelog updates
```

## 📋 Recommended Workflows

**IMPORTANT**: Follow these workflows for best results. The automation pipeline will assist you.

### 1. ⭐ Feature Development (RECOMMENDED)
```bash
# Use feature-orchestrator for ALL new features
/new-feature [brief description]

# Agent will:
# 1. Ask 15-20 clarifying questions
# 2. Propose architecture plan
# 3. Implement feature automatically
# 4. Run all validations
# 5. Provide completion summary with commit message

# Time savings: 40-50% faster than manual workflow
```

### 2. Manual Feature Development (Alternative)
```bash
# 1. Start with clean slate
git checkout -b feature/your-feature
npm run check && npm run test

# 2. Develop with live testing
npm run type-check:watch   # Terminal 1
npm run serve:test         # Terminal 2
# Open http://localhost:3000 with ?tlog_mode=qa

# 3. Validate before commit
/precommit
```

### 3. Bug Fix
```bash
# 1. Reproduce with tests
npm run test:unit          # If unit test exists
npm run test:e2e           # If E2E test needed

# 2. Fix and validate
npm run type-check         # Check types
npm run test               # All tests pass
npm run check              # Lint/format pass

# 3. Pre-commit validation
/precommit
```

### 4. Pre-Commit Validation
```bash
# ALWAYS run before committing
/precommit

# Manual alternative:
npm run check && npm run test && npm run build:all
```

### 5. Pre-Merge Validation
```bash
# ALWAYS run before merging to main/develop
/compare-branch main

# Analyzes:
# - All changes since branch diverged
# - Quality audit (build, types, tests)
# - Security scan
# - Missing tests
# - Performance impact
# - Breaking changes

# Output: Merge readiness score (0-100) with recommendations
```

### 6. Debugging Failed Tests
```bash
# Unit/Integration (Vitest)
npm run test:unit -- --reporter=verbose

# E2E (Playwright)
npm run test:e2e           # Check console for errors
npx playwright show-trace tests-results/trace.zip  # Visual debugging
```

# Code Architecture

## 📁 Project Structure

```
src/
├── handlers/              # Event capture implementations
│   ├── click.handler.ts
│   ├── scroll.handler.ts
│   ├── page-view.handler.ts
│   ├── session.handler.ts
│   ├── performance.handler.ts
│   ├── error.handler.ts
│   └── viewport.handler.ts
├── managers/              # Core business logic
│   ├── state.manager.ts   # Global state (base class for all managers)
│   ├── event.manager.ts   # Event queue and emission
│   ├── session.manager.ts # Session lifecycle
│   ├── sender.manager.ts  # Network requests
│   ├── storage.manager.ts # localStorage persistence
│   └── user.manager.ts    # User identification
├── integrations/          # Third-party integrations
│   └── google-analytics.integration.ts
├── listeners/             # Low-level event listeners
│   ├── activity-listener-manager.ts
│   ├── visibility-listener-manager.ts
│   └── unload-listener-manager.ts
├── utils/                 # Utilities and helpers
│   ├── browser/           # Browser-specific utilities
│   ├── data/              # Data manipulation
│   ├── network/           # URL handling
│   ├── security/          # Sanitization and PII protection
│   └── validations/       # Input validation
├── types/                 # TypeScript type definitions
├── constants/             # Constants and configuration
├── app.ts                 # Main App class
├── api.ts                 # Public API wrapper
└── public-api.ts          # Library entry point

tests/
├── unit/                  # Unit tests (Vitest)
├── integration/           # Integration tests (Vitest)
└── e2e/                   # E2E tests (Playwright)
```

## 🏗️ Architecture Patterns

### 1. StateManager Pattern
All managers extend `StateManager` to access global state:

```typescript
export class StateManager {
  protected state: State;  // Global app state
}

export class SessionManager extends StateManager {
  // Access this.state directly
  getCurrentSession(): string | null {
    return this.state.sessionId;
  }
}
```

### 2. Handler Pattern
Event handlers must implement lifecycle methods:

```typescript
export class CustomHandler {
  constructor(private eventManager: EventManager) {}

  startTracking(): void {
    // Attach listeners (use { passive: true } for scroll/touch)
    document.addEventListener('event', this.handleEvent, { passive: true });
  }

  stopTracking(): void {
    // CRITICAL: Remove listeners to prevent memory leaks
    document.removeEventListener('event', this.handleEvent);
  }

  private handleEvent = (event: Event): void => {
    // Create event and send to EventManager
    this.eventManager.track({ type: EventType.CUSTOM, /* ... */ });
  };
}
```

### 3. Memory Management
**CRITICAL**: Always clean up resources to prevent memory leaks:

- **YOU MUST** remove event listeners in `stopTracking()`
- **YOU MUST** clear timers/intervals in `cleanup()` methods
- **YOU MUST** use `passive: true` for scroll/touch listeners
- Test memory leaks with Chrome DevTools Memory Profiler
- **TIP**: Use `memory-leak-detector` agent when creating/modifying handlers

### 4. Client-Only First Design
Library operates autonomously without backend:

- **Standalone Mode**: No `integrations` config = local-only (no network requests)
- **Optional Backend**: Configure `tracelog`/`custom`/`googleAnalytics` for data transmission
- **Event Emission**: Always emit via `on('event')` regardless of backend config
- **Client-Side Controls**: All validation, sampling, deduplication in browser

## 🔄 Event Flow

```
User Interaction
    ↓
Handler Captures Event (click.handler.ts, scroll.handler.ts, etc.)
    ↓
EventManager.track() → Validation & Deduplication
    ↓
EventManager.emit('event') → Local subscribers via on('event')
    ↓ (Optional, only if integration configured)
SenderManager → Batch & Send to Backend
```

## 📝 Naming Conventions

- **Handlers**: `*.handler.ts` - Event capture implementations
- **Managers**: `*.manager.ts` - Core business logic
- **Utils**: `*.utils.ts` - Pure functions (no side effects)
- **Types**: `*.types.ts` - TypeScript type definitions
- **Constants**: `*.constants.ts` - Static configuration values
- **Tests**: `*.test.ts` (unit/integration), `*.spec.ts` (E2E)

## 🧪 Testing Guidelines

### Unit Tests (Vitest)
- **Coverage**: 90%+ for core logic (handlers, managers, utils)
- **Focus**: Pure functions, business logic, validation
- **Mocking**: Use Vitest mocks for dependencies
- **Location**: `tests/unit/`

### Integration Tests (Vitest)
- **Focus**: Component interactions (e.g., EventManager + SenderManager)
- **Environment**: jsdom for browser APIs
- **Location**: `tests/integration/`

### E2E Tests (Playwright)
- **Focus**: Full user flows in real browser
- **Test Bridge**: Use `window.__traceLogBridge` to access internal state
- **QA Mode**: Enable with `?tlog_mode=qa` URL param
- **CSP-Safe**: Use internal waiting patterns, avoid `page.waitForFunction()`
- **Queue Events**: `sessionId` in `queue.session_id`, NOT in individual events
- **Location**: `tests/e2e/`

### Running Tests
```bash
npm run test:unit          # Fast feedback during development
npm run test:integration   # Component interaction validation
npm run test:e2e           # Full browser testing (slower)
npm run test:coverage      # Check coverage (90%+ target)
```

## 🔐 Key Concepts

### Standalone Mode
- No `integrations` config = local-only operation
- Events still emitted via `on('event')` for local consumption
- Zero network requests

### Backend Integration
- Optional `tracelog` (TraceLog SaaS) / `custom` (your API) / `googleAnalytics` (GA4)
- Events batched and sent to configured endpoint
- Failures handled gracefully (localStorage persistence for 5xx errors)

### Client-Side Controls
- **Validation**: All event validation in browser (no server dependencies)
- **Sampling**: Client-side sampling (e.g., 50% of users) via `samplingRate`
- **Deduplication**: Prevents duplicate events within time windows
- **PII Protection**: Auto-sanitizes emails, phones, credit cards, etc.

### Event Flow
1. **Capture** → Handler detects interaction
2. **Validate** → Check event structure, apply sampling
3. **Emit** → Fire `on('event')` for local subscribers
4. **Send** (optional) → Batch and transmit to backend (if configured)

## ⚠️ Common Pitfalls (MUST AVOID)

**IMPORTANT**: These are the most common mistakes that cause issues:

1. **Memory Leaks**: Forgetting `removeEventListener()` in `stopTracking()`
   - **FIX**: Use `memory-leak-detector` agent to catch these

2. **Circular Dependencies**: Importing `managers/` from handlers
   - **FIX**: Import `types/` only, never `managers/` in handlers

3. **State Mutation**: Mutating `this.state` directly
   - **FIX**: **NEVER** mutate state. Always use setters

4. **CSP Violations in Tests**: Using `page.waitForFunction()` in E2E
   - **FIX**: Use `page.evaluate()` instead (CSP-safe)

5. **Queue Structure**: Putting `sessionId` in individual events
   - **FIX**: `sessionId` goes in `queue.session_id`, **NOT** per-event

---

# Troubleshooting

## 🐛 Common Issues & Solutions

### Build Errors

**Issue**: `Cannot find module 'web-vitals'`
```bash
# Solution: Install dependencies
npm install
```

**Issue**: `TypeError: Cannot read property 'X' of undefined` in build
```bash
# Solution: Check TypeScript strict mode compliance
npm run type-check
# Look for null/undefined access issues
```

### Type Errors

**Issue**: `Object is possibly 'null' or 'undefined'`
```typescript
// ❌ Wrong
const value = someObject.property;

// ✅ Correct
const value = someObject?.property ?? defaultValue;
```

**Issue**: `Index signature is missing in type 'X'`
```typescript
// ❌ Wrong
const item = array[index];

// ✅ Correct (noUncheckedIndexedAccess enabled)
const item = array[index];
if (item) {
  // Use item safely
}
```

### Test Failures

**Issue**: E2E tests timeout or fail to detect events
```bash
# Solution 1: Check test bridge is available
# In test: await page.evaluate(() => window.__traceLogBridge !== undefined)

# Solution 2: Enable QA mode
# URL should include: ?tlog_mode=qa

# Solution 3: View Playwright trace
npx playwright show-trace tests-results/trace.zip
```

**Issue**: Unit tests fail with "localStorage is not defined"
```typescript
// Solution: Mock localStorage in test setup
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
```

### Runtime Errors

**Issue**: Events not being sent to backend
```typescript
// Checklist:
// 1. Check integration is configured
console.log(tracelog.isInitialized());  // Should be true

// 2. Check state has apiUrl
// In browser console with QA mode:
window.__traceLogBridge?.getState()

// 3. Check network tab for requests
// Should see POST requests to configured endpoint
```

**Issue**: Memory leaks in long-running sessions
```bash
# Solution: Profile with Chrome DevTools
# 1. Open DevTools → Performance → Memory
# 2. Take heap snapshot before/after interactions
# 3. Look for detached DOM nodes or event listeners
# 4. Verify stopTracking() removes all listeners
```

### CSP Violations

**Issue**: `Refused to evaluate a string as JavaScript` in E2E tests
```typescript
// ❌ Wrong (CSP violation)
await page.waitForFunction(() => window.__traceLogBridge.getQueue().length > 0);

// ✅ Correct (CSP-safe)
const queue = await page.evaluate(() => window.__traceLogBridge?.getQueue() ?? []);
expect(queue.length).toBeGreaterThan(0);
```

### Integration Issues

**Issue**: Google Analytics not receiving events
```typescript
// Checklist:
// 1. Verify GA measurement ID is correct
// 2. Check browser console for gtag errors
// 3. Use GA DebugView in GA4 dashboard
// 4. Ensure events are being emitted: tracelog.on('event', console.log)
```

## 🔍 Debugging Tips

### Enable Verbose Logging
```typescript
// QA mode (auto-enables detailed console logs)
// Add to URL: ?tlog_mode=qa

// Check initialization
console.log(tracelog.isInitialized());  // true/false

// Monitor events
tracelog.on('event', (event) => {
  console.log('Event:', event.type, event);
});

tracelog.on('queue', (batch) => {
  console.log('Queued:', batch.events.length, 'events');
});
```

### Test Bridge (E2E Tests)
```typescript
// Access internal state in Playwright tests
const state = await page.evaluate(() => window.__traceLogBridge?.getState());
const queue = await page.evaluate(() => window.__traceLogBridge?.getQueue());
const config = await page.evaluate(() => window.__traceLogBridge?.getConfig());

// Trigger manual flush
await page.evaluate(() => window.__traceLogBridge?.forceFlush());
```

### Memory Leak Detection
```bash
# 1. Build dev version for better debugging
npm run build:browser:dev

# 2. Open Chrome DevTools → Memory
# 3. Take heap snapshot
# 4. Interact with page (click, scroll, navigate)
# 5. Take another snapshot
# 6. Compare snapshots for growing objects
# 7. Look for: Event listeners, Timers, Detached DOM
```

### Network Debugging
```bash
# Check request payload
# 1. Open DevTools → Network
# 2. Filter: Fetch/XHR
# 3. Look for POST to /collect endpoint
# 4. Inspect payload (should be batched events)

# Check response
# - 200: Success
# - 4xx: Client error (events discarded)
# - 5xx: Server error (events persist in localStorage)
```

## 📞 Getting Help

- **Documentation**: [README.md](./README.md), [SECURITY.md](./SECURITY.md)
- **Examples**: `docs/` folder, [Playground](./docs/index.html)
- **Issues**: [GitHub Issues](https://github.com/nacorga/tracelog-lib/issues)
- **Tests**: Check `tests/` for usage examples

---

# Quick Reference

## 🚀 Most-Used Commands

```bash
# Daily Development
npm run type-check:watch   # Watch types in background
npm run serve:test         # Start test server (localhost:3000)

# Pre-Commit
npm run check && npm run test && npm run build:all

# Debugging
npm run test:coverage      # Check test coverage
npx playwright show-trace tests-results/trace.zip  # View E2E traces
```

## 📂 Key File Locations

| Purpose | Location |
|---------|----------|
| **Public API** | [src/public-api.ts](./src/public-api.ts) |
| **Main App** | [src/app.ts](./src/app.ts) |
| **Event Handlers** | [src/handlers/](./src/handlers/) |
| **Core Managers** | [src/managers/](./src/managers/) |
| **Type Definitions** | [src/types/](./src/types/) |
| **Configuration** | [src/constants/config.constants.ts](./src/constants/config.constants.ts) |
| **Unit Tests** | [tests/unit/](./tests/unit/) |
| **E2E Tests** | [tests/e2e/](./tests/e2e/) |
| **Build Output** | `dist/esm/`, `dist/cjs/`, `dist/browser/` |

## 🔢 Important Constants

| Constant | Value | Location |
|----------|-------|----------|
| **Session Timeout** | 15 minutes | [src/constants/config.constants.ts](./src/constants/config.constants.ts) |
| **Queue Interval** | 10 seconds | [src/constants/config.constants.ts](./src/constants/config.constants.ts) |
| **Event Expiry** | 2 hours | [src/constants/storage.constants.ts](./src/constants/storage.constants.ts) |
| **Scroll Throttle** | 100ms | [src/constants/performance.constants.ts](./src/constants/performance.constants.ts) |
| **Coverage Target** | 90%+ | [package.json](./package.json) |
| **Library Size** | ~15KB gzipped | Build output |

## 🎯 Event Types

| Type | Handler | Purpose |
|------|---------|---------|
| `PAGE_VIEW` | [page-view.handler.ts](./src/handlers/page-view.handler.ts) | Navigation tracking |
| `CLICK` | [click.handler.ts](./src/handlers/click.handler.ts) | User interactions |
| `SCROLL` | [scroll.handler.ts](./src/handlers/scroll.handler.ts) | Scroll depth/engagement |
| `SESSION_START/END` | [session.handler.ts](./src/handlers/session.handler.ts) | Session boundaries |
| `CUSTOM` | EventManager API | Business-specific events |
| `WEB_VITALS` | [performance.handler.ts](./src/handlers/performance.handler.ts) | LCP, CLS, INP, FCP, TTFB |
| `ERROR` | [error.handler.ts](./src/handlers/error.handler.ts) | JavaScript errors |
| `VIEWPORT_VISIBLE` | [viewport.handler.ts](./src/handlers/viewport.handler.ts) | Element visibility tracking |

## 🛠️ Slash Commands (Quick Reference)

| Command | Purpose | See Also |
|---------|---------|----------|
| `/new-feature [desc]` | ⭐ Interactive feature development | [Full Guide](./.claude/README.md#new-feature-description) |
| `/precommit` | Full acceptance validation | [Full Guide](./.claude/README.md#1-precommit) |
| `/compare-branch [branch]` | Pre-merge audit | [Full Guide](./.claude/README.md#5-compare-branch-branch) |
| `/coverage` | Test coverage analysis | [Full Guide](./.claude/README.md#2-coverage) |
| `/security-audit` | GDPR/privacy scan | [Full Guide](./.claude/README.md#4-security-audit) |
| `/perf` | Bundle size check | [Full Guide](./.claude/README.md#3-perf) |
| `/fix` | Auto-fix lint/format | [Full Guide](./.claude/README.md#6-fix) |

## 🔗 External Links

- **GitHub Repo**: https://github.com/nacorga/tracelog-lib
- **NPM Package**: https://www.npmjs.com/package/@tracelog/lib
- **CDN (jsDelivr)**: https://cdn.jsdelivr.net/npm/@tracelog/lib@latest/dist/browser/tracelog.js
- **Issues**: https://github.com/nacorga/tracelog-lib/issues
- **Platform Docs**: See [main CLAUDE.md](../../CLAUDE.md)

## 💡 Quick Tips

1. **⭐ New Feature**: ALWAYS use `/new-feature [desc]` for 40-50% time savings
2. **Pre-Commit**: ALWAYS run `/precommit` before committing
3. **Pre-Merge**: ALWAYS run `/compare-branch main` before merging
4. **QA Mode**: Add `?tlog_mode=qa` to URL for verbose logging
5. **Test Bridge**: Use `window.__traceLogBridge` in E2E tests
6. **Memory Safety**: Use `memory-leak-detector` agent for handlers
7. **Type Safety**: Run `npm run type-check:watch` during development
8. **CSP-Safe**: Use `page.evaluate()` not `page.waitForFunction()` in E2E tests
9. **Coverage**: Focus on 90%+ for core logic (handlers, managers, utils)
10. **Automation**: Hooks run automatically - understand what they do (see above)
