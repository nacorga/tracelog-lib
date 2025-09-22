# TraceLog Library Logging System

## Overview

Dual output system: console logs for runtime debugging, events for E2E testing. Both outputs respect the same mode-based filtering.

## Output Behavior

**Environment determines output method:**
- **`NODE_ENV=dev`**: Dispatches `tracelog:log` events to `window`
- **Other environments**: Writes to browser console

**Mode determines visibility:**
- **None**: No logs
- **`qa`**: CLIENT_ERROR, CLIENT_WARN, INFO only
- **`debug`**: All log levels

## Log Levels

**Client-Facing:** CLIENT_ERROR, CLIENT_WARN, INFO
**Internal Library:** ERROR, WARN, DEBUG, VERBOSE

## Usage

```typescript
import { debugLog } from '@/utils/logging';

// Client configuration issues
debugLog.clientError('ConfigManager', 'Invalid session timeout', { provided, min });
debugLog.clientWarn('ScrollHandler', 'Invalid CSS selector', { selector });

// Internal library issues
debugLog.error('SessionManager', 'Session state corrupted', { sessionId });
debugLog.warn('SenderManager', 'Failed to send events', { error, retryCount });

// General information
debugLog.info('App', 'Library initialized', { projectId, mode });
debugLog.debug('PerformanceHandler', 'Web Vitals loaded', { version });
```

## Configuration

**Mode Source**: Server configuration or SpecialProjectId override (not client-configurable).

```typescript
// ✅ Correct
await TraceLog.init({ id: 'project-id' });

// ✅ Testing (forces debug mode)
await TraceLog.init({ id: SpecialProjectId.HttpSkip });

// ❌ Wrong - mode not in AppConfig
await TraceLog.init({ id: 'project-id', mode: 'debug' });
```

**SpecialProjectId Behavior:**
- `HttpSkip`: No HTTP + debug mode (E2E testing)
- `HttpLocal`: Local HTTP + debug mode (development)

## Event Structure (NODE_ENV=dev)

```typescript
window.addEventListener('tracelog:log', (event) => {
  // { timestamp, level, namespace, message, data? }
});
```