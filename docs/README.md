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
Floating panel showing live TraceLog activity:
- Event queue status and count
- Event type badges (PAGE_VIEW, CLICK, SCROLL, CUSTOM, SESSION_START, etc.)
- Detailed event inspection
- Last sent timestamp

### TraceLog Integration
Uses public API exactly as production would:

```javascript
// 1. Setup listeners BEFORE init (to capture SESSION_START, PAGE_VIEW)
window.tracelog.on('event', (eventData) => console.log('Event:', eventData));
window.tracelog.on('queue', (data) => console.log('Queue:', data));

// 2. Initialize (standalone mode - no backend required)
await window.tracelog.init();

// 3. Send custom events
window.tracelog.event('add_to_cart', {
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

## Usage

### Development Testing
```bash
npm run docs:dev           # Start playground
npm run test:e2e           # Run E2E tests against playground
```

### Configuration Options
```javascript
await window.tracelog.init({
  sessionTimeout: 1800000,
  globalMetadata: { env: 'playground', version: '2.0' },
  sensitiveQueryParams: ['token', 'api_key'],
  samplingRate: 1.0,
  errorSampling: 1.0,
  viewport: {
    selectors: ['.product-card', '.cta-button'],
    threshold: 0.5,      // 50% visible
    minDwellTime: 1000   // 1 second
  }
});
```

### Backend Integration (Optional)
```javascript
// TraceLog SaaS
await window.tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' }
  }
});

// Custom backend
await window.tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'http://localhost:8080/collect',
      allowHttp: true // Dev only
    }
  }
});

// Google Analytics
await window.tracelog.init({
  integrations: {
    googleAnalytics: { measurementId: 'G-XXXXXXXXXX' }
  }
});
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

---

**Last Updated**: January 2025
**Compatibility**: Modern browsers (ES6+, Fetch API, LocalStorage)
