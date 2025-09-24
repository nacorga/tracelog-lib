# Análisis de Arquitectura Actual - TraceLog Library

## 🔍 Estado Actual del Código

### Estadísticas del Proyecto
```bash
Total archivos TypeScript: 77
Total líneas de código: ~15,000
Dependencias runtime: 1 (web-vitals)
Dependencias dev: ~20
```

### Distribución de Archivos

#### Managers (12 archivos)
```
✅ MANTENER SIMPLIFICADO:
- state.manager.ts          → Estado global, base para otros managers
- storage.manager.ts        → Abstracción localStorage
- event.manager.ts          → Queue, deduplicación, envío (REFACTORIZAR)
- session.manager.ts        → Gestión sesiones (REFACTORIZAR)
- sender.manager.ts         → HTTP requests, retry (REFACTORIZAR)
- config.manager.ts         → Carga configuración
- user.manager.ts           → User ID persistente
- api.manager.ts            → URL construcción

❌ SIMPLIFICAR/ELIMINAR:
- sampling.manager.ts       → Muestreo granular → Ratio global simple
- tags.manager.ts           → Lógica condicional → Tags estáticos
- cross-tab-session.manager.ts → Sincronización compleja → Básica
- session-recovery.manager.ts  → Recovery multi-estado → Básico
```

#### Handlers (7 archivos)
```
✅ MANTENER:
- click.handler.ts          → Tracking clicks esencial
- scroll.handler.ts         → Tracking scroll esencial
- page-view.handler.ts      → Tracking navegación esencial
- session.handler.ts        → Lifecycle sesiones esencial
- performance.handler.ts    → Web Vitals esencial

⚠️ EVALUAR:
- error.handler.ts          → Simplificar o mantener básico
- network.handler.ts        → Simplificar interceptación
```

#### Utils (20 archivos en subdirectorios)
```
✅ MANTENER:
- browser/                  → Detección device/browser
  ├── device.utils.ts
  └── user-agent.utils.ts
- data/                     → Sanitización/normalización
  ├── sanitize.utils.ts
  ├── normalize.utils.ts
  └── hash.utils.ts
- validations/              → Validaciones core
  ├── event.validations.ts
  └── metadata.validations.ts

❌ SIMPLIFICAR/ELIMINAR:
- network/
  └── fetch-with-timeout.utils.ts  → Reemplazar con fetch nativo + AbortController
- security/                 → Validaciones excesivas
- logging/                  → Sistema complejo → Logger simple
- backoff.manager.ts        → Backoff exponencial → Intervalo fijo
```

#### Types (16 archivos)
```
🔒 INTOCABLE:
- event.types.ts            → DTO de eventos, NO MODIFICAR

✅ MANTENER:
- config.types.ts           → Configuración app
- state.types.ts            → Estado global
- api.types.ts              → API types
- session.types.ts          → Session types
- device.types.ts           → Device types
- common.types.ts           → Types compartidos

❌ ELIMINAR/CONSOLIDAR:
- validation-error.types.ts → Consolidar en common
- queue.types.ts            → Consolidar en event
- tag.types.ts              → Simplificar
- mode.types.ts             → Consolidar en config
- log.types.ts              → Simplificar logging
- web-vitals.types.ts       → Ya existe en event.types
```

#### Constants (8+ archivos)
```
✅ MANTENER CONSOLIDADO:
- api.constants.ts          → URLs, endpoints
- timing.constants.ts       → Timeouts, intervalos
- storage.constants.ts      → Keys localStorage
- limits.constants.ts       → Max queue, etc

❌ ELIMINAR:
- backoff.constants.ts      → Backoff exponencial
- security.constants.ts     → Validaciones excesivas
- validation.constants.ts   → Consolidar
- browser.constants.ts      → Consolidar
```

## 🏗️ Problemas de Arquitectura Identificados

### 1. **Circuit Breaker Sobre-Ingenierizado**
**Problema**: Sistema complejo con backoff exponencial, health checks, recovery automático

**Archivos afectados**:
- `event.manager.ts` (~900 líneas)
- `backoff.manager.ts`
- `constants/backoff.constants.ts`

**Complejidad innecesaria**:
- Backoff exponencial
- Health check interval
- Circuit recovery attempts
- Error statistics tracking
- Stuck state detection

**Solución simple**:
```typescript
// Versión simple
class SimpleCircuitBreaker {
  private failureCount = 0;
  private isOpen = false;
  private openTime = 0;

  recordFailure() {
    this.failureCount++;
    if (this.failureCount >= 5) {
      this.open();
    }
  }

  recordSuccess() {
    this.failureCount = 0;
    this.close();
  }

  private open() {
    this.isOpen = true;
    this.openTime = Date.now();
  }

  canAttempt(): boolean {
    if (!this.isOpen) return true;

    // Reintenta después de 30 segundos
    if (Date.now() - this.openTime > 30000) {
      this.close();
      return true;
    }

    return false;
  }
}
```

### 2. **Deduplicación con Map Complejo**
**Problema**: Map de fingerprints con cleanup periódico y gestión de memoria

**Archivos afectados**:
- `event.manager.ts` (métodos: getEventFingerprint, isDuplicatedEvent, manageFingerprintMemory, cleanupOldFingerprints, aggressiveFingerprintCleanup)

**Complejidad innecesaria**:
- Map almacenando historial completo
- Cleanup periódico por tiempo
- Cleanup agresivo por límite
- Tracking de último cleanup

**Solución simple**:
```typescript
// Solo comparar con último evento
private lastEvent: EventData | null = null;

private isDuplicate(newEvent: Partial<EventData>): boolean {
  if (!this.lastEvent) return false;

  const timeDiff = Date.now() - this.lastEvent.timestamp;
  if (timeDiff > 1000) return false; // > 1 segundo

  // Comparación simple basada en tipo
  return this.isSameEvent(this.lastEvent, newEvent);
}
```

### 3. **Cross-Tab Session Complejo**
**Problema**: Sincronización compleja con BroadcastChannel y recuperación de estado

**Archivos afectados**:
- `cross-tab-session.manager.ts`
- `session-recovery.manager.ts`

**Complejidad innecesaria**:
- Sincronización de estado completo
- Recovery de eventos pendientes
- Detección de tab master
- Heartbeat entre tabs

**Solución simple**:
```typescript
// Solo sincronizar session_id
class SimpleCrossTab {
  private channel = new BroadcastChannel('tracelog_session');

  shareSession(sessionId: string) {
    this.channel.postMessage({ sessionId, timestamp: Date.now() });
  }

  listenSession(callback: (sessionId: string) => void) {
    this.channel.onmessage = (e) => {
      callback(e.data.sessionId);
    };
  }
}
```

### 4. **Sistema de Tags Condicional**
**Problema**: Evaluación de reglas complejas con condiciones

**Archivos afectados**:
- `tags.manager.ts`
- `types/tag.types.ts`

**Complejidad innecesaria**:
- Reglas condicionales
- Evaluación por evento
- Matching complejo
- Tags dinámicos

**Solución simple**:
```typescript
// Tags estáticos del proyecto
interface ProjectConfig {
  tags?: string[]; // Lista simple de tags
}

// Aplicar a todos los eventos
const payload: EventData = {
  ...event,
  tags: config.tags || []
};
```

### 5. **Sampling Granular**
**Problema**: Sampling por tipo de evento con ratios diferentes

**Archivos afectados**:
- `sampling.manager.ts`

**Complejidad innecesaria**:
- Ratio por tipo de evento
- Lógica de muestreo compleja
- Configuración granular

**Solución simple**:
```typescript
// Ratio global único
const shouldSample = Math.random() < (config.samplingRate || 1);
if (!shouldSample) return;
```

### 6. **Validaciones Excesivas**
**Problema**: Múltiples capas de validación con rollback completo

**Archivos afectados**:
- `app.ts` (validateStorageManager, validateState, validateEventManager, validateHandlersInitialized, rollbackInitialization)

**Complejidad innecesaria**:
- Validaciones granulares
- Rollback completo en error
- Try-catch múltiples capas

**Solución simple**:
```typescript
// Validaciones mínimas, degradación gradual
async init(config: AppConfig) {
  try {
    this.storage = new StorageManager();
    await this.setState(config);
    this.eventManager = new EventManager(this.storage);
    await this.initHandlers();
  } catch (error) {
    console.error('Init failed:', error);
    // Cleanup básico, no rollback completo
    this.eventManager?.stop();
  }
}
```

## 📊 Métricas de Complejidad

### Complejidad Ciclomática (estimada)
```
event.manager.ts:
  - sendEventsQueue(): 15+ (ALTA - refactorizar)
  - track(): 12+ (ALTA - refactorizar)
  - manageFingerprintMemory(): 8 (MEDIA - eliminar)
  - setupCircuitBreakerHealthCheck(): 6 (MEDIA - eliminar)

app.ts:
  - rollbackInitialization(): 10+ (ALTA - simplificar)
  - init(): 8+ (MEDIA - simplificar)

session.manager.ts:
  - handleSessionTimeout(): 8+ (MEDIA - refactorizar)
```

### Acoplamiento
```
ALTO ACOPLAMIENTO (refactorizar):
- EventManager → SamplingManager, TagsManager, BackoffManager
- SessionManager → CrossTabManager, RecoveryManager
- App → Múltiples validadores

BAJO ACOPLAMIENTO (mantener):
- StorageManager → Independiente
- Handlers → Solo dependen de EventManager
- Utils → Funciones puras
```

## 🎯 Objetivos Específicos del Refactor

### Reducción de Complejidad
```
ANTES:
- EventManager: ~900 líneas, 15+ métodos privados
- App: ~570 líneas, múltiples validaciones
- Circuit Breaker: Sistema completo con backoff

DESPUÉS:
- EventManager: ~400 líneas, 8 métodos privados
- App: ~300 líneas, validaciones mínimas
- Circuit Breaker: Contador simple, 30s retry
```

### Eliminación de Código Muerto
```
❌ ELIMINAR:
- Métodos de recovery no utilizados
- Constantes duplicadas
- Types redundantes
- Validaciones excesivas
- Backoff exponencial
- Fingerprints Map
- Recovery statistics
- Health check intervals
```

### Consolidación
```
CONSOLIDAR:
- 8 archivos constants → 4 archivos
- 16 archivos types → 10 archivos
- 12 managers → 8 managers
- 20 utils → 12 utils
```

## 🔄 Estrategia de Migración por Componente

### EventManager
```
FASE 1: Eliminar circuit breaker complejo
FASE 2: Simplificar deduplicación (Map → lastEvent)
FASE 3: Eliminar sampling/tags managers
FASE 4: Simplificar sendEventsQueue
FASE 5: Tests unitarios + E2E
```

### SessionManager
```
FASE 1: Simplificar cross-tab (sync básico)
FASE 2: Simplificar recovery (solo session_id)
FASE 3: Mantener timeout y session end
FASE 4: Tests unitarios + E2E
```

### SenderManager
```
FASE 1: Eliminar backoff exponencial
FASE 2: Retry con intervalo fijo
FASE 3: Mantener persistencia
FASE 4: Tests unitarios + E2E
```

### App
```
FASE 1: Simplificar init (menos validaciones)
FASE 2: Eliminar rollback completo
FASE 3: Degradación gradual
FASE 4: Tests de integración
```

### Handlers
```
FASE 1: Mantener handlers core (click, scroll, page-view, session, performance)
FASE 2: Simplificar error handler
FASE 3: Evaluar network handler
FASE 4: Tests E2E
```

### Utils
```
FASE 1: Mantener funciones puras
FASE 2: Eliminar fetch-with-timeout
FASE 3: Simplificar logging
FASE 4: Tests unitarios (coverage > 90%)
```

## 🧪 Plan de Testing Detallado

### Tests Unitarios (Vitest)
```typescript
// Utils (coverage > 90%)
- sanitize.utils.test.ts
- normalize.utils.test.ts
- hash.utils.test.ts
- device.utils.test.ts
- url.utils.test.ts
- validations.test.ts

// Managers (coverage > 80%)
- event-manager.test.ts (deduplicación, queue)
- session-manager.test.ts (timeout, session_id)
- storage-manager.test.ts (localStorage mock)
- user-manager.test.ts (user_id generation)

// Lógica de negocio
- circuit-breaker.test.ts (simple version)
- deduplication.test.ts
```

### Tests de Integración (Vitest)
```typescript
// Flujos completos
- event-flow.test.ts (track → queue → send)
- session-flow.test.ts (start → timeout → end)
- recovery-flow.test.ts (persist → recover)
- config-flow.test.ts (load → apply)
```

### Tests E2E (Playwright)
```typescript
// DTO Validation (CRÍTICO)
- dto-validation.spec.ts
- payload-structure.spec.ts

// Funcionalidad
- click-tracking.spec.ts
- scroll-tracking.spec.ts
- page-view-tracking.spec.ts
- session-management.spec.ts
- custom-events.spec.ts
- web-vitals.spec.ts
- deduplication.spec.ts
- persistence.spec.ts
```

## 📦 Dependencias a Evaluar

### Mantener
```json
{
  "web-vitals": "^4.2.4"  // Única dependencia runtime
}
```

### Agregar para Testing
```json
{
  "vitest": "latest",
  "@vitest/coverage-v8": "latest",
  "jsdom": "latest",
  "@types/node": "latest"
}
```

### Eliminar (si existen)
```
- Ninguna dependencia runtime adicional
- Mantener solo dev dependencies necesarias
```

## 🚀 Roadmap de Implementación

### Semana 1: Setup y Análisis
- [ ] Crear src_v2/
- [ ] Configurar Vitest
- [ ] Configurar build dual
- [ ] Tests base E2E/Unit
- [ ] Análisis de coverage actual

### Semana 2: Core Refactoring
- [ ] Simplificar EventManager
- [ ] Simplificar SessionManager
- [ ] Simplificar SenderManager
- [ ] Tests unitarios core

### Semana 3: Features y Utils
- [ ] Simplificar Tags/Sampling
- [ ] Consolidar Utils
- [ ] Consolidar Constants
- [ ] Tests unitarios utils

### Semana 4: Handlers y App
- [ ] Refactorizar Handlers
- [ ] Simplificar App
- [ ] Tests de integración
- [ ] Tests E2E completos

### Semana 5: Validación y Migración
- [ ] Coverage > 80%
- [ ] DTO validation
- [ ] Performance benchmarks
- [ ] Migración src_v2 → src
- [ ] Documentación final

## 📈 KPIs del Refactor

### Métricas de Código
- **LOC**: 15,000 → 8,000 (-47%)
- **Archivos**: 77 → 45 (-42%)
- **Complejidad ciclomática promedio**: 8 → 4 (-50%)
- **Acoplamiento**: Alto → Medio-Bajo

### Métricas de Testing
- **Coverage unitarios**: 0% → 85%+
- **Tests E2E**: Mantener 100%
- **Tests totales**: ~10 → 100+

### Métricas de Calidad
- **TypeScript errors**: 0
- **Lint warnings**: 0
- **Performance**: Igual o mejor
- **Bundle size**: Reducir 20-30%

---

**Última actualización**: 2025-09-24
**Responsable**: Equipo TraceLog
**Versión objetivo**: 2.0.0