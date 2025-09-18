# TraceLog SDK Logging System

## Overview

The TraceLog SDK uses a dual logging system to separate client-facing errors from internal SDK errors, ensuring clients only see relevant configuration issues in QA mode.

## Logging Modes

| Mode | Visible Logs | Purpose |
|------|--------------|---------|
| `production` | None | Production use - no debug output |
| `qa` | `INFO`, `CLIENT_WARN`, `CLIENT_ERROR` | Client testing - only configuration errors |
| `debug` | All levels | Developer debugging - includes internal SDK errors |

## Log Levels

### Client-Facing (Visible in QA mode)
- **`CLIENT_ERROR`**: Configuration/usage errors by the client
- **`CLIENT_WARN`**: Configuration/usage warnings by the client
- **`INFO`**: General operational information

### Internal SDK (Debug mode only)
- **`ERROR`**: Internal SDK errors
- **`WARN`**: Internal SDK warnings
- **`DEBUG`**: Strategic debug information
- **`VERBOSE`**: Detailed trace information

## Usage

### Import
```typescript
import { debugLog } from '@/utils/logging';
```

### Client Configuration Errors
Use when the client has provided invalid configuration or usage:

```typescript
// Invalid CSS selector from client config
debugLog.clientWarn('ScrollHandler', `Invalid CSS selector: "${selector}"`, error);

// Missing required configuration
debugLog.clientError('EventManager', 'Project ID is required', { config });
```

### Internal SDK Issues
Use for internal SDK problems that clients cannot control:

```typescript
// Network failure
debugLog.warn('SenderManager', 'Failed to send events', { error, retryCount });

// Internal state corruption
debugLog.error('SessionManager', 'Session state corrupted', { sessionId });
```

### General Information
Use for operational status that helps with debugging:

```typescript
// Successful operations
debugLog.info('SessionHandler', 'Session started', { sessionId, projectId });

// Feature availability
debugLog.debug('PerformanceHandler', 'Web Vitals library loaded', { version });
```

## Best Practices

### ✅ Do
- Use `clientWarn`/`clientError` for configuration issues
- Use `warn`/`error` for internal SDK problems
- Include relevant context data in logs
- Use appropriate namespaces (handler/manager names)

### ❌ Don't
- Log sensitive information (API keys, user data)
- Use client-facing logs for internal SDK issues
- Spam logs with high-frequency events
- Mix client errors with internal errors

## Examples

```typescript
// ✅ Client configuration error
debugLog.clientError('ConfigManager', 'Invalid session timeout value', {
  provided: config.sessionTimeout,
  min: MIN_SESSION_TIMEOUT_MS
});

// ✅ Internal SDK warning
debugLog.warn('EventManager', 'Event queue near capacity', {
  queueLength: this.eventsQueue.length,
  maxLength: MAX_EVENTS_QUEUE_LENGTH
});

// ✅ Operational info
debugLog.info('App', 'TraceLog SDK initialized', {
  projectId,
  mode: config.mode
});
```

## Configuration

The logger is automatically configured based on the SDK's `mode` setting:

```typescript
await TraceLog.init({
  id: 'project-id',
  mode: 'qa'        // Client will only see configuration errors
});

await TraceLog.init({
  id: 'project-id',
  mode: 'debug'     // Developers see all logs including internal errors
});
```