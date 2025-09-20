# TraceLog SDK

A lightweight TypeScript SDK for web analytics and user behavior tracking. Automatically captures clicks, scrolls, page views, and performance metrics with cross-tab session management and privacy-first design.

## Features

- **Zero-config tracking** - Automatically captures clicks, scrolls, page navigation, and web vitals out of the box.
- **Cross-tab session management** - Maintains consistent user sessions across multiple browser tabs with automatic recovery.
- **Privacy-first** - Built-in PII sanitization, IP exclusion options, and configurable data sampling.
- **Framework agnostic** - Works with vanilla JS, React, Vue, Angular, or any web application.
- **Lightweight** - Only one dependency (`web-vitals`) with dual ESM/CJS support.

## Installation

**Prerequisites**: Modern browser with ES6+ support. No server-side requirements.

- npm:
  ```bash
  npm install @tracelog/sdk
  ```
- yarn:
  ```bash
  yarn add @tracelog/sdk
  ```
- CDN (browser):
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@tracelog/sdk@latest/dist/browser/tracelog.js"></script>
  ```

## Quick Start

Initialize tracking with your project ID and start capturing events immediately:

```typescript
import * as TraceLog from '@tracelog/sdk';

// Initialize tracking
await TraceLog.init({
  id: 'your-project-id'
});

// Send custom events
TraceLog.event('user_signup', {
  method: 'email',
  plan: 'premium'
});
```

**Expected behavior**: Automatic tracking begins immediately. Check browser dev tools console for event logs (when `qaMode: true`).

## Usage

**Basic tracking with configuration:**
```typescript
await TraceLog.init({
  id: 'your-project-id',
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  qaMode: true // Enable debug logs
});
```

**Custom events with metadata:**
```typescript
TraceLog.event('product_viewed', {
  productId: 'abc-123',
  category: 'electronics',
  price: 299.99,
  tags: ['featured', 'sale']
});
```

**Privacy-focused configuration:**
```typescript
await TraceLog.init({
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
- `destroy(): void` - Clean up all tracking and remove event listeners.

**Key configuration options:**
- `config.id`: Your unique project identifier (required).
- `config.sessionTimeout`: Session timeout in milliseconds (default: 15 minutes).
- `config.qaMode`: Enable debug logging and bypass data sending for testing.
- `config.globalMetadata`: Metadata automatically attached to all events.

**Metadata types:** `string | number | boolean | string[]`

## Configuration

**Environment-based settings:**
- Set `qaMode: true` for development/testing environments
- Use `samplingRate: 0.1` to reduce data volume in high-traffic applications
- Configure `sessionTimeout` to match your application's user session length

**Google Analytics integration:**
```typescript
await TraceLog.init({
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
- **Module formats**: ESM, CommonJS, UMD
- **TypeScript**: Full type definitions included
- **Frameworks**: React, Vue, Angular, Svelte, vanilla JS

## Troubleshooting

**Events not appearing** → Check `qaMode: true` for console logs → Verify project ID is correct → Ensure network connectivity.

**Session tracking issues** → Verify localStorage is available → Check for cross-tab conflicts → Review session timeout settings.

**High memory usage** → Reduce `sessionTimeout` → Lower `samplingRate` → Check for event listener leaks (call `destroy()` on cleanup).

## Development & Contributing

### Development Setup
```bash
git clone https://github.com/nacorga/tracelog-client.git
cd tracelog-client
npm install
npm run build:all      # Build ESM + CJS + Browser
npm run check          # Lint + format check
npm run test:e2e       # Run E2E tests
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
     - Performance benchmarks
   - PR cannot be merged until CI passes
   - Code review required

3. **Release Process:**
   - Once merged to `main`, code is validated and ready
   - Run Release workflow manually from GitHub Actions
   - Automatic version bump, changelog, and NPM publish

### Quality Standards
- **Code Quality**: ESLint + Prettier enforced in CI
- **Type Safety**: TypeScript strict mode required
- **Testing**: E2E tests with Playwright for all features
- **Performance**: Bundle size monitoring and benchmarks
- **Security**: Dependency vulnerability scanning

## Versioning

Follows [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH). Breaking changes are documented in release notes with migration guides.

## License

MIT © TraceLog. See [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with [web-vitals](https://github.com/GoogleChrome/web-vitals) for performance metrics. Inspired by privacy-first analytics tools and modern web standards for user behavior tracking.