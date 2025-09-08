# Project Overview

Event tracking SDK that automatically captures user interactions (clicks, scroll, navigation, web performance) and allows custom events. Includes cross-tab session management, session recovery, Google Analytics integration, and sampling capabilities.

## 🏗️ Architecture

```
src/
├── api.ts                 # Public API (init, event, destroy)
├── app.ts                 # Main class orchestrating all managers
├── handlers/              # Specific event capture
├── managers/              # Core business logic
├── integrations/          # External integrations
├── utils/                 # Utilities and validations
└── types/                 # TypeScript definitions
```

**Main flow**: `init()` → Configuration → Active handlers → EventManager → Queue → Send

## 🛠️ Tech Stack

- **TypeScript 5.7** - Static typing
- **Vite** - Build tool and bundler
- **web-vitals 4.2** - Only dependency (performance metrics)
- **Playwright** - E2E testing
- **ESLint + Prettier** - Linting and formatting

## 📝 Code Conventions

### Lint & Format
```bash
npm run check      # Verify lint + format
npm run fix        # Auto-fix lint + format
```

### Naming
- **Classes**: `PascalCase` (e.g.: `EventManager`)
- **Files**: `kebab-case.type.ts` (e.g.: `session.manager.ts`)
- **Public methods**: `camelCase`
- **Private methods**: `camelCase` with `private` prefix
- **Constants**: `UPPER_SNAKE_CASE`

### Patterns
- **Managers**: Extend `StateManager` for global state access
- **Handlers**: Classes that capture specific DOM events
- **Types**: Interfaces in separate `.types.ts` files
- **Utils**: Pure functions, organized by domain

## 🚀 Common Commands

```bash
# Build
npm run build           # TypeScript build (dual: ESM + CJS)
npm run build:browser   # Browser build (Vite)
npm run build:all       # Complete build (ESM + CJS)
npm run build-ugly      # Minified build with UglifyJS

# Development
npm run serve:test      # Local test server (port 3000)
npm run test:e2e        # End-to-end tests with Playwright

# Quality
npm run lint            # ESLint
npm run format          # Prettier
npm run check           # Lint + format (verification)
npm run fix             # Auto-fix lint + format
```

## 🔍 Critical Paths

### 1. Initialization
`api.init()` → `App.init()` → `setState()` → `initHandlers()` → Active listeners

### 2. Event Tracking
DOM Event → Handler → `EventManager.track()` → Queue → `SenderManager` → API

### 3. Session Management
Activity → `SessionManager` → Cross-tab sync → Recovery if fails

### 4. Data Sending
Batch queue → Validation → `sendEventsQueue()` → Auto-retry if fails

## ⚠️ WHAT NOT TO DO

### 🚫 Dependencies & Build
- **DON'T** add new dependencies without justification - only `web-vitals` allowed
- **DON'T** break dual ESM/CJS compatibility - maintain `exports` in package.json
- **DON'T** change `dist/` structure - affects user imports
- **DON'T** commit without passing `npm run check`

### 🚫 Security
- **DON'T** store sensitive data in localStorage
- **DON'T** send PII without sanitization (use `sanitize.utils.ts`)
- **DON'T** allow execution of unvalidated code
- **DON'T** expose internal APIs in browser build

### 🚫 Performance
- **DON'T** create memory leaks - always `cleanup()` in handlers
- **DON'T** block main thread - use `passive: true` in listeners
- **DON'T** send high-frequency events without throttling
- **DON'T** store infinite queue (limit: `MAX_EVENTS_QUEUE_LENGTH`)

### 🚫 State & Sessions
- **DON'T** mutate `globalState` directly - use `StateManager.set()`
- **DON'T** create multiple `App` instances simultaneously
- **DON'T** call `init()` before checking `typeof window !== 'undefined'`
- **DON'T** ignore session recovery errors - can cause data loss

## 🎯 Common Tasks

### Development
```bash
# Local setup for testing
npm run serve:test      # Terminal 1: server
npm run test:e2e        # Terminal 2: E2E tests

# Pre-commit verification
npm run check           # Lint + format
npm run build:all       # Verify builds
```

### Debug
```typescript
// Enable debug mode
await TraceLog.init({ 
  id: 'your-project', 
  qaMode: true  // Detailed console logs
});

// Check state in localStorage (prefix 'tl:')
// Review BroadcastChannel for cross-tab sessions
```

### Add functionality
```typescript
// 1. Create handler in handlers/
// 2. Register in App.initHandlers()
// 3. Add types in types/
// 4. Validations in utils/validations/
// 5. E2E tests in tests/
```

---

# Coding Guidelines (TypeScript)

## Persona & Output Discipline

- Act as a senior TypeScript engineer for Node.js. Prefer clean code and design patterns.
- Output only the code or minimal diffs needed to fulfill the request. Avoid explanations unless explicitly asked.
- Do not generate docs or comments unless explicitly requested.
- Do not run Git or shell commands unless explicitly instructed.
- Preserve the public API. If a breaking change is required, briefly indicate it.

## Principles

- Use English in code and identifiers.
- Always type parameters and return values; avoid any. Create and reuse domain types.
- Keep modules pure on import; avoid side effects at module load time.
- Strive for clean, readable, maintainable, efficient code (KISS, DRY, SOLID).
- Prefer simplicity and clarity over cleverness. Follow project ESLint/Prettier defaults.

## Naming & Structure

- PascalCase for classes and types.
- camelCase for variables, functions, methods.
- kebab-case for files and directories.
- UPPERCASE for environment variables; avoid magic numbers via constants.
- Start function names with verbs; boolean functions as isX/hasX/canX.
- One responsibility per file. Minimize public API; hide internals.
- Import order: std → external → internal; group and sort.

## Functions

- Keep functions short and single-purpose (≈ under 20 statements).
- Avoid deep nesting; use guards and extract helpers.
- Prefer map/filter/reduce for collection ops.
- Arrow functions for small lambdas (≤ 3 statements); named functions for non-trivial logic.
- Prefer default parameters over repeated null/undefined checks.
- Reduce params with RO-RO: receive typed objects; return objects for multiple outputs.
- Maintain one abstraction level per function; design for testability and extension.

## Data Modeling

- Prefer domain types over raw primitives.
- Prefer immutability; use readonly and as const where helpful.
- Centralize validation via value objects or schemas (e.g., class-validator, Zod).

## Async & Errors

- Prefer async/await; propagate errors with clear messages and types.
- Throw only for unexpected conditions.
- Catch to handle expected cases, add context, or map to domain errors; otherwise rely on global handlers.
- Separate pure logic from I/O (ports/adapters).

## Classes & Architecture

- Apply SOLID; prefer composition over inheritance.
- Define interfaces for contracts and ports.
- Keep classes small (< 200 statements, < 10 public methods/properties).
- Use Dependency Injection to decouple; consider Repository/Service patterns for data access.

## Performance

- Avoid redundant work; memoize/cache where it pays off.
- Avoid N+1 and accidental O(n²) hotspots.
- Do not prematurely optimize; focus on measured bottlenecks.

## Security & Configuration

- Never expose secrets; read from environment variables.
- Validate external input; sanitize/escape as needed.
- Manage timeouts and retries with control (e.g., exponential backoff).

## Testing (On-Demand)

- When tests are requested: prefer unit tests (pure, isolated); mock I/O.
- Cover happy paths, edge cases, and expected failures.
- Use clear, behavior-oriented test naming.

---

# Project Conventions

- Lint/format on commit: ESLint + Prettier.
- Naming: kebab-case files, PascalCase classes, camelCase variables.
- Commits: Conventional Commits (feat:, fix:, chore:).
- No business logic in controllers.
- Do not persist raw candles daily; compute features in-memory.
- The LLM must not invent data; only use computed features and available evidence.
