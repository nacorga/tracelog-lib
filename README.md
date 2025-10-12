# TraceLog Playground

> 🌐 **[Live Demo](https://nacorga.github.io/tracelog-lib/)** - Try it online without installation

Interactive e-commerce demo (TechShop) showcasing TraceLog in a production-like environment with real-time event monitoring.

## Quick Start

```bash
npm run docs:dev    # Build + start server on port 3000
```

Open `http://localhost:3000`

## What's Included

### E-commerce SPA (TechShop)
- Product catalog with 6 items
- Shopping cart with add/remove functionality
- Multi-page navigation (Home, Products, About, Contact)
- Contact form with validation
- Responsive design

### Real-time Event Monitor
Floating panel (bottom-right corner) showing live TraceLog activity:

**Display Elements:**
- **Queue Status**: Real-time processing state (⏸ idle, 📥 collecting, ⏳ queued, 📤 sending, ✅ sent, ❌ error)
- **Queue Count**: Number of events pending transmission
- **Event List**: Last 50 events with type badges and timestamps
- **Last Sent**: Time elapsed since last batch transmission

**Interaction:**
- Click header to minimize/expand panel
- Click any event to view full JSON payload
- Click × button to clear all events from monitor

### TraceLog Integration
Uses public API exactly as production would:

```javascript
// 1. Setup listeners BEFORE init (to capture SESSION_START, PAGE_VIEW)
tracelog.on('event', (eventData) => console.log('Event:', eventData));
tracelog.on('queue', (data) => console.log('Queue:', data));

// 2. Initialize (standalone mode - no backend required)
await tracelog.init();

// 3. Send custom events
tracelog.event('add_to_cart', {
  product_id: '1',
  product_name: 'Laptop Pro M2'
});
```

## Tracked Events

**Automatic:**
- Page views (SPA navigation with hash routing)
- Clicks (buttons, links, nav items)
- Scrolls (depth percentage)
- Viewport visibility (elements entering viewport with dwell time)
- Sessions (start/end with cross-tab sync)
- Web Vitals (LCP, INP, CLS)
- Errors (with stack traces)

**Custom:**
- `add_to_cart` - Product additions with metadata
- `contact_form_submit` - Form submissions with user data

## Standalone vs Integration Modes

**Standalone Mode (Default):**
```javascript
// No integration config = local-only operation
await tracelog.init();
// ✅ Events emitted locally via on('event')
// ❌ No network requests
```

**With Backend Integration:**
```javascript
// Events sent to backend AND emitted locally
await tracelog.init({
  integrations: { tracelog: { projectId: 'your-id' } }
});
// ✅ Events emitted locally via on('event')
// ✅ Events sent to TraceLog backend
```

## Usage

### Development Testing
```bash
npm run docs:dev           # Start playground
npm run test:e2e           # Run E2E tests against playground
```

### Configuration Options

```javascript
await tracelog.init({
  // Session & Sampling
  sessionTimeout: 1800000,
  globalMetadata: { env: 'playground', version: '2.0' },
  sensitiveQueryParams: ['token', 'api_key'],
  samplingRate: 1.0,
  errorSampling: 1.0,

  // Event Rate Control
  pageViewThrottleMs: 1000,        // Throttle rapid navigation (default: 1s)
  clickThrottleMs: 300,             // Throttle clicks per element (default: 300ms)
  maxSameEventPerMinute: 60,        // Limit same custom event name (default: 60)

  // Viewport Tracking
  viewport: {
    elements: [
      { selector: '.hero', id: 'hero-section', name: 'Hero Banner' },
      { selector: '.product-card', name: 'Product Cards' }
    ],
    threshold: 0.5,                  // Visibility threshold (50%)
    minDwellTime: 1000,              // Minimum visible time (1s)
    cooldownPeriod: 60000,           // Cooldown between triggers (60s)
    maxTrackedElements: 100          // Maximum tracked elements
  }
});
```

### Configuration Defaults

| Option | Default | Range/Type |
|--------|---------|------------|
| `sessionTimeout` | `900000` (15min) | 30s - 24h |
| `samplingRate` | `1.0` (100%) | 0 - 1 |
| `errorSampling` | `1.0` (100%) | 0 - 1 |
| `pageViewThrottleMs` | `1000` | 0+ |
| `clickThrottleMs` | `300` | 0+ |
| `maxSameEventPerMinute` | `60` | 1+ |
| `viewport.threshold` | `0.5` (50%) | 0 - 1 |
| `viewport.minDwellTime` | `1000` | 0+ |
| `viewport.cooldownPeriod` | `60000` (60s) | 0+ |
| `viewport.maxTrackedElements` | `100` | 1+ |

### Backend Integration (Optional)

> **Note**: Playground runs in standalone mode by default (no backend). Examples below show optional integration configurations.

```javascript
// TraceLog SaaS
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' }
  }
});

// Custom backend
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'http://localhost:8080/collect',
      allowHttp: true // Dev only
    }
  }
});

// Google Analytics
await tracelog.init({
  integrations: {
    googleAnalytics: { measurementId: 'G-XXXXXXXXXX' }
  }
});
```

## QA Mode

Enable debug mode with URL parameter for enhanced development experience:

```javascript
// Add ?tlog_mode=qa to URL
// http://localhost:3000?tlog_mode=qa
```

**QA Mode Features:**
- All events logged to browser console
- Custom event validation errors thrown (instead of silent fail)
- Detailed error messages for debugging
- Session state visible in console

**Usage:**
```bash
# Start playground in QA mode
open http://localhost:3000?tlog_mode=qa

# Or add to any URL
http://localhost:3000#productos?tlog_mode=qa
```

## Files

- `index.html` - E-commerce UI structure
- `style.css` - Responsive styling (~900 lines)
- `script.js` - App logic + TraceLog integration
- `tracelog.js` - Built library (copied from `dist/browser/`)

## Build Process

```bash
npm run build:browser:dev    # Build library (dev mode)
cp dist/browser/tracelog.esm.js docs/tracelog.js  # Copy to docs/
npm run serve                # Start HTTP server
```

## Key Features

### Intelligent Event Management
- **Smart throttling**: PAGE_VIEW (1s), CLICK (300ms), VIEWPORT (60s cooldown)
- **Per-event-name rate limiting**: Prevents infinite loops (60/minute configurable)
- **Per-session caps**: Limits total events per session with type-specific thresholds
- **Deduplication**: Fingerprint-based duplicate detection with LRU cache
- **Dynamic queue flush**: Automatic batching with immediate send at threshold
- **Web Vitals tracking**: Performance metrics with configurable thresholds
- **Error monitoring**: Automatic burst detection with cooldown protection

### Production-First Design
- Uses only public API (`window.tracelog`)
- No test-specific code in playground
- Realistic user interactions and flows
- Standard initialization patterns

### Standalone Mode
- No backend required by default
- Events processed locally
- No network requests
- Perfect for client-side testing

### E2E Test Compatibility
- Playground serves as test environment
- Tests access `__traceLogBridge` (Vite-injected in dev builds)
- Playground behaves identically for manual and automated use

### Data Reset
- Clears TraceLog `localStorage` keys on init (demo mode only)
- Ensures fresh sessions for predictable behavior
- Always shows `SESSION_START` event
- Preserves other domain localStorage data

## Troubleshooting

**TraceLog not initializing:**
```bash
npm run docs:setup    # Rebuild library and copy to docs/
```

**Events not appearing:**
- Check browser console for errors
- Verify `window.tracelog.isInitialized()` returns `true`
- Ensure listeners set up **before** `init()`
- Check sampling rates (default: 1.0 for both)

**Monitor not updating:**
- Click events to expand details
- Use clear button to reset
- Check console for TraceLog logs

## Use Cases

1. **Feature Development** - Test new TraceLog features in realistic context
2. **Stakeholder Demos** - Show capabilities in production-like environment
3. **Documentation** - Live examples for integration guides
4. **Debugging** - Reproduce issues in controlled setup
5. **E2E Testing** - Automated tests with Playwright

## Related Resources

- [Library Documentation](../README.md)
- [Testing Guide](../tests/TESTING_GUIDE.md)
