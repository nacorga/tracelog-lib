# API Reference

This document provides comprehensive documentation for the TraceLog client API.

## Table of Contents

- [Core Functions](#core-functions)
- [Types and Interfaces](#types-and-interfaces)
- [Configuration Options](#configuration-options)
- [Event Types](#event-types)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Core Functions

### `startTracking(id: string, config?: TracelogAppConfig): void`

Initializes the TraceLog client with the specified tracking ID and configuration.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for your tracking instance |
| `config` | `TracelogAppConfig` | No | Configuration options for the client |

#### Example

```typescript
import { startTracking } from '@tracelog/client';

// Basic initialization
startTracking('my-app-tracking-id');

// With configuration
startTracking('my-app-tracking-id', {
  sessionTimeout: 600000, // 10 minutes
  globalMetadata: {
    appVersion: '2.1.0',
    environment: 'production',
    userId: 'user-123'
  },
  scrollContainerSelectors: ['.scroll-container', '#main-content']
});
```

#### Behavior

- **Single Instance**: Only one tracking instance can be active at a time
- **Browser Only**: Works only in browser environments (window and document must exist)
- **Session Timeout Validation**: Minimum session timeout is 30 seconds
- **Automatic Session**: Creates a new session automatically upon initialization
- **Event Listeners**: Sets up automatic tracking for clicks, scrolls, and page visibility

#### Error Handling

```typescript
// The function will log errors to console but won't throw
startTracking('invalid-id', {
  sessionTimeout: 10000 // Will show warning: minimum is 30 seconds
});
```

---

### `sendCustomEvent(name: string, metadata?: Record<string, MetadataType>): void`

Sends a custom event with optional metadata to the tracking system.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Event name identifier (must be non-empty) |
| `metadata` | `Record<string, MetadataType>` | No | Additional data associated with the event |

#### Example

```typescript
import { sendCustomEvent } from '@tracelog/client';

// Simple event
sendCustomEvent('button_clicked');

// Event with metadata
sendCustomEvent('product_viewed', {
  productId: 'prod-123',
  category: 'electronics',
  price: 299.99,
  inStock: true,
  tags: ['featured', 'new']
});

// Complex event
sendCustomEvent('user_interaction', {
  action: 'form_submission',
  formId: 'contact-form',
  fields: ['name', 'email', 'message'],
  validationErrors: 0,
  timeToComplete: 45000
});
```

#### Behavior

- **Validation**: Automatically validates event name and metadata
- **Sanitization**: Cleans and validates metadata before sending
- **Async Processing**: Events are processed asynchronously without blocking
- **Error Resilience**: Invalid events are logged but don't break the application
- **Queue Management**: Events are queued and sent in batches for efficiency

#### Error Handling

```typescript
// Invalid events will be logged in QA mode
sendCustomEvent('', { data: 'value' }); // Empty name - will be rejected
sendCustomEvent('valid_event', { 
  invalid: undefined,  // Undefined values are filtered out
  valid: 'data'
});
```

## Types and Interfaces

### `TracelogAppConfig`

Configuration interface for initializing the client.

```typescript
interface TracelogAppConfig {
  sessionTimeout?: number;
  globalMetadata?: Record<string, MetadataType>;
  scrollContainerSelectors?: string | string[];
}
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sessionTimeout` | `number` | `900000` (15 min) | Session timeout in milliseconds (min: 30000) |
| `globalMetadata` | `Record<string, MetadataType>` | `undefined` | Metadata included with every event |
| `scrollContainerSelectors` | `string \| string[]` | `undefined` | CSS selectors for custom scroll containers |

### `MetadataType`

Allowed types for metadata values.

```typescript
type MetadataType = string | number | boolean | string[];
```

#### Examples

```typescript
const validMetadata: Record<string, MetadataType> = {
  stringValue: 'hello world',
  numberValue: 42,
  booleanValue: true,
  arrayValue: ['tag1', 'tag2', 'tag3']
};
```

### Event Data Types

The client automatically captures various types of events:

#### Click Events

```typescript
interface TracelogEventClickData {
  x: number;                              // Absolute X coordinate
  y: number;                              // Absolute Y coordinate
  relativeX: number;                      // Relative X (0-1)
  relativeY: number;                      // Relative Y (0-1)
  elementTag?: string;                    // HTML tag name
  elementId?: string;                     // Element ID
  elementClass?: string;                  // Element class names
  elementText?: string;                   // Element text content
  elementHref?: string;                   // Link href attribute
  elementTitle?: string;                  // Element title attribute
  elementAlt?: string;                    // Image alt attribute
  elementRole?: string;                   // ARIA role attribute
  elementAriaLabel?: string;              // ARIA label
  elementDataAttributes?: Record<string, string>; // Data attributes
}
```

#### Scroll Events

```typescript
interface TracelogEventScrollData {
  depth: number;                          // Scroll depth percentage (0-100)
  direction: 'up' | 'down';              // Scroll direction
}
```

#### Custom Events

```typescript
interface TracelogEventCustomData {
  name: string;                           // Event name
  metadata?: Record<string, MetadataType>; // Custom metadata
}
```

## Configuration Options

### Session Timeout

Controls how long a session remains active without user interaction.

```typescript
startTracking('my-id', {
  sessionTimeout: 300000 // 5 minutes
});
```

**Valid Range**: 30,000ms (30 seconds) to any positive number
**Default**: 900,000ms (15 minutes)

### Global Metadata

Metadata that gets attached to every event automatically.

```typescript
startTracking('my-id', {
  globalMetadata: {
    version: '1.0.0',
    environment: 'production',
    feature_flags: ['new_ui', 'enhanced_tracking']
  }
});
```

**Validation**: All values must be of type `MetadataType`
**Size Limit**: Maximum 10KB per metadata object

### Scroll Container Selectors

Custom CSS selectors for elements that should be tracked for scroll events.

```typescript
// Single selector
startTracking('my-id', {
  scrollContainerSelectors: '.main-content'
});

// Multiple selectors
startTracking('my-id', {
  scrollContainerSelectors: [
    '.main-content',
    '#sidebar',
    '.scroll-area'
  ]
});
```

## Event Types

The client automatically tracks several types of events:

### Automatic Events

- **PAGE_VIEW**: When a page loads or URL changes
- **CLICK**: User clicks on interactive elements
- **SCROLL**: User scrolls within tracked containers
- **SESSION_START**: When a new session begins
- **SESSION_END**: When a session ends (timeout, page unload, manual)

### Custom Events

- **CUSTOM**: Events sent via `sendCustomEvent()`

## Error Handling

### Initialization Errors

```typescript
// The client will handle these gracefully
startTracking(''); // Empty ID - logs error, doesn't initialize
startTracking('valid-id', {
  sessionTimeout: 1000 // Too short - logs warning, uses minimum
});
```

### Event Validation Errors

```typescript
// These will be logged in development/QA mode
sendCustomEvent(''); // Empty name
sendCustomEvent('valid', {
  invalidType: new Date() // Invalid metadata type
});
```

### Network Errors

The client handles network failures gracefully:
- Events are queued locally if sending fails
- Automatic retry with exponential backoff
- Persistent storage for critical events

## Best Practices

### 1. Initialize Early

```typescript
// Initialize as early as possible in your app
import { startTracking } from '@tracelog/client';

startTracking('your-id', config);
```

### 2. Use Meaningful Event Names

```typescript
// Good
sendCustomEvent('product_purchased', { productId: '123' });
sendCustomEvent('form_validation_error', { field: 'email' });

// Avoid
sendCustomEvent('event1', { data: 'something' });
sendCustomEvent('click', {}); // Too generic
```

### 3. Structure Metadata Consistently

```typescript
// Consistent naming and structure
sendCustomEvent('user_action', {
  action_type: 'button_click',
  element_id: 'subscribe-btn',
  section: 'hero',
  timestamp: Date.now()
});
```

### 4. Handle Sensitive Data

```typescript
// Don't include PII in metadata
sendCustomEvent('form_submitted', {
  form_type: 'contact',
  field_count: 5,
  // Don't include: email, name, personal info
});
```

### 5. Use Global Metadata for Common Properties

```typescript
startTracking('id', {
  globalMetadata: {
    app_version: '2.1.0',
    build_number: '145',
    environment: 'production'
  }
});
```

### 6. Test in Development

```typescript
// The client provides helpful logging in development
if (process.env.NODE_ENV === 'development') {
  // Events will be logged to console instead of sent
}
```

---

For more examples and advanced usage, see [EXAMPLES.md](./EXAMPLES.md). 