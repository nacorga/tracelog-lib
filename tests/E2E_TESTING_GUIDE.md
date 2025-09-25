# E2E Testing Guide

## 🎯 TraceLog Testing Framework

End-to-end testing using Playwright with custom fixtures, fluent builders, and specific matchers.

### Technology Stack
- **Playwright** + **TypeScript** with strict type safety
- **Testing Bridge**: `__traceLogBridge` for consistent access
- **Enhanced Framework**: Fixtures, Page Objects, Builders, Matchers

## 🔧 Main Commands

```bash
# Tests
npm run test:e2e                 # All E2E tests
npm run test:e2e -- --headed     # Visual mode
npm run test:e2e -- --grep "X"   # Specific tests

# Quality
npm run check                    # Check everything (types + lint + format)
npm run fix                      # Auto-fix
npm run type-check:watch         # Continuous checking
```

## 🧪 Testing Patterns

### Simple Pattern (Fixture)

```typescript
import { traceLogTest } from '../fixtures/tracelog-fixtures';
import { TRACELOG_CONFIGS } from '../config/test-config';

traceLogTest('basic test', async ({ traceLogPage }) => {
  await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.MINIMAL);
  await traceLogPage.clickElement('[data-testid="button"]');

  await expect(traceLogPage).toHaveNoTraceLogErrors();
});
```

### Advanced Pattern (Builder DSL)

```typescript
import { TraceLogTestBuilder } from '../builders/test-scenario-builder';

traceLogTest('complex flow', async ({ traceLogPage }) => {
  await TraceLogTestBuilder
    .create(traceLogPage)
    .withConfig(TRACELOG_CONFIGS.STANDARD)
    .expectInitialization()
    .startEventCapture()
    .simulateUserJourney('purchase_intent')
    .expectEvents(['CLICK', 'SCROLL'])
    .expectNoErrors()
    .run();
});
```

## 🔑 Essential APIs

```typescript
// TraceLogTestPage (fixture automático)
await traceLogPage.initializeTraceLog(config);
await traceLogPage.clickElement(selector);
await traceLogPage.sendCustomEvent(name, data);
const events = await traceLogPage.getTrackedEvents();

// Custom matchers
await expect(traceLogPage).toHaveNoTraceLogErrors();
await expect(events).toHaveEvent('CLICK');
await expect(events).toHaveCustomEvent('user_action');

// Predefined configurations
TRACELOG_CONFIGS.MINIMAL        // Basic tests
TRACELOG_CONFIGS.STANDARD       // General tests
TRACELOG_CONFIGS.FULL_FEATURED  // Complete tests
```

## ⚡ Best Practices

### ✅ Use
- Usar `traceLogTest` fixture (setup/cleanup automático)
- Use predefined configurations (`TRACELOG_CONFIGS.*`)
- Use custom matchers (`toHaveNoTraceLogErrors`, `toHaveEvent`)
- Builder DSL for complex scenarios
- Adapt `__traceLogBridge` as needed

### ❌ Avoid
- Hardcoded timeouts: `await page.waitForTimeout(2000)`
- Inline configurations: `{ id: 'hardcoded', sessionTimeout: 900000 }`
- Direct Bridge access: `window.__traceLogBridge.getSessionData()`

## 🔍 Debug

```bash
npm run test:e2e -- --headed    # Visual mode
npm run test:e2e -- --debug     # DevTools
npm run test:e2e -- --trace on  # Generate traces
```


## ⭐ Acceptance criteria
- 100% pass rating
- NO types errors (use `npm run type-check` script to verify)
- NO lint errors (use `npm run lint` script to verify)


## 🛡️ Library Error Detection

### Automated Monitoring

Tests automatically detect issues in TraceLog library:

```bash
npm run test:e2e                 # Runtime error detection
npm run ci:health-check          # System health validation
node scripts/test-anomaly-report.js  # Anomaly analysis
```

### Error Categories

#### Console Errors
```typescript
// Automatic console monitoring
await expect(traceLogPage).toHaveNoTraceLogErrors();
await expect(consoleMonitor).not.toHaveMessage(/\[TraceLog:ERROR\]/);
```

#### Memory Leaks
```typescript
// Performance monitoring
await expect(performanceMonitor).toHaveNoMemoryLeaks();
await expect(performanceMonitor).toHaveNoExcessiveEventQueuing();
```

#### Security Issues
```typescript
// Data sanitization validation
await expect(events).toHaveSanitizedData();
await expect(events).not.toContainScript();
```

#### Runtime Anomalies
```typescript
// Bridge availability and functionality
await expect(traceLogPage.isBridgeAvailable()).toBe(true);
await expect(sessionData).toBeValidSessionData();
```

### Reports Generated

- `test-reports/anomaly-report.json` - Performance and behavior anomalies
- `test-results/failed-tests.json` - Test failures with library issues
- `playwright-report/` - Detailed execution reports with screenshots
