# TraceLog SDK - GitHub Copilot Instructions

**ALWAYS FOLLOW THESE INSTRUCTIONS FIRST.** Only search for additional context or run discovery commands if the information provided here is incomplete or found to be incorrect.

## Project Overview

Event tracking SDK that automatically captures user interactions (clicks, scroll, navigation, web performance) and allows custom events. Includes cross-tab session management, session recovery, Google Analytics integration, and sampling capabilities.

## 📂 Key File Locations & Architecture

### Critical Entry Points
- **`src/public-api.ts`** - Main export, START HERE for API understanding
- **`src/api.ts`** - Core init/event/destroy methods
- **`src/app.ts`** - Main orchestration class  
- **`tests/fixtures/index.html`** - Manual testing page (localhost:3000)
- **`tests/e2e/`** - Playwright E2E tests for all functionality

### Project Structure
```
src/
├── api.ts                 # Public API (init, event, destroy)
├── app.ts                 # Main class orchestrating all managers
├── handlers/              # Event capture (click.handler.ts, etc.)
├── managers/              # Core business logic  
├── integrations/          # External integrations (Google Analytics)
├── utils/                 # Utilities and validations
└── types/                 # TypeScript definitions

tests/
├── fixtures/              # Test HTML pages and resources
└── e2e/                   # Playwright browser tests
```

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

## 🚀 Essential Setup & Build Commands

### Initial Setup
```bash
# ALWAYS start here - install dependencies
npm install             # Takes ~30 seconds, installs all dependencies
```

### Build Commands (VALIDATED TIMINGS)
```bash
# Standard builds
npm run build:all       # ~6 seconds - ESM + CJS build (RECOMMENDED)
npm run build:browser   # ~1.3 seconds - Vite browser bundle  
npm run build           # ~3 seconds - ESM build only
npm run build:cjs       # ~3 seconds - CommonJS build only

# Production builds
npm run build-ugly      # ~2 minutes - NEVER CANCEL - Minified with UglifyJS
```

### Quality & Testing Commands (VALIDATED TIMINGS)
```bash
# Code quality - ALWAYS run before committing
npm run check           # ~7 seconds - Lint + format verification
npm run fix             # ~7 seconds - Auto-fix lint + format issues

# Testing - NEVER CANCEL THESE
npm run test:e2e        # ~1 minute - NEVER CANCEL - Full E2E tests with Playwright
npm run serve:test      # Instant start - Test server on http://localhost:3000
```

### **CRITICAL TIMING WARNINGS**
- **NEVER CANCEL** `npm run test:e2e` - Takes ~1 minute, set timeout to 90+ seconds
- **NEVER CANCEL** `npm run build-ugly` - Takes ~2 minutes, set timeout to 180+ seconds  
- All other commands complete within 10 seconds

## 🔧 Development Patterns & Debugging

### Quick Debug Setup
```typescript
// Enable detailed logging for development
await TraceLog.init({ 
  id: 'your-project', 
  qaMode: true  // Shows all events in console
});

// Check browser storage (prefix 'tl:')
// Monitor BroadcastChannel for cross-tab sessions
```

### Adding New Functionality
```typescript
// Standard pattern:
// 1. Create handler in handlers/ (e.g., new-feature.handler.ts)
// 2. Register in App.initHandlers()
// 3. Add types in types/ (e.g., new-feature.types.ts) 
// 4. Add validations in utils/validations/
// 5. Create E2E tests in tests/e2e/
```

### Main SDK Flow
`TraceLog.init()` → `App.init()` → `setState()` → `initHandlers()` → Active DOM listeners

`DOM Event` → `Handler` → `EventManager.track()` → `Queue` → `SenderManager` → `API Send`

## ⚠️ CRITICAL: What NOT To Do

### 🚫 Build & Dependencies  
- **NEVER** add new dependencies - only `web-vitals` allowed
- **NEVER** break dual ESM/CJS compatibility in package.json exports
- **NEVER** change `dist/` structure - affects user imports
- **NEVER** commit without passing `npm run check`
- **NEVER** cancel long-running builds (`build-ugly` takes ~2 minutes)

### 🚫 Performance & Memory
- **NEVER** create memory leaks - always call `cleanup()` in handlers
- **NEVER** block main thread - use `passive: true` in event listeners  
- **NEVER** send high-frequency events without throttling
- **NEVER** store unlimited events (respect `MAX_EVENTS_QUEUE_LENGTH`)

### 🚫 State & Security
- **NEVER** mutate `globalState` directly - use `StateManager.set()`
- **NEVER** create multiple `App` instances simultaneously
- **NEVER** call `init()` before checking `typeof window !== 'undefined'`
- **NEVER** store sensitive data in localStorage without sanitization

## 🎯 Essential Validation Workflows

### **ALWAYS** Validate Changes With These Scenarios
After making any code changes, ALWAYS run these validation steps:

#### 1. Build & Quality Validation (Required)
```bash
npm run check           # Lint + format - MUST PASS before commit
npm run build:all       # Verify both ESM/CJS builds work
```

#### 2. Manual SDK Functionality Test (Required)
```bash
# Terminal 1: Start test server
npm run serve:test      # Runs on http://localhost:3000

# Terminal 2: Browser test (or use Playwright)
# Navigate to http://localhost:3000
# Verify console shows: "TraceLog initialized successfully"
# Click "Test Button" - verify click events logged
# Click "Send Custom Event" - verify custom events logged
```

#### 3. E2E Test Validation (For Major Changes)
```bash
npm run test:e2e        # NEVER CANCEL - ~1 minute runtime
# Tests: click tracking, custom events, session management, web vitals
```

#### 4. Production Build Test (For Release Changes)
```bash
npm run build-ugly      # NEVER CANCEL - ~2 minutes
# Verifies minified production build works
```

### Expected Console Output (Successful Init)
```
[TraceLog] Starting leader election
[TraceLog] Recovery manager initialized  
[TraceLog] New session started: [session-id]
[TraceLog] session_start event: {...}
[TraceLog] page_view event: {...}
TraceLog initialized successfully
```

## 📋 Common Command Reference

Use these command outputs to save time instead of running discovery commands:

### Repository Structure (`ls -la`)
```
.commitlintrc.json    .lintstagedrc.json    .versionrc.json       package.json          
.cursor               .prettierignore       CHANGELOG.md          playwright.config.ts  
.eslintrc.cjs         .prettierrc           CLAUDE.md             scripts/              
.git/                 .github/              CONTRIBUTING.md       src/                  
.gitignore            .husky/               LICENSE               tests/                
.gitmessage           .nvmrc                README.md             tsconfig.*.json       
```

### Package.json Scripts (Key Commands)
```json
{
  "build:all": "npm run build:esm && npm run build:cjs",
  "build:browser": "vite build", 
  "build-ugly": "npm run build:all && find dist -name '*.js' -exec npx uglify-js {} -o {} --compress --mangle --toplevel \\;",
  "check": "npm run lint && npm run format:check",
  "test:e2e": "npm run build:browser && cp dist/browser/tracelog.js tests/fixtures/tracelog.js && playwright test",
  "serve:test": "http-server tests/fixtures -p 3000 --cors"
}
```

### Test Fixture Files (`tests/fixtures/`)
```
index.html          # Main test page with SDK integration
web-vitals.html     # Web vitals testing page  
tracelog.js         # Built SDK bundle (generated)
json/               # Test data files
```

### Build Output Structure (`dist/`)
```
browser/            # Vite browser bundle
├── tracelog.js     # Main browser build
└── web-vitals-*.mjs

cjs/                # CommonJS build  
└── *.js           # All source files compiled

esm/                # ES Module build
└── *.js           # All source files compiled
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
