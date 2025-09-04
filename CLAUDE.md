# LLM Context Instructions

## Introduction

TraceLog Client (`@tracelog/client`) is a TypeScript-based web analytics library that captures user behavior data and sends it to the TraceLog platform. This document provides comprehensive context for LLMs working on this codebase, including architecture overview, development guidelines, and common patterns.

## Project Overview

- **Package**: `@tracelog/client` v0.6.2
- **Language**: TypeScript
- **Build System**: Vite + TypeScript
- **Testing**: Playwright (E2E)
- **License**: MIT
- **Purpose**: Web analytics client library for tracking user interactions, page views, performance metrics, and custom events

## Architecture

### Core Components

1. **App Class** (`src/app.ts`)
   - Main entry point and initialization
   - Manages lifecycle and state
   - Coordinates all managers and handlers

2. **Managers** (`src/managers/`)
   - `EventManager` - Core event processing, queuing, and immediate flush capabilities
   - `SenderManager` - Data transmission with async/sync sending support and progressive fallback
   - `ConfigManager` - Configuration fetching and management
   - `SessionManager` - Centralized session lifecycle with deduplication and managed session ends
   - `StateManager` - Application state management
   - `StorageManager` - Local storage operations
   - `UserManager` - User identification
   - `TagsManager` - Event tagging logic
   - `SamplingManager` - Event sampling control

3. **Handlers** (`src/handlers/`)
   - `ClickHandler` - Click event capture
   - `ScrollHandler` - Scroll tracking
   - `PageViewHandler` - Page navigation tracking
   - `SessionHandler` - Session lifecycle with multi-fallback page unload handling
   - `PerformanceHandler` - Web Vitals and performance metrics
   - `ErrorHandler` - JavaScript error capture
   - `NetworkHandler` - Network error tracking

4. **Event Types** (`src/types/event.types.ts`)
   ```typescript
   enum EventType {
     PAGE_VIEW = 'page_view',
     CLICK = 'click',
     SCROLL = 'scroll',
     SESSION_START = 'session_start',
     SESSION_END = 'session_end',
     CUSTOM = 'custom',
     WEB_VITALS = 'web_vitals',
     ERROR = 'error'
   }
   ```

### Data Flow

```
User Interaction → Handler → EventManager → Queue → SenderManager → Middleware
                                    ↓
                            Centralized Session End
                                    ↓
                        Progressive Event Sending (sendBeacon → syncXHR → fetch)
```

## Development Guidelines

### Do's ✅

- **Follow TypeScript best practices**
  - Use strict type checking
  - Define interfaces for all data structures
  - Use enums for constants

- **Maintain existing patterns**
  - Extend `StateManager` for stateful classes
  - Use dependency injection in constructors
  - Follow the manager/handler pattern

- **Testing**
  - Write E2E tests for user-facing features
  - Test edge cases and error conditions
  - Use the existing test structure in `tests/e2e/`

- **Performance**
  - Implement event deduplication
  - Use debouncing for frequent events (scroll, resize)
  - Batch data transmission

- **Error Handling**
  - Gracefully handle network failures
  - Implement retry logic with backoff
  - Log errors in QA mode only

- **Code Style**
  - Use ESLint and Prettier configurations
  - Follow existing naming conventions
  - Keep functions focused and small

### Don'ts ❌

- **Breaking Changes**
  - Don't modify public API without major version bump
  - Don't change existing event data structures
  - Don't remove configuration options

- **Performance Anti-patterns**
  - Don't create memory leaks
  - Don't block the main thread
  - Don't send excessive network requests

- **Security**
  - Don't expose sensitive data in events
  - Don't trust user input without sanitization
  - Don't log sensitive information

- **Browser Compatibility**
  - Don't use modern APIs without polyfills
  - Don't assume specific browser features
  - Don't break on older browsers

## Key Concepts

### Event Processing Pipeline

1. **Capture** - Handlers detect user interactions
2. **Validation** - Check event validity and sampling
3. **Deduplication** - Remove duplicate events within threshold
4. **Enrichment** - Add metadata, UTM params, tags, session_end_reason
5. **Filtering** - Apply URL exclusions and IP filtering
6. **Queuing** - Add to local event queue
7. **Batching** - Group events for transmission
8. **Sending** - Progressive fallback: sendBeacon → synchronous XHR → async fetch

### Configuration Management

Configuration is fetched from the TraceLog API and includes:
- Project settings (ID, allowed domains)
- Sampling rates
- URL exclusions
- IP exclusions
- Tag definitions
- Integration settings

### State Management

The `StateManager` class provides a centralized state system:
```typescript
// Getting state
const config = this.get('config');
const userId = this.get('userId');

// Setting state
this.set('sessionId', newSessionId);
this.set('pageUrl', currentUrl);
```

### Event Deduplication

Events are deduplicated based on:
- Event type
- Timestamp threshold (default: 1000ms)
- Event-specific data (coordinates for clicks, depth for scroll, etc.)

## Common Patterns

### Handler Implementation

```typescript
export class CustomHandler {
  constructor(private eventManager: EventManager) {}

  startTracking(): void {
    // Add event listeners
    document.addEventListener('customevent', this.handleEvent);
  }

  stopTracking(): void {
    // Remove event listeners
    document.removeEventListener('customevent', this.handleEvent);
  }

  private handleEvent = (event: CustomEvent): void => {
    this.eventManager.track({
      type: EventType.CUSTOM,
      custom_event: {
        name: event.type,
        metadata: event.detail
      }
    });
  }
}
```

### Manager Pattern

```typescript
export class CustomManager extends StateManager {
  constructor(private dependency: SomeDependency) {
    super();
  }

  public performAction(): void {
    const config = this.get('config');
    // Implementation
  }
}
```

## Build and Development

### Available Scripts

```bash
# Development
npm run build          # TypeScript compilation
npm run build:esm      # ES modules build
npm run build:cjs      # CommonJS build
npm run build:browser  # Browser build with Vite

# Quality Assurance
npm run lint           # ESLint checking
npm run format         # Prettier formatting
npm run check          # Run both lint and format check

# Testing
npm run test:e2e       # E2E tests with Playwright
npm run serve:test     # Test server for E2E tests
```

### Development Environment

1. **Local Testing**: Use `npm run serve:test` to serve test fixtures
2. **E2E Testing**: Playwright tests simulate real browser interactions
3. **Build Validation**: Test both ESM and CJS builds
4. **Format/Lint**: Must pass before commits (enforced by Husky)

## Integration Points

### With Middleware
- Sends data to `{project-id}.tracelog.io` subdomain
- Progressive sending strategy: sendBeacon → synchronous XHR → async fetch
- Handles network failures with retry logic

### With Google Analytics
- Optional integration via configuration
- Forwards custom events to GA4
- Maintains separate tracking instances

### Browser APIs Used
- `navigator.sendBeacon()` - Primary data transmission method
- `XMLHttpRequest` - Synchronous fallback for page unload scenarios
- `fetch()` - Asynchronous fallback for non-critical scenarios
- `localStorage` - Data persistence
- `sessionStorage` - Session management
- `Web Vitals API` - Performance metrics
- `IntersectionObserver` - Scroll tracking
- `MutationObserver` - DOM changes
- **Multi-Event Page Unload**: `beforeunload`, `pagehide`, `visibilitychange`

## Troubleshooting

### Common Issues

1. **Events not sending**
   - Check network connectivity
   - Verify project configuration
   - Check browser console for errors

2. **Duplicate events**
   - Review deduplication logic
   - Check timestamp thresholds
   - Verify event comparison functions

3. **Performance issues**
   - Check event queue size
   - Review handler debounce settings
   - Monitor memory usage

### Debug Mode

Enable QA mode for detailed logging:
```typescript
await TraceLog.init({
  id: 'project-id',
  qaMode: true // Enables debug logging
});
```

## Best Practices for LLM Development

1. **Understand the context** - Review existing patterns before making changes
2. **Test thoroughly** - Use E2E tests to validate functionality
3. **Consider performance** - Web analytics should not impact user experience
4. **Maintain compatibility** - Consider backward compatibility for API changes
5. **Follow conventions** - Use existing code style and patterns
6. **Document changes** - Update relevant documentation when making modifications

## File Structure Reference

```
src/
├── app.ts                 # Main application class
├── public-api.ts          # Public API exports
├── constants/             # Application constants
├── handlers/              # Event capture handlers
├── integrations/          # Third-party integrations
├── listeners/             # Event listeners
├── managers/              # Core business logic
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```
