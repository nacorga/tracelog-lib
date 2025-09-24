# Fase 4: Refactorizar Handlers y App

## 🎯 Objetivo
Revisar handlers, simplificar App y eliminar validaciones excesivas.

## 📋 Parte 1: Handlers

### Mantener Sin Cambios (Core)
```
✅ click.handler.ts        → Esencial, mantener
✅ scroll.handler.ts       → Esencial, mantener  
✅ page-view.handler.ts    → Esencial, mantener
✅ session.handler.ts      → Esencial, mantener
✅ performance.handler.ts  → Esencial, mantener (web-vitals)
```

### Evaluar/Simplificar
```
⚠️ error.handler.ts        → Simplificar o mantener básico
⚠️ network.handler.ts      → Simplificar interceptación
```

### Decisión Error Handler
**OPCIÓN A**: Mantener simplificado
```typescript
// Captura básica errores JS y promise rejections
export class ErrorHandler {
  startTracking(): void {
    window.addEventListener('error', this.handleError);
    window.addEventListener('unhandledrejection', this.handleRejection);
  }

  private handleError = (event: ErrorEvent): void => {
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: 'js_error',
        message: event.message,
        // ... datos básicos
      },
    });
  };
}
```

**OPCIÓN B**: Eliminar completamente
- Los errores se pueden trackear con custom events
- Menos complejidad

### Decisión Network Handler
**OPCIÓN A**: Simplificar
```typescript
// Solo interceptar fetch básico, sin XMLHttpRequest
export class NetworkHandler {
  startTracking(): void {
    this.interceptFetch();
  }

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        // Track si es error (status >= 400)
        if (response.status >= 400) {
          this.trackNetworkError(response, Date.now() - startTime);
        }
        return response;
      } catch (error) {
        this.trackNetworkError(error, Date.now() - startTime);
        throw error;
      }
    };
  }
}
```

**OPCIÓN B**: Eliminar
- Network errors se capturan en error handler
- Menos interceptación = menos bugs potenciales

## 📋 Parte 2: Simplificar App

### Eliminar Validaciones Excesivas
```typescript
// ANTES: Múltiples validaciones granulares
private validateState(): void {
  if (!this.apiUrl) throw new Error('apiUrl missing');
  if (!this.config) throw new Error('config missing');
  if (!this.userId) throw new Error('userId missing');
  if (!this.device) throw new Error('device missing');
  if (!this.pageUrl) throw new Error('pageUrl missing');
}

private validateStorageManager(): void { ... }
private validateEventManager(): void { ... }
private validateHandlersInitialized(): void { ... }

// DESPUÉS: Validación mínima
private validateCritical(): void {
  if (!this.get('config')?.id) {
    throw new Error('Project ID is required');
  }
}
```

### Eliminar Rollback Completo
```typescript
// ANTES: Rollback completo en error (~100 líneas)
private async rollbackInitialization(): Promise<void> {
  // Limpia TODO si algo falla
}

// DESPUÉS: Degradación gradual
async init(config: AppConfig): Promise<void> {
  this.storage = new StorageManager();
  
  try {
    await this.setConfig(config);
  } catch (error) {
    console.warn('Config failed, using defaults');
    this.config = DEFAULT_CONFIG;
  }

  try {
    this.analytics = new GoogleAnalytics();
  } catch (error) {
    console.warn('Analytics failed, continuing without');
    this.analytics = null;
  }

  this.eventManager = new EventManager(this.storage, this.analytics);
  await this.initHandlers();
}
```

### Simplificar init()
```typescript
// src_v2/app.ts
async init(appConfig: AppConfig): Promise<void> {
  if (this.isInitialized) {
    debugLog.warn('App', 'Already initialized');
    return;
  }

  debugLog.info('App', 'Initializing', { projectId: appConfig.id });

  // Setup básico
  this.storage = new StorageManager();
  await this.setState(appConfig);

  // Integraciones (optional)
  await this.setupIntegrations();

  // Event system
  this.eventManager = new EventManager(this.storage, this.googleAnalytics);

  // Handlers
  await this.initHandlers();

  // Recovery
  await this.eventManager.recoverPersistedEvents();

  this.isInitialized = true;
  debugLog.info('App', 'Initialized successfully');
}
```

## 🧪 Tests

### Test Handlers
```typescript
// tests/e2e/handlers.spec.ts
test('should track click events', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button#test');

  const events = await getTrackedEvents(page);
  const clickEvent = events.find(e => e.type === 'click');

  expect(clickEvent).toBeDefined();
  expect(clickEvent.click_data).toHaveProperty('x');
  expect(clickEvent.click_data).toHaveProperty('y');
});

test('should track scroll events', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.evaluate(() => window.scrollTo(0, 500));

  const events = await getTrackedEvents(page);
  const scrollEvent = events.find(e => e.type === 'scroll');

  expect(scrollEvent).toBeDefined();
  expect(scrollEvent.scroll_data?.depth).toBeGreaterThan(0);
});
```

### Test App Init
```typescript
// tests/integration/app-init.test.ts
test('should initialize with minimal config', async () => {
  const app = new App();
  await app.init({ id: 'test' });

  expect(app.initialized).toBe(true);
});

test('should degrade gracefully on analytics failure', async () => {
  mockGA.mockImplementationOnce(() => {
    throw new Error('GA failed');
  });

  const app = new App();
  await app.init({ id: 'test', googleAnalytics: { id: 'GA-123' } });

  // Should still initialize
  expect(app.initialized).toBe(true);
});
```

## ✅ Criterios de Éxito
- [ ] Handlers core mantenidos (5)
- [ ] Error/Network evaluados y decididos
- [ ] App.init() < 100 líneas
- [ ] Validaciones mínimas
- [ ] Rollback eliminado
- [ ] Degradación gradual implementada
- [ ] Tests E2E handlers 100%

---
**Siguiente**: PHASE_5_VALIDATION_MIGRATION.md
