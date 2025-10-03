# TraceLog Library

A lightweight TypeScript library for web analytics and user behavior tracking. Automatically captures clicks, scrolls, page views, and performance metrics with cross-tab session management and privacy-first design.

## Features

- **Zero-config tracking** - Automatically captures clicks, scrolls, page navigation, and web vitals out of the box.
- **Cross-tab session management** - Maintains consistent user sessions across multiple browser tabs with automatic recovery.
- **Privacy-first** - Built-in PII sanitization, IP exclusion options, and configurable data sampling.
- **Framework agnostic** - Works with vanilla JS, React, Vue, Angular, or any web application.
- **Lightweight** - Only one dependency (`web-vitals`) with dual ESM/CJS support.
- **Event-driven** - Real-time event subscription with `on()` and `off()` methods for custom integrations.

## Installation

**Prerequisites**: Modern browser with ES6+ support. No server-side requirements.

## 📦 Which File Should I Use?

| Your Setup | File to Use | How to Use |
|-----------|-------------|------------|
| **npm/yarn** (React, Vue, Angular, etc.) | Automatic | `import { tracelog } from '@tracelog/lib'` |
| **HTML + `<script>` tag** | `tracelog.js` (IIFE) | `<script src="...tracelog.js"></script>` then use `tracelog.init()` |
| **HTML + `<script type="module">`** | `tracelog.esm.js` (ESM) | `import { tracelog } from '...tracelog.esm.js'` |

### Installation Methods

#### 1. NPM/Yarn (Recommended for Modern Apps)
```bash
npm install @tracelog/lib
```

```typescript
import { tracelog } from '@tracelog/lib';

tracelog.init({ id: 'your-project-id' });
tracelog.event('user_action', { data: 'example' });
```

**✅ Best for:** React, Vue, Angular, Next.js, Vite, webpack, or any bundler

---

#### 2. CDN - IIFE (Maximum Compatibility)
```html
<script src="https://cdn.jsdelivr.net/npm/@tracelog/lib@latest/dist/browser/tracelog.js"></script>
<script>
  // tracelog is available globally
  tracelog.init({ id: 'your-project-id' });
  tracelog.event('page_view');
</script>
```

**✅ Best for:** WordPress, static HTML, CMS, legacy browsers, no build step

---

#### 3. CDN - ES Module (Modern Only)
```html
<script type="module">
  import { tracelog } from 'https://cdn.jsdelivr.net/npm/@tracelog/lib@latest/dist/browser/tracelog.esm.js';

  await tracelog.init({ id: 'your-project-id' });
  tracelog.event('page_view');
</script>
```

**✅ Best for:** Modern browsers, no bundler, prefer native modules
**⚠️ Note:** Won't work in IE11 or older browsers

**Expected behavior**: Automatic tracking begins immediately. Check browser dev tools console for event logs (when `mode: 'qa'` or `mode: 'debug'`).

## Usage

**Basic tracking with configuration:**
```typescript
await tracelog.init({
  id: 'your-project-id',
  sessionTimeout: 30 * 60 * 1000 // 30 minutes
});
```

**Custom events with metadata:**
```typescript
tracelog.event('product_viewed', {
  productId: 'abc-123',
  category: 'electronics',
  price: 299.99,
  tags: ['featured', 'sale']
});
```

**Privacy-focused configuration:**
```typescript
await tracelog.init({
  id: 'your-project-id',
  sensitiveQueryParams: ['token', 'session_id'],
  excludedUrlPaths: ['/admin/*', '/internal'],
  errorSampling: 0.1 // Only sample 10% of errors
});
```

## API

**Core methods:**
- `init(config: AppConfig): Promise<void>` - Initialize tracking with project configuration.
- `event(name: string, metadata?: Record<string, MetadataType>): void` - Send custom event with optional metadata.
- `on(event: string, callback: Function): void` - Subscribe to events emitted by TraceLog.
- `off(event: string, callback: Function): void` - Unsubscribe from events emitted by TraceLog.
- `isInitialized(): boolean` - Check if the library has been initialized.
- `destroy(): Promise<void>` - Clean up all tracking and remove event listeners.

**Key configuration options:**
- `config.id`: Your unique project identifier (required).
- `config.sessionTimeout`: Session timeout in milliseconds (default: 15 minutes).
- `config.globalMetadata`: Metadata automatically attached to all events.
- `config.mode`: Logging mode controlling verbosity ('qa', 'debug', etc.).
- `config.samplingRate`: Event sampling rate between 0 and 1.
- `config.errorSampling`: Error event sampling rate between 0 and 1.
- `config.excludedUrlPaths`: URL path patterns to ignore during tracking.
- `config.sensitiveQueryParams`: Query parameters to remove before tracking URLs.
- `config.allowHttp`: Enable HTTP requests for testing environments.
- `config.scrollContainerSelectors`: Custom scroll containers to monitor.
- `config.integrations`: Third-party integration configurations.

**Metadata types:** `string | number | boolean | string[]`


## Configuration

**Disabling TraceLog:**
```typescript
// Set this flag before initialization to disable TraceLog completely
window.__traceLogDisabled = true;
```

**Environment-based settings:**
- Use `samplingRate: 0.1` to reduce data volume in high-traffic applications
- Configure `sessionTimeout` to match your application's user session length

**Event subscription**
```typescript
// Subscribe to individual events as they are tracked
tracelog.on('event', (eventData) => {
  console.log('Event tracked:', eventData.type, eventData);
});

// Subscribe to event queue batches being sent
tracelog.on('queue', (queueData) => {
  console.log('Events queued for sending:', queueData.events.length);
});
```

**Google Analytics integration:**
```typescript
await tracelog.init({
  id: 'your-project-id',
  integrations: {
    googleAnalytics: {
      measurementId: 'G-XXXXXXXXXX'
    }
  }
});
```

## Compatibility

- **Runtime**: Modern browsers (Chrome 60+, Firefox 55+, Safari 12+)
- **Module formats**: ESM, CommonJS
- **TypeScript**: Full type definitions included
- **Frameworks**: React, Vue, Angular, Svelte, vanilla JS

## Logging & Debug

**Development mode** → Set `NODE_ENV=dev` for event-based logging to `window` → Use browser console for runtime debugging.

**Log levels** → `qa` mode shows CLIENT_ERROR, CLIENT_WARN, INFO → `debug` mode shows all levels → Configure via `mode` parameter.

```typescript
// Enable debug logging
await tracelog.init({
  id: 'your-project-id',
  mode: 'debug' // or 'qa' for less verbose logging
});

// Debug logs are automatically shown in console based on mode
// No additional event listeners needed

// Check if library is initialized
if (tracelog.isInitialized()) {
  console.log('TraceLog is ready');
}
```

## CI/CD Integration

**Automated testing** → Validates library integrity before deployment → Detects critical issues early.

```bash
# Install and run tests
npm ci && npx playwright install --with-deps
npm run build:all
npm run test:e2e               # E2E tests for validation
```

**GitHub Actions** → Pre-configured workflows available:
- `health-check.yml` - Runs on PR and push
- `release-quality-gate.yml` - Validates releases

**Exit codes** → `0` = tests passed → `1` = critical issues detected

## Troubleshooting

**Session tracking issues** → Verify localStorage is available → Check for cross-tab conflicts → Review session timeout settings.

**High memory usage** → Reduce `sessionTimeout` → Lower `samplingRate` → Check for event listener leaks (call `destroy()` on cleanup).

**CI test failures** → Verify Playwright installation → Check Node.js ≥20 → Review test patterns.

## Development & Contributing

### Development Setup
```bash
git clone https://github.com/nacorga/tracelog-lib.git
cd tracelog-lib
npm install
npm run build:all      # Build ESM + CJS + Browser
npm run check          # Lint + format check
npm run test:e2e       # Run E2E tests
npm run test:unit      # Run unit tests
npm run test:coverage  # Run tests with coverage
```

### Development Workflow

This project uses a **branch protection strategy** to ensure code quality:

1. **Feature Development:**
   ```bash
   git checkout -b feature/your-feature-name
   # Make your changes
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

2. **Pull Request Process:**
   - Create PR to `main` branch
   - CI automatically runs all validations:
     - Security audit
     - Code quality (ESLint + Prettier)
     - Build integrity
     - E2E tests
   - PR cannot be merged until CI passes
   - Code review required

3. **Release Process:**
   - Once merged to `main`, code is validated and ready
   - Run Release workflow manually from GitHub Actions
   - Automatic version bump, changelog, and NPM publish

### Quality Standards
- **Code Quality**: ESLint + Prettier enforced in CI
- **Type Safety**: TypeScript strict mode required
- **Testing**: Unit tests with Vitest, E2E tests with Playwright for all features
- **Security**: Dependency vulnerability scanning
- **Coverage**: Comprehensive test coverage with automated reporting

## Versioning

Follows [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH). Breaking changes are documented in release notes with migration guides.

## Testing & Validation

Verify the installation works correctly:

### Quick Validation

Open DevTools Console and check for:
1. `[TraceLog:App] Initializing TraceLog` - Library loaded
2. `[TraceLog:SessionManager] Session started` - Session active
3. No errors or warnings
4. Events logged when you interact with the page

### Manual Test

```javascript
// Should work after installation
tracelog.init({
  id: 'skip',  // Use 'skip' for local testing
  mode: 'debug'  // Enables console logging
});

// Send a test event
tracelog.event('test_event', { foo: 'bar' });

// Check DevTools Console for:
// [TraceLog:EventManager] Tracking event: test_event
```

### Playground

The library includes a full demo at [`playground/index.html`](playground/index.html):

```bash
npm run playground:setup  # Build and copy library
npm run serve            # Start server on localhost:3000
```

Open http://localhost:3000 to see TraceLog in action with real-time event monitoring.

## License

MIT © TraceLog. See [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with [web-vitals](https://github.com/GoogleChrome/web-vitals) for performance metrics. Inspired by privacy-first analytics tools and modern web standards for user behavior tracking.