# TraceLog Library - Refactor Exhaustivo v2.0

## 🎯 Objetivo del Refactor

Realizar una refactorización **exhaustiva pero conservadora** de la librería TraceLog, eliminando sobreingeniería mientras se **mantienen todas las funcionalidades principales** y se **preserva el DTO de salida de eventos intacto**.

### Principios Clave

1. **DTO Intacto**: `EventData` y estructura de salida NO cambian
2. **Funcionalidad Preservada**: Todo lo que funciona debe seguir funcionando igual o mejor
3. **Refactor, No Eliminación**: Simplificar código existente, no eliminar features
4. **Testing Continuo**: Validar cada cambio con tests E2E
5. **Desarrollo Paralelo**: Usar `src_v2/` hasta completar, luego reemplazar

## 📁 Estrategia de Carpetas

```bash
tracelog-lib/
├── src/                    # ⚠️ NO TOCAR hasta finalizar
├── src_v2/                 # 🚧 Desarrollo del refactor
│   ├── api.ts
│   ├── app.ts
│   ├── handlers/
│   ├── managers/
│   ├── utils/
│   ├── types/
│   └── constants/
├── tests/                  # Tests E2E apuntando a src_v2
└── _REFACTOR_TASKS/       # Documentación de tareas
```

### Workflow

1. Crear `src_v2/` copiando estructura actual
2. Aplicar refactor en `src_v2/`
3. Actualizar imports en tests para usar `src_v2/`
4. Validar con tests E2E
5. Una vez completado: `rm -rf src && mv src_v2 src`

## 🔒 Elementos Intocables

### DTO de Eventos (CRÍTICO)
```typescript
// src/types/event.types.ts - NO MODIFICAR estructura
export interface EventData {
  type: EventType;
  page_url: string;
  timestamp: number;
  referrer?: string;
  from_page_url?: string;
  scroll_data?: ScrollData;
  click_data?: ClickData;
  custom_event?: CustomEventData;
  web_vitals?: WebVitalsData;
  page_view?: PageViewData;
  session_start_recovered?: boolean;
  session_end_reason?: SessionEndReason;
  error_data?: ErrorData;
  utm?: UTM;
  tags?: string[] | { id: string; key: string }[];
}
```

### API Pública
```typescript
// src/api.ts - Mantener firma exacta
export const TraceLog = {
  init: (config: AppConfig) => Promise<void>,
  event: (name: string, metadata?: Record<string, unknown>) => void,
  destroy: () => Promise<void>
};
```

### Estructura de Envío
```typescript
// Payload enviado al backend - NO MODIFICAR
interface BaseEventsQueueDto {
  user_id: string;
  session_id: string;
  device: DeviceType;
  events: EventData[];
  global_metadata?: Record<string, unknown>;
}
```

## ✅ Funcionalidades a Preservar

### 1. Tracking de Eventos (CORE)
- ✅ Page views automático
- ✅ Clicks con datos del elemento
- ✅ Scroll depth y dirección
- ✅ Custom events con metadata
- ✅ Web Vitals (LCP, CLS, INP, FCP, TTFB)
- ✅ Session start/end con timeout

### 2. Gestión de Sesión
- ✅ Session ID único por sesión
- ✅ Session timeout configurable (default 15min)
- ✅ Session end con razón (timeout, visibility, unload)
- ✅ User ID persistente en localStorage
- ✅ **SIMPLIFICAR**: Cross-tab sync (puede ser más simple)
- ✅ **SIMPLIFICAR**: Session recovery (versión básica)

### 3. Envío de Datos
- ✅ Batch sending con intervalos
- ✅ Queue de eventos con límite
- ✅ Retry en caso de fallo
- ✅ Persistencia en localStorage
- ✅ `sendBeacon` para unload
- ✅ **SIMPLIFICAR**: Circuit breaker (versión más simple)

### 4. Deduplicación
- ✅ Prevenir eventos duplicados
- ✅ Threshold temporal configurable
- ✅ **SIMPLIFICAR**: Usar comparación con último evento vs Map completo

### 5. Configuración
- ✅ Config desde API con timeout
- ✅ Sensitive query params
- ✅ Excluded URL paths
- ✅ IP exclusion
- ✅ Global metadata
- ✅ Mode (production/qa/debug)
- ✅ **SIMPLIFICAR**: Tags (versión básica sin lógica condicional)
- ✅ **SIMPLIFICAR**: Sampling (versión básica)

### 6. Integraciones
- ✅ Google Analytics forwarding
- ✅ **NOTA**: Mantener pero simplificar implementación

### 7. Validaciones
- ✅ Sanitización de metadata
- ✅ Validación de custom events
- ✅ URL normalization
- ✅ **SIMPLIFICAR**: Reducir validaciones excesivas

## 🔄 Elementos a Refactorizar

### Circuit Breaker → Versión Simple
**ANTES**: Sistema complejo con backoff exponencial, health checks, recovery automático
**DESPUÉS**:
- Contador simple de fallos
- Si > N fallos → pausar envíos por X tiempo
- Retry básico con intervalo fijo
- Sin backoff exponencial

### Cross-Tab Session → Versión Básica
**ANTES**: Sincronización compleja entre tabs con BroadcastChannel
**DESPUÉS**:
- Broadcast Channel para comunicación
- Sincronizar solo session_id y timestamp
- Sin recuperación compleja de estado

### Deduplicación → Comparación Simple
**ANTES**: Map de fingerprints con cleanup periódico
**DESPUÉS**:
- Comparar solo con último evento
- Threshold temporal de 1 segundo
- Sin gestión de memoria compleja

### Tags System → Versión Básica
**ANTES**: Sistema condicional complejo con reglas y evaluación
**DESPUÉS**:
- Tags estáticos por proyecto
- Sin lógica condicional
- Aplicar tags a todos los eventos del proyecto

### Sampling → Configuración Simple
**ANTES**: Sampling granular por tipo de evento
**DESPUÉS**:
- Sampling global por proyecto (0-1)
- Un solo ratio para todos los eventos

### Session Recovery → Básico
**ANTES**: Sistema complejo con persistencia y recuperación multi-estado
**DESPUÉS**:
- Guardar último estado en localStorage
- Recuperar solo session_id y timestamp básico
- Sin recuperación de eventos pendientes

### Error Handling → Simplificado
**ANTES**: Múltiples capas de try-catch con rollback completo
**DESPUÉS**:
- Try-catch en puntos críticos
- Logging de errores
- Degradación gradual (no bloquear si falla algo secundario)

## 📋 Plan de Tareas Actualizado

### Fase 1: Preparación (NUEVA)
1. **Crear estructura `src_v2/`**
   - Copiar todo desde `src/`
   - Actualizar package.json build paths para dual support
   - Configurar tests para usar `src_v2/`

### Fase 2: Refactorización Core
2. **Simplificar EventManager**
   - Refactorizar circuit breaker a versión simple
   - Simplificar deduplicación (último evento)
   - Mantener queue, batch sending, retry

3. **Simplificar SessionManager**
   - Refactorizar cross-tab a versión básica
   - Simplificar session recovery
   - Mantener timeout, session end reasons

4. **Simplificar SenderManager**
   - Retry simple con intervalo fijo
   - Mantener persistencia en localStorage
   - Mantener sendBeacon para unload

### Fase 3: Features Secundarias
5. **Simplificar Tags System**
   - Tags estáticos por proyecto
   - Eliminar lógica condicional
   - Mantener campo en EventData

6. **Simplificar Sampling**
   - Ratio global único
   - Eliminar sampling granular por tipo

7. **Mantener Integraciones**
   - Refactorizar Google Analytics (más simple)
   - Mantener funcionalidad

### Fase 4: Handlers
8. **Revisar Handlers**
   - Mantener: click, scroll, page-view, session, performance
   - Refactorizar: error handler (más simple)
   - Evaluar: network handler (simplificar o mantener)

### Fase 5: Utils y Constants
9. **Consolidar Utils**
   - Mantener utils esenciales
   - Refactorizar logging a versión simple
   - Mantener sanitización y validación

10. **Reducir Constants**
    - Consolidar constantes relacionadas
    - Eliminar duplicados
    - Mantener valores configurables

### Fase 6: Validación Final
11. **Testing Exhaustivo**
    - Todos los tests E2E pasando
    - Validar DTO salida idéntico
    - Performance testing
    - Cross-browser testing

12. **Migración y Cleanup**
    - `rm -rf src && mv src_v2 src`
    - Actualizar docs
    - Actualizar package.json
    - Versión 2.0.0

## 🧪 Testing Strategy

### Tests Unitarios (NUEVO)
Agregar tests unitarios básicos para funciones puras y lógica de negocio:

```typescript
// tests/unit/utils/sanitize.test.ts
describe('sanitize utils', () => {
  test('should sanitize metadata removing sensitive data', () => {
    const metadata = { password: '123', user: 'john' };
    const result = sanitizeMetadata(metadata);
    expect(result).not.toHaveProperty('password');
    expect(result).toHaveProperty('user');
  });

  test('should limit metadata size', () => {
    const largeMetadata = { data: 'x'.repeat(10000) };
    const result = sanitizeMetadata(largeMetadata);
    expect(JSON.stringify(result).length).toBeLessThan(5000);
  });
});

// tests/unit/utils/url.test.ts
describe('URL utils', () => {
  test('should normalize URL removing sensitive params', () => {
    const url = 'https://example.com?token=secret&user=john';
    const result = normalizeUrl(url, ['token']);
    expect(result).not.toContain('token=secret');
    expect(result).toContain('user=john');
  });

  test('should check excluded paths correctly', () => {
    const url = 'https://example.com/admin/users';
    const excluded = ['/admin/*', '/api/*'];
    expect(isUrlPathExcluded(url, excluded)).toBe(true);
  });
});

// tests/unit/managers/event-manager.test.ts
describe('EventManager deduplication', () => {
  test('should detect duplicate click events', () => {
    const manager = new EventManager(mockStorage);
    const event = { type: 'click', x: 100, y: 200, page_url: '/test' };

    manager.track(event);
    manager.track(event); // Duplicate

    expect(manager.getQueueLength()).toBe(1);
  });

  test('should NOT deduplicate after threshold', async () => {
    const manager = new EventManager(mockStorage);
    const event = { type: 'click', x: 100, y: 200, page_url: '/test' };

    manager.track(event);
    await sleep(1500); // > threshold
    manager.track(event);

    expect(manager.getQueueLength()).toBe(2);
  });
});

// tests/unit/handlers/session.test.ts
describe('SessionHandler', () => {
  test('should generate unique session ID', () => {
    const handler = new SessionHandler(mockStorage, mockEventManager);
    const id1 = handler.generateSessionId();
    const id2 = handler.generateSessionId();

    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(10);
  });

  test('should detect session timeout', () => {
    const handler = new SessionHandler(mockStorage, mockEventManager);
    const lastActivity = Date.now() - (16 * 60 * 1000); // 16 min ago

    expect(handler.isSessionExpired(lastActivity)).toBe(true);
  });
});
```

### Tests de Integración (NUEVO)
Tests que verifican interacción entre componentes:

```typescript
// tests/integration/event-flow.test.ts
describe('Event Flow Integration', () => {
  test('should track → queue → send event successfully', async () => {
    const app = new App();
    await app.init({ id: 'test' });

    // Track event
    app.sendCustomEvent('purchase', { amount: 100 });

    // Wait for queue interval
    await sleep(2000);

    // Verify sent
    expect(mockSender.lastPayload.events).toHaveLength(1);
    expect(mockSender.lastPayload.events[0].type).toBe('custom');
  });

  test('should persist events on failure and recover', async () => {
    mockSender.shouldFail = true;

    const app = new App();
    await app.init({ id: 'test' });
    app.sendCustomEvent('test');

    await sleep(2000);

    // Should persist
    expect(localStorage.getItem('tracelog_events')).toBeDefined();

    // Restore connection and recover
    mockSender.shouldFail = false;
    await app.init({ id: 'test' }); // Re-init to trigger recovery

    expect(mockSender.lastPayload.events).toHaveLength(1);
  });
});
```

### Tests E2E Críticos (MUST PASS)
```typescript
// tests/e2e/dto-validation.spec.ts - CRÍTICO
test('EventData structure must be identical', async ({ page }) => {
  const event = await captureEvent(page);

  expect(event).toHaveProperty('type');
  expect(event).toHaveProperty('page_url');
  expect(event).toHaveProperty('timestamp');
  // Validar TODA la estructura EventData
});

// Payload Validation - CRÍTICO
test('BaseEventsQueueDto structure must be identical', async ({ page }) => {
  const payload = await interceptPayload(page);

  expect(payload).toHaveProperty('user_id');
  expect(payload).toHaveProperty('session_id');
  expect(payload).toHaveProperty('device');
  expect(payload).toHaveProperty('events');
  expect(payload.events).toBeArray();
});

// Functional Tests
test('should track all event types', async ({ page }) => { ... });
test('should manage sessions correctly', async ({ page }) => { ... });
test('should send events in batches', async ({ page }) => { ... });
test('should deduplicate events', async ({ page }) => { ... });
test('should persist and recover events', async ({ page }) => { ... });
test('should apply configuration correctly', async ({ page }) => { ... });
```

### Criterios para Tests Unitarios
✅ **Escribir tests unitarios para**:
- Funciones puras de utils (sanitize, normalize, validate)
- Lógica de deduplicación
- Generación de IDs
- Detección de timeouts
- Comparación de eventos
- Cálculos de thresholds

❌ **NO escribir tests unitarios para**:
- Integración con DOM (usar E2E)
- Network requests (usar E2E o integration)
- localStorage directo (usar mocks en unit, E2E para real)
- Handlers completos (usar E2E)

## 📊 Métricas de Éxito

### Reducción de Complejidad
- ❌ **NO**: Reducir archivos dramáticamente
- ✅ **SÍ**: Reducir complejidad ciclomática
- ✅ **SÍ**: Reducir LOC manteniendo funcionalidad
- ✅ **SÍ**: Eliminar código duplicado

### Funcionalidad
- ✅ 100% funcionalidades core preservadas
- ✅ DTO salida idéntico (byte-perfect)
- ✅ API pública sin breaking changes
- ✅ Todos los tests E2E pasando

### Calidad
- ✅ Coverage > 80% (si aplica)
- ✅ Zero TypeScript errors
- ✅ Zero lint errors
- ✅ Performance igual o mejor

## ⚠️ Red Flags - Detener si

- ❌ Tests E2E fallan
- ❌ DTO de EventData cambia
- ❌ API pública cambia sin compatibilidad
- ❌ Funcionalidad core se pierde
- ❌ Performance degrada significativamente

## 🚀 Comandos de Desarrollo

```bash
# Desarrollo en src_v2
npm run dev:v2           # Build watch para src_v2
npm run build:v2         # Build src_v2

# Testing
npm run test:unit        # Tests unitarios (Vitest/Jest)
npm run test:unit:watch  # Watch mode para desarrollo
npm run test:integration # Tests de integración
npm run test:e2e:v2      # E2E tests apuntando a src_v2
npm run test:all:v2      # Todos los tests (unit + integration + e2e)

# Coverage
npm run test:coverage    # Coverage de tests unitarios

# Validación
npm run check:v2         # Lint + format src_v2
npm run compare-output   # Comparar output src vs src_v2

# Migración final
npm run migrate:v2       # rm -rf src && mv src_v2 src
```

## 📝 Checklist Final Pre-Migración

### Tests
- [ ] Tests unitarios pasando (100%)
- [ ] Tests de integración pasando (100%)
- [ ] Tests E2E pasando con src_v2 (100%)
- [ ] Coverage > 80% en funciones críticas

### Estructura y Compatibilidad
- [ ] DTO EventData byte-identical
- [ ] Payload enviado byte-identical
- [ ] API pública sin breaking changes
- [ ] Performance benchmarks iguales o mejores

### Documentación
- [ ] Documentación actualizada
- [ ] CLAUDE.md actualizado
- [ ] README.md actualizado
- [ ] Tests documentados (unit, integration, e2e)
- [ ] Changelog generado

### Release
- [ ] Version bump a 2.0.0
- [ ] Build funcionando correctamente
- [ ] No errores de TypeScript
- [ ] No errores de lint

---

**Inicio**: 2025-09-24
**Estado**: Planificación
**Versión Objetivo**: 2.0.0
**Enfoque**: Refactor exhaustivo preservando funcionalidad