# TraceLog Playground - Realistic Demo Environment

Interactive playground demonstrating TraceLog in a **realistic production-like environment**.

## 🎯 Purpose

- **Realistic Demo**: Showcases how TraceLog works in a real e-commerce website
- **Development Testing**: Quick manual testing during feature development
- **Documentation**: Live examples of TraceLog capabilities
- **Visual Debugging**: Real-time event monitoring with floating monitor

## 🚀 Quick Start

```bash
# Build and start playground
npm run playground:dev

# Or step by step:
npm run playground:setup    # Build library and copy to playground
npm run serve              # Start HTTP server on port 3000
```

**URL**: http://localhost:3000

## 🛍️ What's Included

### Realistic E-commerce SPA: TechShop

A fully functional single-page application simulating a real tech store:

- **Product Catalog**: 6 products with images, prices, descriptions
- **Shopping Cart**: Add/remove items with visual feedback
- **Multi-page Navigation**: Home, Products, About, Contact (SPA routing)
- **Contact Form**: Form submission with validation
- **Responsive Design**: Works on desktop, tablet, mobile

### TraceLog Integration (Production-Like)

The playground uses TraceLog **exactly as a real client would**:

```javascript
// 1. Setup event listeners BEFORE initialization (to capture initial events)
window.tracelog.on('event', (event) => {
  console.log('Event captured:', event);
});

window.tracelog.on('queue', (queue) => {
  console.log('Events queued:', queue);
});

// 2. Initialize in standalone mode (no backend)
await window.tracelog.init({});

// 3. Send custom events
window.tracelog.event('add_to_cart', {
  product_id: '1',
  product_name: 'Laptop Pro M2',
  timestamp: Date.now()
});
```

**Important**: Listeners should be registered **before** `init()` to capture initial events like `SESSION_START` and `PAGE_VIEW`. TraceLog buffers listeners registered before initialization and attaches them during the init process.

### Real-time Event Monitor

Floating monitor showing live TraceLog activity:

```
┌─────────────────────────────────┐
│ TraceLog        Queue: 3     ▶️ │
├─────────────────────────────────┤
│ [PAGE_VIEW]  12:34:56.789    ✓ │
│ [CLICK]      12:34:57.123    ✓ │
│ [CUSTOM]     12:34:58.456    ⏳ │
└─────────────────────────────────┘
```

**Monitor States:**
- **▶️** - Queue processing
- **✓** - Event sent successfully
- **⏳** - Event pending in queue
- **❌** - Send error

**Event Type Badges:**
- `PAGE_VIEW` - Blue (navigation)
- `CLICK` - Green (interactions)
- `SCROLL` - Cyan (scroll tracking)
- `CUSTOM` - Purple (custom events)
- `SESSION_START` - Yellow (session lifecycle)
- `WEB_VITALS` - Pink (performance metrics)
- `ERROR` - Red (error tracking)

## 🔧 Realistic User Flows

### 1. Shopping Journey

```
Home Page → Browse Products → Add to Cart → View Cart → Contact Support
```

**Events Generated:**
- `page_view` - Initial page load
- `page_view` - Navigate to products
- `click` - Product card click
- `custom: add_to_cart` - Add item with product metadata
- `page_view` - Navigate to contact
- `custom: contact_form_submit` - Form submission

### 2. Product Discovery

```
Products Page → Scroll Products → Click Product → Add Multiple Items
```

**Events Generated:**
- `page_view` - Products page
- `scroll` - Scroll depth tracking
- `click` - Product interactions
- Multiple `custom: add_to_cart` events with different products

### 3. Contact Flow

```
Navigate to Contact → Fill Form → Submit → Success Feedback
```

**Events Generated:**
- `page_view` - Contact page navigation
- `click` - Form field interactions
- `custom: contact_form_submit` - Form data with email, message

## 📊 Monitored Events

### Automatic Events

TraceLog captures these automatically:

- **Page Views**: SPA navigation with hash routing (`#productos`, `#contacto`)
- **Clicks**: Interactive elements (buttons, links, nav items)
- **Scrolls**: Scroll depth percentage and engagement
- **Sessions**: Session start/end with cross-tab sync
- **Performance**: Web Vitals (LCP, INP, CLS)
- **Errors**: JavaScript errors with stack traces

### Custom Business Events

Playground implements realistic custom events:

```javascript
// E-commerce: Add to cart
tracelog.event('add_to_cart', {
  product_id: '1',
  product_name: 'Laptop Pro M2',
  timestamp: Date.now()
});

// Contact: Form submission
tracelog.event('contact_form_submit', {
  name: 'Juan Pérez',
  email: 'juan@example.com',
  message: 'Product inquiry...'
});
```

## 🧪 Development & Testing

### Manual Testing

1. Open playground: `npm run playground:dev`
2. Interact with UI (clicks, navigation, forms)
3. Watch events in floating monitor
4. Check browser console for TraceLog logs

### Integration with E2E Tests

The playground serves as the test environment for Playwright E2E tests:

```bash
# Run E2E tests against playground
npm run test:e2e

# Specific test
npm run test:e2e -- --grep "navigation flow"
```

**How it works:**
- Tests navigate to playground (`http://localhost:3000`)
- TraceLog `__traceLogBridge` is available (injected by Vite in dev builds)
- Tests interact with UI and verify events via bridge API
- Playground behaves **identically** for manual use and automated tests

### Browser Console

Monitor TraceLog activity:

```javascript
// Check TraceLog instance
console.log(window.tracelog);

// Listen to events (setup BEFORE init to capture initial events)
window.tracelog.on('event', console.log);
window.tracelog.on('queue', console.log);

// Initialize
await window.tracelog.init({});

// Check initialization status
window.tracelog.isInitialized(); // true/false
```

## 🎨 Design Philosophy

### Production-First

The playground **simulates a real production environment**:

- ✅ Uses only public TraceLog API (`window.tracelog`)
- ✅ Standard initialization (standalone mode by default)
- ✅ No test-specific code or conditional behavior
- ✅ Realistic user interactions and business logic
- ✅ Production-quality HTML/CSS/JavaScript

### Debugging-Friendly

While realistic, it includes helpful development tools:

- ✅ Floating event monitor (like DevTools)
- ✅ Console logging for visibility
- ✅ `data-testid` attributes for testing (common in production)
- ✅ Clear visual feedback for actions

## 📚 Use Cases

### 1. Feature Development

Test new TraceLog features in realistic context:

```javascript
// Test new API feature
await tracelog.init({
  sessionTimeout: 1800000,
  globalMetadata: { version: '2.0', env: 'playground' }
});
```

### 2. Demo for Stakeholders

Show TraceLog capabilities to clients/team:

- Navigate through realistic e-commerce flows
- Show real-time event capture
- Demonstrate session management
- Display performance tracking

### 3. Documentation Examples

Playground serves as live documentation:

- **README examples**: Copy patterns from playground
- **Integration guides**: Reference real implementation
- **API documentation**: Show real usage

### 4. Debugging Issues

Reproduce and debug issues in controlled environment:

- Consistent setup
- Visual feedback
- Isolated from real app complexity
- Easy to modify and test fixes

## 🔍 Technical Details

### Architecture

```
┌──────────────┐
│   Browser    │
│  localhost   │
└──────┬───────┘
       │
       │ window.tracelog API
       ↓
┌──────────────────────────────────┐
│      TraceLog Client             │
│  • EventManager                  │
│  • SessionHandler                │
│  • PerformanceHandler            │
└──────┬───────────────────────────┘
       │
       │ Events: 'event', 'queue'
       ↓
┌──────────────────────────────────┐
│   Playground Monitor             │
│   • Visual event queue           │
│   • Real-time status             │
│   • Event inspection             │
└──────────────────────────────────┘
```

### Files

- `index.html` - E-commerce UI (TechShop)
- `style.css` - Responsive styling (~900 lines)
- `script.js` - App logic + TraceLog integration
- `tracelog.js` - TraceLog library (copied from build)

### Build Process

```bash
# 1. Build TraceLog library
npm run build:browser

# 2. Copy to playground
cp dist/browser/tracelog.js playground/tracelog.js

# 3. Start server
npm run serve

# All in one:
npm run playground:dev
```

## ⚠️ Important Notes

### Standalone Mode

By default, playground runs in **standalone mode**:

- No backend required
- Events processed locally
- No network requests
- Perfect for testing client-side logic

To test with backend integration:

```javascript
// Modify script.js initializeApp()
await tracelog.init({
  integrations: {
    custom: { apiUrl: 'http://localhost:8080' }
  }
});
```

### Test Bridge Compatibility

While the playground uses **only public API**, E2E tests can access `__traceLogBridge`:

- Bridge is injected by Vite (not by playground code)
- Available in development builds (`NODE_ENV=dev`)
- Tests use bridge for internal state access
- Playground remains production-realistic

### Data Persistence

Events are **not persisted** between page reloads:

- TraceLog `localStorage` keys (prefixed with `tracelog_`) are removed before initialization (demo mode only)
- Ensures fresh sessions on every page load for consistent demo experience
- Session always starts with `SESSION_START` event
- Event queue clears on refresh
- Mirrors real user first visit
- **Preserves other localStorage data** from other applications on the same domain

**Note**: In production environments, TraceLog naturally persists sessions in localStorage for session recovery. The playground removes these keys to ensure predictable demo behavior and to guarantee `SESSION_START` events are visible.

## 🚧 Troubleshooting

### TraceLog not initializing

```bash
# Check build exists
ls -la playground/tracelog.js

# Rebuild if missing
npm run playground:setup
```

### Events not appearing

- Check browser console for errors
- Verify TraceLog initialized: `window.tracelog.isInitialized()`
- Ensure listeners were set up **before** `init()` to capture initial events
- Check monitor is visible (should always be visible)

### Monitor not updating

- Monitor updates in real-time
- Click events to expand details
- Clear button to reset monitor

## 📖 Related Resources

- **Main README**: [/README.md](../README.md)
- **Library Docs**: [/CLAUDE.md](../CLAUDE.md)
- **E2E Testing**: [/tests/TESTING_GUIDE.md](../tests/TESTING_GUIDE.md)
- **API Reference**: Check source code in `/src/api.ts`

---

**Last Updated**: January 2025
**Purpose**: Production-realistic demo environment
**Compatibility**: E2E tests via `__traceLogBridge` (Vite-injected)
