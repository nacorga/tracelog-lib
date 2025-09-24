# Fase 2.1: Refactorizar EventManager

## 🎯 Objetivo
Simplificar EventManager eliminando complejidad innecesaria mientras se mantiene toda la funcionalidad core.

## 📋 Tareas

### 1. Simplificar Circuit Breaker

#### Eliminar del EventManager
```typescript
// ELIMINAR propiedades:
private failureCount = 0;
private readonly MAX_FAILURES = CIRCUIT_BREAKER_CONSTANTS.MAX_FAILURES;
private circuitOpen = false;
private circuitOpenTime = 0;
private readonly backoffManager: BackoffManager;
private circuitResetTimeoutId: ReturnType<typeof setTimeout> | null = null;
private circuitRecoveryAttempts = 0;
private readonly MAX_RECOVERY_ATTEMPTS = 5;
private circuitBreakerHealthCheckInterval: number | null = null;
private readonly errorRecoveryStats = { ... };

// ELIMINAR imports:
import { BackoffManager } from '../utils';
import {
  CIRCUIT_BREAKER_CONSTANTS,
  BACKOFF_CONFIGS,
  CIRCUIT_BREAKER_MAX_STUCK_TIME_MS,
  CIRCUIT_BREAKER_HEALTH_CHECK_INTERVAL_MS,
} from '../constants';

// ELIMINAR métodos completos:
- setupCircuitBreakerHealthCheck()
- openCircuitBreaker()
- handleCircuitBreakerRecovery()
- scheduleCircuitBreakerRetry()
- resetCircuitBreaker()
- notifyCircuitBreakerPermanentFailure()
- getRecoveryStats()
- attemptSystemRecovery()
- shouldAttemptRecovery()
```

#### Crear SimpleCircuitBreaker
```typescript
// src_v2/utils/simple-circuit-breaker.ts
export class SimpleCircuitBreaker {
  private failureCount = 0;
  private isOpen = false;
  private openTime = 0;

  private readonly MAX_FAILURES = 5;
  private readonly RECOVERY_DELAY_MS = 30000; // 30 segundos

  recordFailure(): void {
    this.failureCount++;

    if (this.failureCount >= this.MAX_FAILURES) {
      this.open();
    }
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.close();
  }

  canAttempt(): boolean {
    if (!this.isOpen) return true;

    const timeSinceOpen = Date.now() - this.openTime;

    if (timeSinceOpen >= this.RECOVERY_DELAY_MS) {
      this.close();
      return true;
    }

    return false;
  }

  private open(): void {
    this.isOpen = true;
    this.openTime = Date.now();
    console.warn('Circuit breaker opened - too many failures');
  }

  private close(): void {
    this.isOpen = false;
    this.openTime = 0;
    this.failureCount = 0;
  }

  getState(): { isOpen: boolean; failureCount: number } {
    return {
      isOpen: this.isOpen,
      failureCount: this.failureCount,
    };
  }
}
```

#### Integrar en EventManager
```typescript
// src_v2/managers/event.manager.ts
import { SimpleCircuitBreaker } from '../utils/simple-circuit-breaker';

export class EventManager extends StateManager {
  private circuitBreaker = new SimpleCircuitBreaker();

  // En track()
  track(event: Partial<EventData>): void {
    if (!this.circuitBreaker.canAttempt()) {
      debugLog.warn('EventManager', 'Event dropped - circuit breaker open');
      return;
    }
    // ... resto del código
  }

  // En sendEventsQueue()
  private async sendEventsQueue(): Promise<void> {
    if (!this.circuitBreaker.canAttempt()) {
      return;
    }

    await this.dataSender.sendEventsQueue(body, {
      onSuccess: () => {
        this.circuitBreaker.recordSuccess();
        // ... resto
      },
      onFailure: () => {
        this.circuitBreaker.recordFailure();
        // ... resto
      },
    });
  }
}
```

### 2. Simplificar Deduplicación

#### Eliminar Map de Fingerprints
```typescript
// ELIMINAR:
private readonly eventFingerprints = new Map<string, number>();
private lastFingerprintCleanup = Date.now();

// ELIMINAR constantes:
import {
  MAX_FINGERPRINTS,
  FINGERPRINT_CLEANUP_MULTIPLIER,
  MAX_FINGERPRINTS_HARD_LIMIT,
  FINGERPRINT_CLEANUP_INTERVAL_MS,
  CLICK_COORDINATE_PRECISION,
} from '../constants';

// ELIMINAR métodos:
- getEventFingerprint()
- manageFingerprintMemory()
- aggressiveFingerprintCleanup()
- cleanupOldFingerprints()
```

#### Implementar Comparación Simple
```typescript
// src_v2/managers/event.manager.ts

export class EventManager extends StateManager {
  private lastEvent: EventData | null = null;

  private isDuplicate(newEvent: Partial<EventData>): boolean {
    if (!this.lastEvent) return false;

    const timeDiff = Date.now() - this.lastEvent.timestamp;
    if (timeDiff > DUPLICATE_EVENT_THRESHOLD_MS) return false;

    // Mismo tipo y URL
    if (this.lastEvent.type !== newEvent.type) return false;
    if (this.lastEvent.page_url !== newEvent.page_url) return false;

    // Comparación específica por tipo
    if (newEvent.click_data && this.lastEvent.click_data) {
      return this.areClicksSimilar(
        newEvent.click_data,
        this.lastEvent.click_data
      );
    }

    if (newEvent.scroll_data && this.lastEvent.scroll_data) {
      return this.areScrollsSimilar(
        newEvent.scroll_data,
        this.lastEvent.scroll_data
      );
    }

    if (newEvent.custom_event && this.lastEvent.custom_event) {
      return newEvent.custom_event.name === this.lastEvent.custom_event.name;
    }

    if (newEvent.web_vitals && this.lastEvent.web_vitals) {
      return newEvent.web_vitals.type === this.lastEvent.web_vitals.type;
    }

    return true;
  }

  private areClicksSimilar(
    click1: ClickData,
    click2: ClickData
  ): boolean {
    const TOLERANCE = 5; // 5px tolerance
    const xDiff = Math.abs((click1.x || 0) - (click2.x || 0));
    const yDiff = Math.abs((click1.y || 0) - (click2.y || 0));

    return xDiff < TOLERANCE && yDiff < TOLERANCE;
  }

  private areScrollsSimilar(
    scroll1: ScrollData,
    scroll2: ScrollData
  ): boolean {
    return (
      scroll1.depth === scroll2.depth &&
      scroll1.direction === scroll2.direction
    );
  }
}
```

### 3. Eliminar Managers Dependientes

#### Eliminar SamplingManager
```typescript
// ELIMINAR:
import { SamplingManager } from './sampling.manager';

private readonly samplingManager: SamplingManager;

// En constructor:
this.samplingManager = new SamplingManager();

// En track():
if (!this.samplingManager.shouldSampleEvent(type as EventType, web_vitals)) {
  debugLog.debug('EventManager', 'Event filtered by sampling', { type });
  return;
}
```

#### Implementar Sampling Global Simple
```typescript
// src_v2/managers/event.manager.ts

export class EventManager extends StateManager {
  private shouldSample(): boolean {
    const samplingRate = this.get('config')?.samplingRate ?? 1;
    return Math.random() < samplingRate;
  }

  track(event: Partial<EventData>): void {
    if (!this.shouldSample()) {
      debugLog.debug('EventManager', 'Event filtered by sampling');
      return;
    }
    // ... resto
  }
}
```

#### Eliminar TagsManager
```typescript
// ELIMINAR:
import { TagsManager } from './tags.manager';

private readonly tagsManager: TagsManager;

// En constructor:
this.tagsManager = new TagsManager();

// En track():
if (this.get('config')?.tags?.length) {
  const matchedTags = this.tagsManager.getEventTagsIds(payload, this.get('device'));
  if (matchedTags?.length) {
    payload.tags = matchedTags;
  }
}
```

#### Implementar Tags Estáticos
```typescript
// src_v2/managers/event.manager.ts

track(event: Partial<EventData>): void {
  // ... construcción del payload

  // Tags estáticos del proyecto
  const projectTags = this.get('config')?.tags;
  if (projectTags?.length) {
    payload.tags = projectTags;
  }

  this.lastEvent = payload;
  this.processAndSend(payload);
}
```

### 4. Simplificar Métodos

#### Simplificar recoverPersistedEvents()
```typescript
// REEMPLAZAR método completo
async recoverPersistedEvents(): Promise<void> {
  await this.dataSender.recoverPersistedEvents({
    onSuccess: (eventCount, recoveredEvents) => {
      if (recoveredEvents && recoveredEvents.length > 0) {
        const eventIds = recoveredEvents.map((e) => e.timestamp + '_' + e.type);
        this.removeProcessedEvents(eventIds);

        debugLog.debug('EventManager', 'Removed recovered events from queue', {
          removedCount: recoveredEvents.length,
          remainingQueueLength: this.eventsQueue.length,
        });
      }

      debugLog.info('EventManager', 'Events recovered successfully', {
        eventCount: eventCount || 0,
      });
    },
    onFailure: async () => {
      debugLog.warn('EventManager', 'Failed to recover persisted events');
    },
  });
}
```

#### Simplificar sendEventsQueue()
```typescript
private async sendEventsQueue(): Promise<void> {
  // Validaciones básicas
  if (!this.get('sessionId')) {
    debugLog.debug('EventManager', 'No session ID, skipping send');
    return;
  }

  if (this.eventsQueue.length === 0) {
    return;
  }

  if (!this.circuitBreaker.canAttempt()) {
    debugLog.debug('EventManager', 'Circuit breaker open, skipping send');
    return;
  }

  const body = this.buildEventsPayload();
  const eventsToSend = [...this.eventsQueue];
  const eventIds = eventsToSend.map((e) => e.timestamp + '_' + e.type);

  await this.dataSender.sendEventsQueue(body, {
    onSuccess: () => {
      this.circuitBreaker.recordSuccess();
      this.removeProcessedEvents(eventIds);

      debugLog.info('EventManager', 'Events sent successfully', {
        eventCount: eventsToSend.length,
        remainingQueueLength: this.eventsQueue.length,
      });
    },
    onFailure: async () => {
      this.circuitBreaker.recordFailure();

      debugLog.warn('EventManager', 'Events send failed, keeping in queue', {
        eventCount: eventsToSend.length,
        circuitState: this.circuitBreaker.getState(),
      });
    },
  });
}
```

#### Simplificar stop()
```typescript
stop(): void {
  // Clear interval
  if (this.eventsQueueIntervalId) {
    clearInterval(this.eventsQueueIntervalId);
    this.eventsQueueIntervalId = null;
    this.intervalActive = false;
  }

  // Reset state
  this.lastEvent = null;
  this.eventsQueue = [];

  // Stop sender
  this.dataSender.stop();

  debugLog.debug('EventManager', 'EventManager stopped');
}
```

## 🧪 Tests Unitarios

### Test Circuit Breaker
```typescript
// tests/unit/utils/simple-circuit-breaker.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { SimpleCircuitBreaker } from '@/utils/simple-circuit-breaker';

describe('SimpleCircuitBreaker', () => {
  let breaker: SimpleCircuitBreaker;

  beforeEach(() => {
    breaker = new SimpleCircuitBreaker();
  });

  test('should allow attempts initially', () => {
    expect(breaker.canAttempt()).toBe(true);
  });

  test('should open after max failures', () => {
    for (let i = 0; i < 5; i++) {
      breaker.recordFailure();
    }

    expect(breaker.canAttempt()).toBe(false);
    expect(breaker.getState().isOpen).toBe(true);
  });

  test('should close after recovery delay', async () => {
    // Open circuit
    for (let i = 0; i < 5; i++) {
      breaker.recordFailure();
    }
    expect(breaker.canAttempt()).toBe(false);

    // Wait for recovery
    await new Promise(resolve => setTimeout(resolve, 31000));

    expect(breaker.canAttempt()).toBe(true);
  });

  test('should reset on success', () => {
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState().failureCount).toBe(2);

    breaker.recordSuccess();
    expect(breaker.getState().failureCount).toBe(0);
  });
});
```

### Test Deduplicación
```typescript
// tests/unit/managers/event-manager.test.ts
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EventManager } from '@/managers/event.manager';

describe('EventManager - Deduplication', () => {
  let manager: EventManager;
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
    };
    manager = new EventManager(mockStorage);
  });

  test('should detect duplicate click events', () => {
    const clickEvent = {
      type: 'click',
      page_url: '/test',
      click_data: { x: 100, y: 200 },
    };

    manager.track(clickEvent);
    manager.track(clickEvent); // Duplicate

    expect(manager.getQueueLength()).toBe(1);
  });

  test('should NOT deduplicate after threshold', async () => {
    const clickEvent = {
      type: 'click',
      page_url: '/test',
      click_data: { x: 100, y: 200 },
    };

    manager.track(clickEvent);

    // Wait > threshold
    await new Promise(resolve => setTimeout(resolve, 1500));

    manager.track(clickEvent);

    expect(manager.getQueueLength()).toBe(2);
  });

  test('should detect similar clicks within tolerance', () => {
    manager.track({
      type: 'click',
      page_url: '/test',
      click_data: { x: 100, y: 200 },
    });

    manager.track({
      type: 'click',
      page_url: '/test',
      click_data: { x: 102, y: 203 }, // Within 5px tolerance
    });

    expect(manager.getQueueLength()).toBe(1);
  });

  test('should NOT detect clicks outside tolerance', () => {
    manager.track({
      type: 'click',
      page_url: '/test',
      click_data: { x: 100, y: 200 },
    });

    manager.track({
      type: 'click',
      page_url: '/test',
      click_data: { x: 110, y: 210 }, // > 5px tolerance
    });

    expect(manager.getQueueLength()).toBe(2);
  });
});
```

### Test Sampling
```typescript
// tests/unit/managers/event-manager-sampling.test.ts
describe('EventManager - Sampling', () => {
  test('should sample all events with rate 1.0', () => {
    const manager = new EventManager(mockStorage);
    // Config con samplingRate: 1

    for (let i = 0; i < 100; i++) {
      manager.track({ type: 'click', page_url: '/test' });
    }

    expect(manager.getQueueLength()).toBe(100);
  });

  test('should sample ~50% events with rate 0.5', () => {
    const manager = new EventManager(mockStorage);
    // Config con samplingRate: 0.5

    for (let i = 0; i < 1000; i++) {
      manager.track({ type: 'click', page_url: '/test' });
    }

    const queueLength = manager.getQueueLength();
    expect(queueLength).toBeGreaterThan(400);
    expect(queueLength).toBeLessThan(600);
  });
});
```

## 🧪 Tests E2E

```typescript
// tests/e2e/event-manager.spec.ts
import { test, expect } from '@playwright/test';

test.describe('EventManager E2E', () => {
  test('should deduplicate rapid clicks', async ({ page }) => {
    let payloads: any[] = [];

    await page.route('**/api/**', (route) => {
      const payload = route.request().postDataJSON();
      payloads.push(payload);
      route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('http://localhost:3000');

    // Rapid clicks
    await page.click('button');
    await page.click('button');
    await page.click('button');

    await page.waitForTimeout(2000);

    const clickEvents = payloads
      .flatMap(p => p.events)
      .filter(e => e.type === 'click');

    expect(clickEvents.length).toBe(1);
  });

  test('should apply sampling correctly', async ({ page }) => {
    // Config con samplingRate: 0.5

    let payloads: any[] = [];

    await page.route('**/api/**', (route) => {
      const payload = route.request().postDataJSON();
      payloads.push(payload);
      route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('http://localhost:3000');

    // Multiple clicks
    for (let i = 0; i < 100; i++) {
      await page.click('button');
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(2000);

    const totalEvents = payloads.flatMap(p => p.events).length;

    // ~50% sampled
    expect(totalEvents).toBeGreaterThan(30);
    expect(totalEvents).toBeLessThan(70);
  });

  test('should recover from circuit breaker', async ({ page }) => {
    // Simulate failures
    let failCount = 0;

    await page.route('**/api/**', (route) => {
      failCount++;
      if (failCount <= 5) {
        route.abort();
      } else {
        route.fulfill({ status: 200, body: '{}' });
      }
    });

    await page.goto('http://localhost:3000');
    await page.click('button');

    // Wait for recovery
    await page.waitForTimeout(32000);

    await page.click('button');
    await page.waitForTimeout(2000);

    // Should have recovered and sent
    expect(failCount).toBeGreaterThan(5);
  });
});
```

## ✅ Validación

### 1. Build y Lint
```bash
npm run build:v2
npm run check:v2
```

### 2. Tests Unitarios
```bash
npm run test:unit
npm run test:coverage
```

Verificar coverage:
- `simple-circuit-breaker.ts`: 100%
- `event.manager.ts`: > 80%

### 3. Tests E2E
```bash
npm run test:e2e:v2
```

### 4. Comparar Output
```bash
npm run compare-output
```

Verificar que EventData es idéntico.

### 5. Manual Testing
```bash
npm run serve:test:v2
```

Verificar:
- Deduplicación funciona (clicks rápidos)
- Circuit breaker se recupera
- Sampling aplica correctamente
- Events se envían normalmente

## 📊 Resultado Esperado

### Reducción de Código
```
EventManager:
- ANTES: ~900 líneas
- DESPUÉS: ~400 líneas
- REDUCCIÓN: -55%

Circuit Breaker:
- ANTES: ~300 líneas (complejo)
- DESPUÉS: ~50 líneas (simple)
- REDUCCIÓN: -83%

Deduplicación:
- ANTES: ~200 líneas (Map)
- DESPUÉS: ~80 líneas (último evento)
- REDUCCIÓN: -60%
```

### Archivos Eliminados
```
- backoff.manager.ts
- sampling.manager.ts (funcionalidad inline)
- tags.manager.ts (funcionalidad inline)
```

### Funcionalidad Preservada
- ✅ Queue de eventos
- ✅ Batch sending
- ✅ Deduplicación (mejorada)
- ✅ Circuit breaker (simplificado)
- ✅ Sampling (simplificado)
- ✅ Tags (simplificados)
- ✅ Retry on failure
- ✅ Event persistence

## 🚦 Criterios de Éxito

- [ ] EventManager < 450 líneas
- [ ] SimpleCircuitBreaker creado y testeado
- [ ] Deduplicación funcionando con lastEvent
- [ ] Sampling global implementado
- [ ] Tags estáticos implementados
- [ ] Tests unitarios > 80% coverage
- [ ] Tests E2E pasando 100%
- [ ] EventData structure idéntica
- [ ] No breaking changes en API

---

**Estado**: Pendiente
**Dependencias**: PHASE_1 completada
**Siguiente**: PHASE_2_SESSION_MANAGER.md