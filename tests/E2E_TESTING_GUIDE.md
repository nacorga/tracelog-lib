# E2E Testing Guide

**Quick guide for implementing new E2E tests in TraceLog SDK**

## 📋 Quick Checklist

- [ ] Create dedicated constants, utils, and types files
- [ ] Use `TestUtils` namespace for reusable functions
- [ ] Implement proper console monitoring and cleanup
- [ ] Test across multiple browsers (Chromium, Firefox, WebKit, Mobile)

## 📁 File Structure
```
tests/
├── constants/[feature].constants.ts  // Test data & config
├── utils/[feature].utils.ts          // Reusable functions
├── types/[feature].types.ts          // TypeScript interfaces
└── e2e/[feature]/test-name.spec.ts   // Test files
```

## 📝 Test Template
```typescript
import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { DEFAULT_CONFIG } from '../../constants/common.constants';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      const initResult = await TestUtils.initializeTraceLog(page, DEFAULT_CONFIG);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      // Your test logic here

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
```

## 🔧 Required Patterns

### Console Monitoring
```typescript
const monitor = TestUtils.createConsoleMonitor(page);
// Always use try/finally for cleanup
finally { monitor.cleanup(); }
```

### Constants & Utils
```typescript
// Extract hardcoded values
export const FEATURE_CONSTANTS = {
  TIMEOUTS: { SHORT: 500, LONG: 1000 },
  TEST_DATA: ['value1', 'value2'] as const,
} as const;

// Use readonly arrays for type safety
export function validateLogs(logs: string[], patterns: readonly string[]): boolean {
  return patterns.some(pattern => logs.includes(pattern));
}
```

## ✅ Best Practices

- **Extract constants** - No hardcoded values in tests
- **Use TestUtils** - Leverage existing utilities
- **Type safety** - Prefer interfaces over `any`
- **Cleanup** - Always use `finally` blocks
- **Cross-browser** - Test works on Chromium minimum

## 🚫 Avoid
- Hardcoding test data
- Skipping console monitoring
- Missing cleanup logic
- Using `any` types
- Browser-specific code without fallbacks

## 📋 Before Commit
```bash
npm run test:e2e        # Tests pass
npm run check           # Lint & format
npm run build:browser   # Build succeeds
```

## 📚 Examples
See `tests/e2e/error-tracking/` for reference implementations following these patterns.