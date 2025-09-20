# E2E Testing Guide

## 🎯 Core Requirements

* **Testing Bridge**: Use `window.__traceLogTestBridge` (auto-injected when `NODE_ENV=e2e`)
* **TestUtils**: All utilities via `TestUtils` namespace
* **Console Monitoring**: Required `createConsoleMonitor()` + `cleanup()`
* **Cross-Browser**: Must pass on Chromium, Firefox, WebKit, Mobile
* **Test ID**: Use `{ id: 'test' }` for automatic debug mode and full logging

## 📝 Mandatory Test Structure

```ts
import { test, expect } from '@playwright/test';
import { TestUtils } from '../utils';

test('should validate behavior', async ({ page }) => {
  const monitor = TestUtils.createConsoleMonitor(page);

  try {
    await TestUtils.navigateAndWaitForReady(page, '/');
    const initResult = await TestUtils.initializeTraceLog(page);

    expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);
    expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

    // Test-specific logic here

  } finally {
    monitor.cleanup(); // ALWAYS required
  }
});
```

## 📁 File Organization

```
tests/
├── constants/[domain].constants.ts   # NO hardcoded values
├── utils/[domain].utils.ts           # Pure helper functions
├── types/[domain].types.ts           # TypeScript interfaces
└── e2e/[domain]/test-name.spec.ts    # Test files by domain
```

**Domains**: initialization, session-management, event-tracking, performance-tracking, error-tracking, user-management, storage-management, queue-management, configuration, integrations, security-qa, system-reliability, browser-compatibility, edge-cases

## 🛠️ Essential Patterns

### Initialization Tests
```ts
// Standard test config (auto debug mode + full logging)
const config = { id: 'test' };

// Valid: { id: 'test' }
expect(result.success).toBe(true);
expect(appInstance.isInitialized).toBe(true);

// Invalid: { id: '' }
expect(result.success).toBe(false);
expect(result.error).toBeDefined();

// Custom config for specific tests
const customConfig = { id: 'test', sessionTimeout: 1000 };
```

### Event Tests
```ts
await TestUtils.trackCustomEvent(page, { name: 'test_event', metadata: { key: 'value' } });
const events = await TestUtils.getTrackedEvents(page);
const event = events.find((e: any) => e.type === 'CUSTOM');
expect(event.custom_event.name).toBe('test_event');
```

### Session Tests
```ts
await TestUtils.triggerUserActivity(page);
await TestUtils.waitForSessionStart(page);
const session = await TestUtils.getSessionData(page);
expect((session as any).isActive).toBe(true);
```

### Event Listening (Advanced)
```ts
// Listen for real-time TraceLog events
const eventListener = await TestUtils.listenForTraceLogEvents(page);

try {
  await TestUtils.initializeTraceLog(page);

  // Wait for specific events
  await TestUtils.waitForTraceLogEvent(page, (event: unknown) =>
    (event as any).namespace === 'App' && (event as any).message.includes('initialization completed')
  );

} finally {
  await eventListener.cleanup();
}
```

## 🔧 Test Environment Setup

### Test Configuration Behavior
ID `"test"` triggers special behavior in ConfigManager:
- **Mode**: Automatically set to `"debug"` (full logging)
- **Error Sampling**: Set to `1` (100% error capture)
- **API Calls**: Skipped - uses local default config
- **Logging**: Complete debug output in console
- **Events**: Emits `tracelog:qa` events for real-time test validation (only for `id: 'test'` or `id: 'demo'`)

### Fixture Modification
Modify `tests/fixtures/index.html` when testing specific scenarios:
```html
<!-- Add custom elements for click/scroll tests -->
<button id="test-btn" data-tl-name="custom_event">Click Me</button>
<div id="scroll-container" style="height: 200px; overflow-y: scroll;">...</div>

<!-- Add test data attributes -->
<meta name="test-scenario" content="large-payload-test">
```

### Custom Test Pages
Create specific fixture pages for complex scenarios:
```
tests/fixtures/pages/
├── performance-test.html     # Large DOM for performance tests
├── error-simulation.html     # Controlled error scenarios
├── multi-tab-test.html       # Cross-tab coordination tests
└── storage-test.html         # LocalStorage edge cases
```

### Network Simulation
```ts
// Simulate network failures for API tests
await page.route('**/api/**', route => route.abort('failed'));

// Mock API responses
await page.route('**/config', route => route.fulfill({
  status: 200,
  body: JSON.stringify({ sampling: 0.5, excludedPaths: ['/admin'] })
}));
```

## 🚫 Critical Don'ts

* DON'T skip console monitoring/cleanup
* DON'T hardcode test data or timeouts
* DON'T access `TraceLog._app` directly
* DON'T test single browser only
* DON'T use real PII in test data
* DON'T create external dependencies
* DON'T modify fixtures without cleanup
* DON'T assume timing - use proper waits

## ✅ Quality Gates

```bash
npm run test:e2e        # 100% pass rate
npm run check           # No lint/format errors
npm run build:browser   # Must succeed
```

**Success Criteria**: 100% pass rate across all browsers, zero errors, all 70+ E2E_TESTS.json scenarios covered.
