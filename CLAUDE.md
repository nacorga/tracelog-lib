# Development
- Always use clean-code-architect subagent
- TypeScript 5.7 strict mode enforced
- Single dependency: `web-vitals` (runtime)
- Dual ESM/CJS support required

# Acceptance Criteria

- No build errors (use `npm run build:all` script to verify)
- NO type errors (use `npm run type-check` script to verify)
- NO lint errors (use `npm run lint` script to verify - warnings are acceptable, only errors block acceptance)
- 100% test pass rate (unit + integration + E2E)

# Bash commands

## Build & Quality
- `npm run build:all` - Build ESM + CJS + Browser bundles
- `npm run check` - Run lint + format check
- `npm run fix` - Auto-fix lint/format issues
- `npm run type-check` - TypeScript type checking

## Testing
- `npm run test:unit` - Run unit tests (Vitest)
- `npm run test:integration` - Run integration tests (Vitest)
- `npm run test:e2e` - Run E2E tests (Playwright)
- `npm run test` - Run all tests
- `npm run test:coverage` - Generate coverage report

## Development
- `npm run serve:test` - Start test server (localhost:3000)
- `npm run docs:dev` - Start demo server

# Code style

## Architecture Patterns
- **StateManager**: All managers extend this for global state access via `this.state`
- **Event Handlers**: Must implement `startTracking()` and `stopTracking()` with cleanup
- **Memory Management**: Always call `cleanup()` in handlers to prevent leaks
- **Client-Only First**: Library must work autonomously without backend dependencies

## Key Concepts
- **Standalone Mode**: No `integrations` config = local-only operation (no network requests)
- **Backend Integration**: Optional `tracelog`/`custom`/`googleAnalytics` integrations
- **Client-Side Controls**: All validation, sampling, deduplication happen in browser
- **Event Flow**: Capture → Validate → Emit locally AND/OR send to backend (if configured)

## Testing Guidelines
- **Unit Tests**: Vitest for core logic, 90%+ coverage required
- **Integration Tests**: Component interactions with Vitest
- **E2E Tests**: Playwright with `__traceLogBridge` test bridge
- **QA Mode**: Use `?tlog_mode=qa` URL param for testing
- **CSP-Safe**: Use internal waiting patterns, avoid `page.waitForFunction()`
- **Queue Events**: `sessionId` in `queue.session_id`, NOT in individual events
