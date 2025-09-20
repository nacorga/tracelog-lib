# TraceLog Library Logging System

## Overview

Dual logging system that separates client configuration errors from internal library debugging, with mode-based filtering through the new StateManager architecture.

## Modes & Levels

| Mode | Visible Logs | Purpose |
|------|--------------|---------|
| `production` | None | Production - no debug output |
| `qa` | CLIENT_ERROR, CLIENT_WARN, INFO | Client testing - configuration errors only |
| `debug` | All levels | Developer debugging - includes internal errors |

**Client-Facing (QA mode):** CLIENT_ERROR, CLIENT_WARN, INFO
**Internal library (Debug only):** ERROR, WARN, DEBUG, VERBOSE

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

Mode is set during initialization and automatically detected by the logging system:

```typescript
await TraceLog.init({
  id: 'project-id',
  mode: 'qa'      // Shows only client-facing logs
});

await TraceLog.init({
  id: 'project-id',
  mode: 'debug'   // Shows all logs including internal library
});
```

## Best Practices

**✅ Do:** Use appropriate log levels, include context data, proper namespaces
**❌ Don't:** Log sensitive data, mix client/internal errors, spam high-frequency events

The logger extends StateManager for clean state access and automatic mode detection.