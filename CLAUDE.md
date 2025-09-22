# TraceLog Library

**JavaScript library for web analytics and real-time event tracking**

## 🎯 Purpose

Event tracking library that automatically captures user interactions (clicks, scrolls, navigation, web performance) and supports custom events. Features cross-tab session management, session recovery, Google Analytics integration, and event sampling.

## 🏗️ Architecture

```
src/
├── api.ts                 # Public API (init, event, destroy)
├── app.ts                 # Main orchestrator class managing handlers and state
├── handlers/              # Event capture handlers
│   ├── click.handler.ts   # Click tracking
│   ├── scroll.handler.ts  # Scroll tracking
│   ├── session.handler.ts # Session management
│   └── performance.handler.ts # Web vitals capture
├── managers/              # Core business logic and state management
│   ├── event.manager.ts   # Event queue and dispatching
│   ├── session.manager.ts # Session lifecycle management
│   ├── storage.manager.ts # localStorage abstraction
│   └── state.manager.ts   # Global shared state management
├── integrations/          # Third-party integrations
├── utils/                 # Utility functions and validation helpers
└── types/                 # TypeScript type definitions
```

**Main flow**: `init()` → Configure → Activate handlers → EventManager queues → Send events

## 🛠️ Tech Stack

- **TypeScript 5.7** - Strong typing and latest features
- **Vite** - Fast build tool and bundler
- **web-vitals 4.2** - Only runtime dependency for performance metrics
- **Playwright** - End-to-end testing framework
- **ESLint + Prettier** - Code linting and formatting


## 📝 Code Conventions

### Lint \& Format

```bash
npm run check      # Lint and format verification
npm run fix        # Auto-fix linting and formatting issues
```


### Naming

- Classes: `PascalCase` (e.g., `EventManager`)
- Files: `kebab-case.type.ts` (e.g., `session.manager.ts`)
- Public methods: `camelCase`
- Private methods: `camelCase` prefixed with `private`
- Constants: `UPPER_SNAKE_CASE`


### Patterns

- Managers extend `StateManager` for global state access
- Handlers are classes capturing specific DOM events
- Types declared in separate `.types.ts` files
- Utils contain pure functions grouped by domain


## 🚀 Common Commands

```bash
# Build commands
npm run build           # TypeScript build (both ESM and CJS)
npm run build:browser   # Browser-specific build using Vite
npm run build:all       # Complete build (ESM + CJS)
npm run build-ugly      # Minified build using UglifyJS

# Development
npm run serve:test      # Start local test server (default port 3000)
npm run test:e2e        # Run Playwright end-to-end tests

# Quality assurance
npm run lint            # Run ESLint
npm run format          # Run Prettier formatting
npm run check           # Run lint and format verification
npm run fix             # Auto-fix lint and format issues
```


## 🔍 Critical Paths

### 1. Initialization

`api.init()` → `App.init()` → `setState()` → `initHandlers()` → event listeners active

### 2. Event Tracking

DOM event occurs → Handler captures → `EventManager.track()` queues event → `SenderManager` sends events

### 3. Session Management

User activity tracked → `SessionManager` syncs across tabs → recovers session on failure

### 4. Data Sending

Events batched → Validated → Sent via `sendEventsQueue()` → Retries if failure detected

## ⚠️ WHAT NOT TO DO

### 🚫 Dependencies \& Build

- DON’T add dependencies unless absolutely necessary; only `web-vitals` is allowed
- DON’T break ESM/CJS dual compatibility; keep `exports` consistent in `package.json`
- DON’T change `dist/` folder structure
- DON’T commit without passing `npm run check`


### 🚫 Security

- DON’T store sensitive information in `localStorage`
- DON’T send Personally Identifiable Information (PII) without proper sanitization (`sanitize.utils.ts`)
- DON’T execute dynamic or unvalidated code
- DON’T expose internal-only APIs in the browser build


### 🚫 Performance

- DON’T cause memory leaks; always call `cleanup()` in handlers
- DON’T block the main thread; use passive event listeners
- DON’T send high-frequency events without throttling
- DON’T allow the event queue to grow infinitely (use `MAX_EVENTS_QUEUE_LENGTH` limit)


### 🚫 State \& Sessions

- DON’T mutate `globalState` directly; always use `StateManager.set()`
- DON’T instantiate multiple `App` instances concurrently
- DON’T call `init()` unless `typeof window !== 'undefined'`
- DON’T ignore session recovery failures to prevent data loss


## 🎯 Common Tasks

### Development

```bash
# Local development setup
npm run serve:test      # Terminal 1: start test server
npm run test:e2e        # Terminal 2: run e2e tests

# Pre-commit checks
npm run check           # Lint and format validation
npm run build:all       # Ensure build success
```


### Debug

```typescript
await TraceLog.init({
  id: 'your-project-id'
});
```


### Adding New Features

```typescript
// Steps to add new functionality

// 1. Create a new handler class under handlers/
// 2. Register the handler in App.initHandlers()
// 3. Add new types to the types/ directory
// 4. Add validation helpers if needed in utils/validations/
// 5. Write end-to-end tests under tests/
```
