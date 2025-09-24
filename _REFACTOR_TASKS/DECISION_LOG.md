# Decision Log - TraceLog Refactor v2.0

## 📋 Registro de Decisiones Arquitectónicas

Este documento registra todas las decisiones importantes tomadas durante el refactor.

---

## [DR-001] Desarrollo Paralelo en src_v2/

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Necesitamos refactorizar sin afectar la versión actual en producción.

### Decisión
Crear carpeta `src_v2/` para desarrollo paralelo hasta completar y validar el refactor.

### Consecuencias
✅ **Pros**:
- Código actual intacto hasta migración final
- Comparación fácil entre versiones
- Rollback inmediato si falla
- Testing paralelo

❌ **Contras**:
- Duplicación temporal de código
- Más espacio en disco
- Complejidad en configuración build

### Alternativas Consideradas
1. Feature branches Git → Descartado (dificulta comparación)
2. Modificar src/ directamente → Descartado (muy arriesgado)

---

## [DR-002] Mantener EventData DTO Intacto

**Fecha**: 2025-09-24
**Estado**: 🔒 Crítico - NO NEGOCIABLE

### Contexto
El DTO `EventData` es el contrato con el backend. Cualquier cambio rompe compatibilidad.

### Decisión
`src/types/event.types.ts` NO se modifica. Estructura byte-identical.

### Consecuencias
✅ **Pros**:
- Compatibilidad backend garantizada
- No breaking changes
- Migración transparente

❌ **Contras**:
- Limitación en refactor de types
- Mantener campos legacy

### Validación
- Test E2E validando estructura exacta
- Script de comparación automático
- Review manual pre-migración

---

## [DR-003] Circuit Breaker Simple vs Complejo

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Circuit breaker actual tiene backoff exponencial, health checks, recovery automático (~300 LOC).

### Decisión
Reemplazar con versión simple: contador de fallos + pausa temporal.

### Implementación
```typescript
// ANTES: ~300 líneas con backoff exponencial
class ComplexCircuitBreaker {
  backoffManager, healthCheck, recoveryAttempts, statistics...
}

// DESPUÉS: ~50 líneas
class SimpleCircuitBreaker {
  failureCount, isOpen, openTime
  - recordFailure()
  - recordSuccess()
  - canAttempt()
}
```

### Consecuencias
✅ **Pros**:
- 85% menos código
- Fácil debug
- Suficiente para v1

❌ **Contras**:
- Menos sofisticado
- Sin backoff exponencial

### Justificación
Para v1, retry simple es suficiente. Backoff exponencial añade complejidad innecesaria.

---

## [DR-004] Deduplicación: Map → Último Evento

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Sistema actual usa Map de fingerprints con cleanup periódico de memoria.

### Decisión
Comparar solo con último evento, threshold temporal 1 segundo.

### Implementación
```typescript
// ANTES: Map con cleanup
eventFingerprints = new Map<string, number>();
- manageFingerprintMemory()
- cleanupOldFingerprints()
- aggressiveFingerprintCleanup()

// DESPUÉS: Comparación simple
lastEvent: EventData | null;
- isDuplicate(newEvent) // Compara con lastEvent
```

### Consecuencias
✅ **Pros**:
- Sin gestión de memoria
- 90% menos código
- Más rápido (O(1) vs O(n))

❌ **Contras**:
- No detecta A→B→A duplicados
- Solo duplicados consecutivos

### Justificación
Casos edge (A→B→A) son raros. Simplicidad > cobertura 100%.

---

## [DR-005] Cross-Tab Session: Complejo → Básico

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Sincronización actual incluye estado completo, recovery, detección master tab.

### Decisión
Sincronizar solo `session_id` y `timestamp` vía BroadcastChannel.

### Implementación
```typescript
// ANTES: Sincronización completa
- Estado completo entre tabs
- Detección de tab master
- Recovery de eventos
- Heartbeat

// DESPUÉS: Sync básico
channel.postMessage({ sessionId, timestamp });
```

### Consecuencias
✅ **Pros**:
- 80% menos código
- Más confiable
- Menos edge cases

❌ **Contras**:
- Cada tab maneja su queue independiente
- Posible duplicación entre tabs

### Justificación
Duplicación cross-tab es aceptable. Simplicidad > sincronización perfecta.

---

## [DR-006] Tags: Condicionales → Estáticos

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Sistema actual evalúa reglas condicionales por evento.

### Decisión
Tags estáticos por proyecto, aplicados a todos los eventos.

### Implementación
```typescript
// ANTES: Evaluación condicional
tags: [
  { key: 'vip', condition: 'user.revenue > 1000' },
  { key: 'mobile', condition: 'device === mobile' }
]

// DESPUÉS: Lista simple
tags: ['analytics', 'production']
```

### Consecuencias
✅ **Pros**:
- Sin evaluación runtime
- Configuración simple
- 100% menos código

❌ **Contras**:
- Sin tags dinámicos
- Tags aplicados a todo

### Justificación
Tags dinámicos añaden complejidad. Para v1, tags estáticos son suficientes.

---

## [DR-007] Sampling: Granular → Global

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Sampling actual permite ratios diferentes por tipo de evento.

### Decisión
Un solo ratio global para todos los eventos.

### Implementación
```typescript
// ANTES: Granular
{
  errorSampling: 0.1,
  clickSampling: 1.0,
  scrollSampling: 0.5
}

// DESPUÉS: Global
{ samplingRate: 0.8 } // 80% de todos los eventos
```

### Consecuencias
✅ **Pros**:
- Configuración simple
- Sin lógica por tipo
- Fácil de entender

❌ **Contras**:
- Sin control granular
- Mismo ratio para todo

### Justificación
Control granular añade complejidad. Ratio global es suficiente.

---

## [DR-008] Error Handling: Rollback → Degradación Gradual

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Sistema actual hace rollback completo si cualquier componente falla.

### Decisión
Degradación gradual: si algo falla, continuar con lo que funciona.

### Implementación
```typescript
// ANTES: Rollback completo
try {
  init()
} catch {
  rollbackInitialization() // Limpia TODO
}

// DESPUÉS: Degradación gradual
try {
  this.storage = new StorageManager();
} catch {
  console.warn('Storage failed, using memory only');
}

try {
  this.googleAnalytics = new GA();
} catch {
  console.warn('GA failed, continuing without');
}
```

### Consecuencias
✅ **Pros**:
- Más resiliente
- Funcionalidad parcial mejor que nada
- Menos errores bloqueantes

❌ **Contras**:
- Estado potencialmente incompleto
- Más casos edge

### Justificación
Mejor funcionalidad parcial que error completo.

---

## [DR-009] Logging: Sistema Complejo → Logger Simple

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Sistema actual tiene múltiples niveles, formatters, transports.

### Decisión
Logger simple con 3 niveles: error, warn, info (+ debug en dev).

### Implementación
```typescript
// ANTES: Sistema complejo
logger.trace(), .debug(), .info(), .warn(), .error(), .fatal()
+ formatters, transports, rotating files

// DESPUÉS: Simple
debugLog.error(), .warn(), .info(), .debug()
```

### Consecuencias
✅ **Pros**:
- Menos configuración
- Suficiente para debugging
- Integración console simple

❌ **Contras**:
- Sin logging avanzado
- Sin rotating files

### Justificación
Para librería cliente, console.log es suficiente.

---

## [DR-010] Tests: Solo E2E → Unit + Integration + E2E

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Actualmente solo tests E2E con Playwright.

### Decisión
Agregar tests unitarios (Vitest) y de integración.

### Implementación
```
tests/
├── unit/              → Vitest (utils, lógica)
├── integration/       → Vitest (componentes)
└── e2e/               → Playwright (flujo completo)
```

### Consecuencias
✅ **Pros**:
- Cobertura > 80%
- Tests rápidos (unit)
- Mejor detección bugs
- TDD posible

❌ **Contras**:
- Más tests a mantener
- Setup adicional

### Justificación
Coverage actual 0% es inaceptable. Tests unitarios esenciales.

---

## [DR-011] Fetch Timeout: Custom → AbortController

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Utility `fetchWithTimeout` implementa timeout custom.

### Decisión
Usar `AbortController` nativo del browser.

### Implementación
```typescript
// ANTES: fetchWithTimeout custom
async function fetchWithTimeout(url, timeout) {
  return Promise.race([fetch(url), timeoutPromise(timeout)]);
}

// DESPUÉS: AbortController nativo
async function fetchWithAbort(url, timeout) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal });
}
```

### Consecuencias
✅ **Pros**:
- API nativa
- Mejor cancelación
- Menos código custom

❌ **Contras**:
- Requiere polyfill para navegadores antiguos

### Justificación
API nativa es más confiable que implementación custom.

---

## [DR-012] Types: 16 archivos → 10 archivos

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
16 archivos de types con duplicación y fragmentación excesiva.

### Decisión
Consolidar types relacionados, mantener separación lógica.

### Implementación
```
ANTES (16 archivos):
- event.types.ts
- validation-error.types.ts
- queue.types.ts
- tag.types.ts
- mode.types.ts
- log.types.ts
- web-vitals.types.ts
- ... (9 más)

DESPUÉS (10 archivos):
- event.types.ts (NO MODIFICAR)
- config.types.ts (+ mode)
- state.types.ts
- session.types.ts
- api.types.ts (+ queue)
- device.types.ts
- common.types.ts (+ validation-error)
- window.types.ts
- (2-3 más esenciales)
```

### Consecuencias
✅ **Pros**:
- Menos imports
- Types agrupados lógicamente
- Menos archivos

❌ **Contras**:
- Archivos ligeramente más grandes

### Justificación
Consolidación mejora mantenibilidad sin sacrificar claridad.

---

## [DR-013] Constants: 8+ archivos → 4 archivos

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Constantes fragmentadas en múltiples archivos pequeños.

### Decisión
Consolidar en 4 archivos por dominio.

### Implementación
```
ANTES (8+ archivos):
- api.constants.ts
- backoff.constants.ts
- security.constants.ts
- validation.constants.ts
- browser.constants.ts
- storage.constants.ts
- timing.constants.ts
- limits.constants.ts

DESPUÉS (4 archivos):
- api.constants.ts (URLs, endpoints)
- config.constants.ts (defaults, limits)
- timing.constants.ts (timeouts, intervals)
- storage.constants.ts (keys, prefixes)
```

### Consecuencias
✅ **Pros**:
- Fácil encontrar constantes
- Menos archivos
- Agrupación lógica

❌ **Contras**:
- Archivos más grandes

### Justificación
4 archivos bien organizados > 8+ fragmentados.

---

## [DR-014] Performance: Mantener web-vitals

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
`web-vitals` es única dependencia runtime (~3KB gzipped).

### Decisión
Mantener dependencia, no reimplementar.

### Justificación
- ✅ Librería oficial Google
- ✅ Bien mantenida
- ✅ Tamaño aceptable
- ✅ Reimplementar sería ~5KB más código custom

### Alternativas Consideradas
1. Reimplementar → Descartado (más código, menos confiable)
2. Eliminar web vitals → Descartado (feature core)

---

## [DR-015] Build: Mantener Vite + TypeScript

**Fecha**: 2025-09-24
**Estado**: ✅ Aprobado

### Contexto
Build actual usa Vite + TypeScript.

### Decisión
Mantener herramientas, optimizar configuración.

### Justificación
- ✅ Vite es rápido y moderno
- ✅ TypeScript es core del proyecto
- ✅ No hay razón para cambiar

### Optimizaciones
- Mejorar tree-shaking
- Reducir bundle size 20-30%
- Optimizar sourcemaps

---

## 📊 Resumen de Decisiones

### Por Categoría

**Arquitectura** (5):
- DR-001: Desarrollo paralelo src_v2/
- DR-002: EventData intacto
- DR-008: Degradación gradual
- DR-015: Build Vite + TypeScript

**Simplificación** (7):
- DR-003: Circuit breaker simple
- DR-004: Deduplicación último evento
- DR-005: Cross-tab básico
- DR-006: Tags estáticos
- DR-007: Sampling global
- DR-009: Logger simple
- DR-011: AbortController

**Testing** (1):
- DR-010: Unit + Integration + E2E

**Organización** (2):
- DR-012: Consolidar types
- DR-013: Consolidar constants

**Dependencies** (1):
- DR-014: Mantener web-vitals

### Impacto en LOC
```
Circuit breaker:   ~300 → ~50   (-83%)
Deduplicación:     ~200 → ~30   (-85%)
Cross-tab:         ~250 → ~40   (-84%)
Tags:              ~180 → ~20   (-89%)
Sampling:          ~120 → ~15   (-87%)
Validaciones:      ~150 → ~40   (-73%)

TOTAL ESTIMADO:    ~15,000 → ~8,000 (-47%)
```

---

**Última actualización**: 2025-09-24
**Próxima revisión**: Al completar cada fase