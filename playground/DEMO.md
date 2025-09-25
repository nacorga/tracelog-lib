# TraceLog Playground - Interactive Demo

Interactive playground to test and demonstrate TraceLog functionalities in real-time.

## 🎯 Purpose

- **Development**: Quick testing of features during development
- **Demo**: Showcase TraceLog capabilities to stakeholders
- **Debugging**: Visualize events and behaviors in real-time
- **E2E Tests**: Foundation for automated tests with Playwright

## 🚀 Quick Start

```bash
# Start playground with automatic build and server
npm run playground:dev

# Server only (requires manual build first)
npm run serve

# Build only without server
npm run playground:setup
```

**URL**: http://localhost:3000

### Available Modes

- **Normal Demo**: Full visualization with monitor
- **E2E Test**: Auto-detection, hidden monitor, automatic events
- **QA Mode**: Extended debugging with detailed logs

## ⚙️ Configuration

### Default Initialization

```javascript
// Auto-initialization in demo mode (sends events to local API)
await TraceLog.init({
  id: 'localhost:3002',  // Local API (if available)
});

// E2E/Testing mode (no HTTP calls - uses SpecialProjectId.Skip)
await TraceLog.init({
  id: 'skip', // Doesn't send events, only simulates
});
```

### Automatic Detection

The playground automatically detects:

- **E2E Mode**: Playwright, HeadlessChrome, URL param `?e2e=true`
- **Test Mode**: URL param `?mode=test`
- **Scenarios**: URL param `?scenario=basic|navigation|ecommerce`
- **Project ID**: URL param `?project-id=custom-id` (default: 'playground-test-project')

### Bridge API Consistency

Usa `__traceLogBridge` consistentemente:
```javascript
// Unified helper
function getTraceLogInstance() {
  return window.__traceLogBridge || window.TraceLog;
}

// Event sending
function sendTraceLogEvent(name, data) {
  const traceLog = getTraceLogInstance();
  return traceLog?.sendCustomEvent(name, data);
}
```

## 📊 Event Monitor

### Monitor View

```
┌─────────────────────────────────┐
│ TraceLog Monitor        Limpiar │
├─────────────────────────────────┤
│ Cola: 3                      ▶️ │
├─────────────────────────────────┤
│ [CLICK]              ✓          │
│ [PAGE_VIEW]          ✓          │
│ [SCROLL]             ⏳         │
└─────────────────────────────────┘
```

### Monitor States

- **▶️** - Queue processing normally
- **✓** - Event sent successfully
- **⏳** - Event pending in queue
- **🔄** - Retrying send
- **❌** - Send error

### Event Badges

- `PAGE_VIEW` - Blue (navigation)
- `CLICK` - Green (interaction)
- `SCROLL` - Cyan (scroll)
- `CUSTOM` - Purple (custom events)
- `SESSION_START` - Yellow (session start)
- `WEB_VITALS` - Pink (metrics)
- `ERROR` - Red (errors)

## 🛍️ E-commerce Simulation

### Available Features

- **SPA Navigation**: `home` → `products` → `about` → `contact`
- **Add to Cart**: Buttons with product tracking
- **Form Submit**: Contact form with validation
- **Custom Events**: Business-specific events

### Generated Events

```javascript
// Automatic navigation
{ type: 'PAGE_VIEW', page_url: '#products' }

// Product interaction
{
  type: 'CUSTOM',
  custom_event: {
    name: 'add_to_cart',
    metadata: { product_id: '1', product_name: 'Laptop Pro M2' }
  }
}

// Contact form
{
  type: 'CUSTOM',
  custom_event: {
    name: 'contact_form_submit',
    metadata: { name: 'John', email: 'john@email.com' }
  }
}
```

## 🧪 Testing and Debugging

### Available Global Functions

```javascript
// Helpers de testing (disponibles en window.testHelpers)
window.testHelpers.sendCustomEvent('test_event', { key: 'value' });
```

### Bridge Testing Methods

When `NODE_ENV=dev`, the `__traceLogBridge` includes:

```javascript
const bridge = window.__traceLogBridge;

// State information
bridge.getAppInstance()        // App instance with initialized flag
bridge.getSessionData()        // session info
bridge.getQueueLength()        // pending events

// Testing helpers
bridge.sendCustomEvent(name, data)  // send custom event
bridge.setSessionTimeout(ms)        // configure timeout
bridge.isTabLeader?.()              // tab leadership
```

### Console Integration

```javascript
// Listen to TraceLog events
window.addEventListener('tracelog:log', (event) => {
  const { namespace, message, data } = event.detail;
  console.log(`[${namespace}] ${message}`, data);
});
```

## 🎬 Testing Flow

### 1. Manual Testing

1. Open playground at http://localhost:3000
2. Interact with elements (clicks, navigation, forms)
3. Observe events in real-time monitor
4. Verify logs in browser console

### 2. Automated Testing (E2E)

```bash
# Run E2E tests that use the playground
npm run test:e2e

# Only a specific test
npm run test:e2e -- --grep "should initialize successfully"
```

Tests automatically:
- Detect E2E mode (hide monitor)
- Use `__traceLogBridge` for consistent access
- Utilize traceLogTest fixtures
- Apply custom matchers like toHaveNoTraceLogErrors()

### 3. Scenario Testing

```javascript
// URL params for specific testing
http://localhost:3000?scenario=basic        // Basic click
http://localhost:3000?scenario=navigation   // Page navigation
http://localhost:3000?scenario=ecommerce    // Add to cart
```

## ✨ Playground Advantages

### Development
✅ **Hot Reload** - Instant changes with `npm run playground:dev`
✅ **Bridge Consistency** - Uses `__traceLogBridge` like tests
✅ **Visual Feedback** - Real-time event monitor
✅ **Multiple Scenarios** - Automated testing of different cases

### Testing
✅ **E2E Ready** - Foundation for Playwright tests
✅ **Cross-browser** - Works on Chrome, Firefox, Safari
✅ **Auto-detection** - E2E mode without manual configuration
✅ **Clean State** - Each reload starts clean

### Debugging
✅ **Console Integration** - `tracelog:log` events available
✅ **Queue Visibility** - Event queue monitor
✅ **Error Tracking** - Captures and displays errors
✅ **Session Management** - Session state visualization

## 🏗️ Playground Architecture

```
┌──────────────┐
│   Browser    │
│  (localhost) │
└──────┬───────┘
       │
       │ __traceLogBridge API
       ↓
┌──────────────────────────────────┐
│      TraceLog Client             │
│  • EventManager                  │
│  • SessionHandler                │
│  • PerformanceHandler            │
└──────┬───────────────────────────┘
       │
       │ Events: tracelog:log
       ↓
┌──────────────────────────────────┐
│   Playground Monitor             │
│   • Visual event queue           │
│   • Real-time status             │
│   • Error visualization          │
└──────────────────────────────────┘
```

## 🔧 Troubleshooting

### Playground won't load
```bash
# Rebuild and restart
npm run playground:setup
npm run serve

# Or all together
npm run playground:dev
```

### Events don't appear in monitor
- **E2E Mode**: Monitor hidden by design
- **JS Errors**: Check browser console
- **Bridge Missing**: Verify that `NODE_ENV=dev` in build
- **Project ID**: If using 'skip', events aren't sent (only simulated)

### Bridge not available
```javascript
// Debug in console
console.log(window.__traceLogBridge);  // should exist
console.log(window.TraceLog);          // fallback
```

### E2E tests fail
1. Verify playground is on port 3000
2. Build must be `NODE_ENV=dev` to have bridge
3. Tests use `traceLogTest` fixtures and custom matchers
4. Use `SpecialProjectId.Skip` ('skip') for tests without HTTP calls

## 📚 Related Resources

- **E2E Tests**: `tests/E2E_TESTING_GUIDE.md` - Testing framework guide
- **Fixtures**: `tests/fixtures/tracelog-fixtures.ts` - TraceLogTestPage class
- **Matchers**: `tests/matchers/tracelog-matchers.ts` - Custom assertions
- **Source code**: `playground/script.js` - Playground logic
- **Build config**: `vite.config.ts` - Build configuration
- **Test bridge**: `src/types/window.types.ts` - Bridge definition
- **Event types**: `src/types/event.types.ts` - Event types
- **API types**: `src/types/api.types.ts` - SpecialProjectId enum