# Guía de Implementación - TraceLog Refactor v2.0

## 🎯 Cómo Usar Esta Documentación

Esta guía te ayudará a implementar el refactor de forma ordenada y segura.

---

## 📋 Checklist Pre-Inicio

Antes de empezar cualquier tarea, verificar:

- [ ] He leído `README.md` (contexto general)
- [ ] He leído `ARCHITECTURE_ANALYSIS.md` (problemas actuales)
- [ ] He leído `DECISION_LOG.md` (decisiones tomadas)
- [ ] Entiendo qué NO debo modificar (EventData, API pública)
- [ ] Tengo `src_v2/` configurado (PHASE_1_SETUP.md)
- [ ] Tests E2E pasando en versión actual
- [ ] Vitest configurado y funcionando

---

## 🔄 Flujo de Trabajo por Tarea

### 1. Antes de Codear

```bash
# 1. Crear branch para la tarea
git checkout -b refactor/task-X-nombre-tarea

# 2. Leer documentación de la tarea
cat _REFACTOR_TASKS/TASK_X_*.md

# 3. Verificar estado actual
npm run build:v2
npm run test:e2e:v2
```

### 2. Durante el Desarrollo

```bash
# 1. Desarrollo con watch
npm run dev:v2

# 2. Tests en watch (otra terminal)
npm run test:unit:watch

# 3. Verificar cambios frecuentemente
npm run check:v2
```

### 3. Después de Codear

```bash
# 1. Tests completos
npm run test:all:v2

# 2. Validar coverage
npm run test:coverage

# 3. Comparar outputs
npm run compare-output

# 4. Build final
npm run build:v2

# 5. Commit
git add .
git commit -m "refactor(task-X): descripción"
```

---

## 🧪 Estrategia de Testing

### Orden de Tests (TDD Recomendado)

1. **Tests Unitarios PRIMERO** (funciones puras)
   ```typescript
   // tests/unit/utils/nuevo-util.test.ts
   describe('newUtil', () => {
     test('should work', () => {
       expect(newUtil(input)).toBe(expected);
     });
   });
   ```

2. **Tests de Integración SEGUNDO** (componentes)
   ```typescript
   // tests/integration/manager-flow.test.ts
   describe('Manager Integration', () => {
     test('should integrate', async () => {
       const manager = new Manager();
       await manager.process();
       expect(manager.state).toBe('done');
     });
   });
   ```

3. **Tests E2E ÚLTIMO** (validación final)
   ```typescript
   // tests/e2e/feature.spec.ts
   test('should work end-to-end', async ({ page }) => {
     await page.goto('/');
     await page.click('button');
     expect(payload).toMatchStructure();
   });
   ```

### Cobertura Mínima por Tipo

```
Utils:       90%+ ✅ (funciones puras)
Managers:    80%+ ✅ (lógica core)
Handlers:    70%+ ⚠️ (complementar con E2E)
Integration: 100%  ✅ (flujos críticos)
E2E:         100%  ✅ (DTO validation)
```

---

## 🔍 Patrones de Código

### ✅ Patrón: Función Pura (Utils)

```typescript
// ✅ BIEN: Función pura, fácil de testear
export function sanitizeMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const sanitized = { ...metadata };

  // Remover campos sensibles
  SENSITIVE_FIELDS.forEach(field => delete sanitized[field]);

  // Limitar tamaño
  const str = JSON.stringify(sanitized);
  if (str.length > MAX_SIZE) {
    return { _truncated: true };
  }

  return sanitized;
}

// ❌ MAL: Efectos secundarios, difícil de testear
export function sanitizeMetadata(metadata: any) {
  SENSITIVE_FIELDS.forEach(field => {
    if (metadata[field]) {
      metadata[field] = '[REDACTED]'; // ❌ Mutación
    }
  });

  localStorage.setItem('last', JSON.stringify(metadata)); // ❌ Side effect

  return metadata;
}
```

### ✅ Patrón: Manager Simple

```typescript
// ✅ BIEN: Manager simple, único propósito
export class EventManager extends StateManager {
  private queue: EventData[] = [];
  private lastEvent: EventData | null = null;

  track(event: Partial<EventData>): void {
    if (this.isDuplicate(event)) {
      this.updateLastEventTimestamp();
      return;
    }

    this.queue.push(this.buildEvent(event));
    this.lastEvent = event;
  }

  private isDuplicate(event: Partial<EventData>): boolean {
    if (!this.lastEvent) return false;
    return this.isSameEvent(this.lastEvent, event);
  }
}

// ❌ MAL: Manager con múltiples responsabilidades
export class EventManager {
  track() { /* ... */ }
  send() { /* ... */ }
  persist() { /* ... */ }
  recover() { /* ... */ }
  validate() { /* ... */ }
  sanitize() { /* ... */ }
  // ❌ Demasiadas responsabilidades
}
```

### ✅ Patrón: Error Handling con Degradación

```typescript
// ✅ BIEN: Degradación gradual
async init(config: AppConfig) {
  this.storage = new StorageManager();

  try {
    await this.setConfig(config);
  } catch (error) {
    console.warn('Config failed, using defaults:', error);
    this.config = DEFAULT_CONFIG;
  }

  try {
    this.analytics = new GoogleAnalytics();
  } catch (error) {
    console.warn('Analytics failed, continuing without:', error);
    this.analytics = null; // ✅ Continúa sin GA
  }

  this.eventManager = new EventManager(this.storage);
}

// ❌ MAL: Rollback completo
async init(config: AppConfig) {
  try {
    this.storage = new StorageManager();
    await this.setConfig(config);
    this.analytics = new GoogleAnalytics();
    this.eventManager = new EventManager(this.storage);
  } catch (error) {
    await this.rollbackEverything(); // ❌ Todo o nada
    throw error;
  }
}
```

### ✅ Patrón: Deduplicación Simple

```typescript
// ✅ BIEN: Comparación con último evento
private isDuplicate(newEvent: Partial<EventData>): boolean {
  if (!this.lastEvent) return false;

  const timeDiff = Date.now() - this.lastEvent.timestamp;
  if (timeDiff > DUPLICATE_THRESHOLD) return false;

  // Comparación específica por tipo
  if (newEvent.type !== this.lastEvent.type) return false;

  if (newEvent.click_data && this.lastEvent.click_data) {
    return this.areClicksSimilar(newEvent.click_data, this.lastEvent.click_data);
  }

  return true;
}

// ❌ MAL: Map complejo con cleanup
private isDuplicate(event: Partial<EventData>): boolean {
  const fingerprint = this.generateFingerprint(event);
  const lastTime = this.fingerprintMap.get(fingerprint);

  if (Date.now() - lastTime < THRESHOLD) {
    return true;
  }

  this.fingerprintMap.set(fingerprint, Date.now());
  this.manageMemory(); // ❌ Complejidad innecesaria
  this.cleanup(); // ❌ Gestión memoria manual

  return false;
}
```

---

## 🚫 Anti-Patrones a Evitar

### ❌ Anti-Patrón 1: Validación Excesiva

```typescript
// ❌ MAL: Validaciones granulares excesivas
private validateState(): void {
  if (!this.apiUrl) throw new Error('apiUrl missing');
  if (!this.config) throw new Error('config missing');
  if (!this.userId) throw new Error('userId missing');
  if (!this.device) throw new Error('device missing');
  if (!this.pageUrl) throw new Error('pageUrl missing');
  // ... 10 validaciones más
}

// ✅ BIEN: Validaciones mínimas críticas
private validateState(): void {
  if (!this.config?.id) {
    throw new Error('Project ID required');
  }
  // Solo lo crítico
}
```

### ❌ Anti-Patrón 2: Abstracción Prematura

```typescript
// ❌ MAL: Abstracción innecesaria
interface IEventProcessor {
  process(event: Event): ProcessedEvent;
}

class EventProcessorFactory {
  create(type: string): IEventProcessor { /* ... */ }
}

class ClickEventProcessor implements IEventProcessor { /* ... */ }
class ScrollEventProcessor implements IEventProcessor { /* ... */ }

// ✅ BIEN: Solución directa
function processEvent(event: EventData): void {
  switch (event.type) {
    case 'click': return processClick(event);
    case 'scroll': return processScroll(event);
  }
}
```

### ❌ Anti-Patrón 3: Configuración Compleja

```typescript
// ❌ MAL: Config con múltiples capas
interface Config {
  circuit: {
    maxFailures: number;
    recoveryTime: number;
    backoff: {
      initial: number;
      max: number;
      multiplier: number;
    };
    healthCheck: {
      interval: number;
      timeout: number;
    };
  };
  // ... más anidación
}

// ✅ BIEN: Config plana simple
interface Config {
  id: string;
  maxRetries?: number; // default: 3
  retryDelay?: number; // default: 5000ms
}
```

---

## 📦 Guía de Imports

### Orden de Imports

```typescript
// 1. Node/External
import { defineConfig } from 'vitest';

// 2. Types
import type { EventData, AppConfig } from './types';

// 3. Managers/Classes
import { EventManager } from './managers/event.manager';

// 4. Utils
import { sanitize, normalize } from './utils';

// 5. Constants
import { API_URL, TIMEOUT } from './constants';

// 6. Relative (evitar si es posible)
import { helper } from '../utils/helper';
```

### Alias Path (@)

```typescript
// ✅ BIEN: Usar alias @ configurado
import { EventManager } from '@/managers/event.manager';
import { sanitize } from '@/utils/data/sanitize.utils';

// ❌ MAL: Imports relativos complejos
import { EventManager } from '../../../managers/event.manager';
```

---

## 🔄 Workflow de Refactor Específico

### Refactorizar un Manager

```bash
# 1. Copiar manager a src_v2
cp src/managers/event.manager.ts src_v2/managers/event.manager.ts

# 2. Crear tests unitarios
touch tests/unit/managers/event-manager.test.ts

# 3. Escribir tests para comportamiento actual
npm run test:unit:watch

# 4. Refactorizar manteniendo tests verdes
# ... hacer cambios incrementales

# 5. Verificar E2E
npm run test:e2e:v2

# 6. Verificar DTO
npm run compare-output
```

### Consolidar Types

```bash
# 1. Identificar types a consolidar
# Ejemplo: validation-error.types.ts → common.types.ts

# 2. Copiar contenido
cat src/types/validation-error.types.ts >> src_v2/types/common.types.ts

# 3. Actualizar imports
# Buscar todos los archivos que importan validation-error.types.ts
rg "from.*validation-error.types" src_v2/

# 4. Reemplazar imports
# Usar VSCode refactor o sed

# 5. Eliminar archivo antiguo
rm src_v2/types/validation-error.types.ts

# 6. Verificar build
npm run build:v2
```

### Simplificar Lógica Compleja

```bash
# 1. Identificar método complejo (ej: sendEventsQueue)

# 2. Escribir tests para casos actuales
# tests/unit/managers/event-manager.test.ts
describe('sendEventsQueue', () => {
  test('should send when circuit open', () => { /* ... */ });
  test('should retry on failure', () => { /* ... */ });
});

# 3. Extraer lógica a funciones más simples
# Dividir sendEventsQueue() en:
# - canSendEvents()
# - buildPayload()
# - sendWithRetry()

# 4. Refactorizar manteniendo tests verdes

# 5. Eliminar código muerto
# Comentar código viejo, verificar tests, luego eliminar
```

---

## 🎯 Criterios de Éxito por Tarea

### Para Cada Tarea Completada

- [ ] **Compilación**: `npm run build:v2` exitoso
- [ ] **Lint**: `npm run check:v2` sin errores
- [ ] **Tests Unitarios**: Nuevos tests pasando + coverage > 80%
- [ ] **Tests E2E**: `npm run test:e2e:v2` pasando (100%)
- [ ] **DTO Validation**: `npm run compare-output` sin diferencias
- [ ] **Documentación**: Código documentado, decisiones en DECISION_LOG.md
- [ ] **Review**: Self-review del código antes de commit

### Para Migración Final

- [ ] **Todas las tareas**: Completadas y verificadas
- [ ] **Coverage Global**: > 80% en funciones críticas
- [ ] **Performance**: Benchmarks iguales o mejores
- [ ] **Bundle Size**: Reducción de 20-30%
- [ ] **E2E 100%**: Todos los tests E2E pasando
- [ ] **DTO Byte-Identical**: EventData estructura exacta
- [ ] **No Breaking Changes**: API pública intacta
- [ ] **Docs Actualizadas**: README, CLAUDE.md actualizados

---

## 🐛 Debugging y Troubleshooting

### Tests Fallan Después de Cambios

```bash
# 1. Identificar qué falló
npm run test:all:v2 -- --reporter=verbose

# 2. Ejecutar solo el test que falla
npm run test:unit -- tests/unit/path/to/test.test.ts

# 3. Debug con breakpoints
# Agregar: debugger; en el código
npm run test:unit -- --inspect-brk

# 4. Comparar con versión anterior
git diff src/file.ts src_v2/file.ts
```

### DTO Structure Cambió

```bash
# 1. Ejecutar comparación
npm run compare-output

# 2. Ver diferencias específicas
diff <(cat src/types/event.types.ts) <(cat src_v2/types/event.types.ts)

# 3. Verificar payload real
npm run test:e2e:v2 -- --debug

# 4. Revertir cambios en event.types.ts
git checkout src_v2/types/event.types.ts
```

### Build Falla

```bash
# 1. Limpiar dist
rm -rf dist_v2

# 2. Verificar TypeScript
npx tsc -p tsconfig.v2.json --noEmit

# 3. Ver errores específicos
npm run build:v2 2>&1 | grep error

# 4. Verificar imports circulares
npx madge --circular src_v2/
```

### Coverage Bajo

```bash
# 1. Ver reporte detallado
npm run test:coverage -- --reporter=html
open coverage/index.html

# 2. Identificar archivos sin coverage
npm run test:coverage | grep -E "^\s+0\s+"

# 3. Agregar tests para funciones no cubiertas
# Priorizar: utils > managers > handlers
```

---

## 📚 Recursos Útiles

### Comandos Rápidos

```bash
# Ver archivos modificados en src_v2
git status src_v2/

# Buscar TODOs en el código
rg "TODO|FIXME" src_v2/

# Contar líneas de código
cloc src_v2/

# Ver dependencias de un archivo
npx madge src_v2/managers/event.manager.ts

# Buscar referencias a una función
rg "functionName" src_v2/

# Ver coverage de un archivo específico
npm run test:coverage -- tests/unit/utils/sanitize.test.ts
```

### Links de Documentación

- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Web Vitals](https://web.dev/vitals/)

---

## ✅ Checklist Final Pre-Commit

Antes de cada commit, verificar:

```bash
# 1. Build exitoso
npm run build:v2

# 2. Todos los tests pasando
npm run test:all:v2

# 3. Coverage adecuado
npm run test:coverage

# 4. Lint y formato
npm run check:v2

# 5. DTO sin cambios
npm run compare-output

# 6. Commit descriptivo
git commit -m "refactor(scope): descripción clara

- Cambio 1
- Cambio 2
- Refs: #issue-number"
```

---

**Última actualización**: 2025-09-24
**Próxima revisión**: Al completar Fase 1