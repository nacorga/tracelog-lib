# E2E Testing Guide

## 🎯 Framework de Testing TraceLog

Testing end-to-end usando Playwright con fixtures personalizados, builders fluidos y matchers específicos.

### Stack Tecnológico
- **Playwright** + **TypeScript** con type safety estricto
- **Testing Bridge**: `__traceLogBridge` para acceso consistente
- **Framework mejorado**: Fixtures, Page Objects, Builders, Matchers

## 🔧 Comandos Principales

```bash
# Tests
npm run test:e2e                 # Todos los tests E2E
npm run test:e2e -- --headed     # Modo visual
npm run test:e2e -- --grep "X"   # Tests específicos

# Calidad
npm run check                    # Verificar todo (tipos + lint + format)
npm run fix                      # Corregir automáticamente
npm run type-check:watch         # Verificación continua
```

## 🧪 Patrones de Testing

### Patrón Simple (Fixture)

```typescript
import { traceLogTest } from '../fixtures/tracelog-fixtures';
import { TRACELOG_CONFIGS } from '../config/test-config';

traceLogTest('basic test', async ({ traceLogPage }) => {
  await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.MINIMAL);
  await traceLogPage.clickElement('[data-testid="button"]');

  await expect(traceLogPage).toHaveNoTraceLogErrors();
});
```

### Patrón Avanzado (Builder DSL)

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

## 🔑 APIs Esenciales

```typescript
// TraceLogTestPage (fixture automático)
await traceLogPage.initializeTraceLog(config);
await traceLogPage.clickElement(selector);
await traceLogPage.sendCustomEvent(name, data);
const events = await traceLogPage.getTrackedEvents();

// Matchers personalizados
await expect(traceLogPage).toHaveNoTraceLogErrors();
await expect(events).toHaveEvent('CLICK');
await expect(events).toHaveCustomEvent('user_action');

// Configuraciones predefinidas
TRACELOG_CONFIGS.MINIMAL        // Tests básicos
TRACELOG_CONFIGS.STANDARD       // Tests generales
TRACELOG_CONFIGS.FULL_FEATURED  // Tests completos
```

## ⚡ Best Practices

### ✅ Hacer
- Usar `traceLogTest` fixture (setup/cleanup automático)
- Usar configuraciones predefinidas (`TRACELOG_CONFIGS.*`)
- Usar matchers personalizados (`toHaveNoTraceLogErrors`, `toHaveEvent`)
- Builder DSL para escenarios complejos

### ❌ Evitar
- Hardcoded timeouts: `await page.waitForTimeout(2000)`
- Configuraciones inline: `{ id: 'hardcoded', sessionTimeout: 900000 }`
- Direct Bridge access: `window.__traceLogBridge.getSessionData()`

## 🔍 Debug

```bash
npm run test:e2e -- --headed    # Visual mode
npm run test:e2e -- --debug     # DevTools
npm run test:e2e -- --trace on  # Generate traces
```