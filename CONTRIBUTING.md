# Contributing to TraceLog Events Library

Thank you for your interest in contributing to the TraceLog Events Library! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Git**
- **TypeScript** knowledge
- Basic understanding of web analytics and tracking

### First Contribution

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch
4. Make your changes
5. Test your changes with E2E tests
6. Submit a pull request

## Development Setup

### Clone and Install

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/tracelog-sdk.git
cd tracelog-sdk

# Install dependencies
npm install
```

### Main Scripts

```bash
# Build for ESM (default)
npm run build

# Build for both ESM and CommonJS
npm run build:all

# Build browser bundle (Vite)
npm run build:browser

# Lint and format
npm run lint
npm run format
npm run check  # Run both lint and format check
npm run fix    # Fix lint and format issues

# Testing
npm run test:e2e          # Run E2E tests
npm run serve:test        # Serve test fixtures on localhost:3000
```

### Key Files

- **`src/public-api.ts`**: Main entry point, exports the API
- **`src/api.ts`**: Core tracking implementation with init, event, destroy methods
- **`src/app.ts`**: Main application class
- **`src/types/`**: TypeScript interfaces and types organized by domain
- **`src/constants/`**: Configuration constants and defaults

## Project Structure

```
src/
├── api.ts                    # Main API exports (init, event, destroy)
├── app.ts                    # Core App class
├── public-api.ts            # Entry point
├── app.types.ts             # Type re-exports
├── app.constants.ts         # App-level constants
├── constants/               # Domain-specific constants
│   ├── api.constants.ts
│   ├── browser.constants.ts
│   ├── limits.constants.ts
│   ├── security.constants.ts
│   ├── storage.constants.ts
│   ├── timing.constants.ts
│   └── validation.constants.ts
├── handlers/                # Event handlers
│   ├── click.handler.ts
│   ├── page-view.handler.ts
│   ├── scroll.handler.ts
│   └── session.handler.ts
├── integrations/           # Third-party integrations
│   └── google-analytics.integration.ts
├── listeners/              # Event listeners
│   ├── activity-listener-manager.ts
│   ├── input-listener-managers.ts
│   ├── touch-listener-manager.ts
│   ├── unload-listener-manager.ts
│   └── visibility-listener-manager.ts
├── managers/              # Business logic managers
│   ├── api.manager.ts
│   ├── config.manager.ts
│   ├── event.manager.ts
│   ├── sampling.manager.ts
│   ├── sender.manager.ts
│   ├── session.manager.ts
│   ├── state.manager.ts
│   ├── storage.manager.ts
│   ├── tags.manager.ts
│   └── user.manager.ts
├── types/                 # Type definitions
│   ├── common.types.ts
│   ├── config.types.ts
│   ├── device.types.ts
│   ├── event.types.ts
│   ├── log.types.ts
│   ├── queue.types.ts
│   ├── state.types.ts
│   └── tag.types.ts
└── utils/                 # Utilities
    ├── browser/
    ├── data/
    ├── logging/
    ├── network/
    ├── security/
    └── validations/
```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

```bash
# Feature branches
feature/add-session-timeout
feature/improve-scroll-tracking

# Bug fixes  
fix/memory-leak-event-listeners
fix/typescript-definitions

# Documentation
docs/update-api-reference

# Refactoring
refactor/optimize-bundle-size
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Examples
feat: add custom scroll container support
fix: resolve session timeout issues  
docs: update API documentation
refactor: improve event manager performance
perf: optimize event queue processing
test: add E2E tests for custom events
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

## Testing

### E2E Testing with Playwright

The project uses Playwright for end-to-end testing:

```bash
# Run all E2E tests
npm run test:e2e

# Serve test fixtures locally (for development)
npm run serve:test  # http://localhost:3000
```

**Test Files:**
- `tests/e2e/app.spec.ts` - Core app functionality
- `tests/e2e/click-events.spec.ts` - Click tracking
- `tests/e2e/custom-events.spec.ts` - Custom event API
- `tests/e2e/page-view-events.spec.ts` - Page navigation
- `tests/e2e/scroll-events.spec.ts` - Scroll tracking
- `tests/e2e/session-events.spec.ts` - Session management

### Manual Testing

Create test files to verify functionality:

```javascript
// test-example.js
import { TraceLog } from './dist/esm/public-api.js';

// Test basic functionality
await TraceLog.init({
  id: 'test-project-id',
  globalMetadata: { test: true }
});

TraceLog.event('test_event', {
  action: 'manual_test',
  timestamp: Date.now()
});

console.log('✅ Manual test completed');
```

### Browser Testing

Tests run automatically in:
- **Chromium** (Desktop Chrome)
- **Mobile Chrome** (Pixel 5) 
- **Firefox**, **WebKit**, **Mobile Safari** (local only)

## Code Style

### ESLint and Prettier

The project uses ESLint for linting and Prettier for formatting:

```bash
# Check code style
npm run check

# Fix issues automatically  
npm run fix
```

**Prettier Configuration:**
- Single quotes: `true`
- Semi-colons: `true`
- Trailing commas: `all`
- Print width: `120`
- Tab width: `2`

### TypeScript Guidelines

- Use **strict TypeScript** configuration
- Prefer **interfaces** over types for object shapes
- Include **JSDoc comments** for public APIs
- Organize types by domain in `src/types/`

```typescript
// Good
interface EventData {
  readonly id: string;
  readonly timestamp: number;
  readonly metadata?: Record<string, MetadataType>;
}

/**
 * Sends a custom tracking event
 * @param name - Event name identifier
 * @param metadata - Optional event metadata
 */
export function event(name: string, metadata?: Record<string, MetadataType>): void;
```

### Architecture Patterns

- **Manager Pattern**: Business logic in `src/managers/`
- **Handler Pattern**: Event processing in `src/handlers/`  
- **Listener Pattern**: DOM events in `src/listeners/`
- **State Management**: Centralized in `StateManager`
- **Error Handling**: Graceful failures without breaking user apps

## Submitting Changes

### Pull Request Process

1. **Fork and Branch**: Create a feature branch from `develop`
2. **Develop**: Make your changes following the guidelines
3. **Test**: Run E2E tests with `npm run test:e2e`
4. **Check**: Run `npm run check` for linting and formatting
5. **Build**: Ensure `npm run build:all` works
6. **Submit**: Create a pull request with clear description

### Pull Request Requirements

- ✅ **E2E tests pass** (`npm run test:e2e`)
- ✅ **Code style** (`npm run check`)
- ✅ **TypeScript compilation** (`npm run build:all`)
- ✅ **No breaking changes** (or properly documented)
- ✅ **Clear description** of changes
- ✅ **Branch up to date** with develop

### Review Process

1. **Automated Checks**: TypeScript, ESLint, Prettier
2. **E2E Testing**: Playwright tests in multiple browsers
3. **Code Review**: Maintainer review for quality and design
4. **Approval**: At least one maintainer approval required

---

Thank you for contributing to TraceLog Events Library! 🚀 