# Fase 2.3: Refactorizar SenderManager

## 🎯 Objetivo
Simplificar SenderManager eliminando backoff exponencial y usando retry con intervalo fijo.

## 📋 Tareas Principales

### 1. Eliminar Backoff Exponencial
- Eliminar `BackoffManager`
- Eliminar `BACKOFF_CONFIGS` constants
- Implementar retry con delay fijo (5 segundos)

### 2. Simplificar fetchWithTimeout
- Reemplazar utility custom con `AbortController` nativo
- Timeout configurable (default: 10 segundos)

### 3. Mantener Persistencia
- Persistir eventos en localStorage en caso de fallo
- Recuperar eventos persistidos al iniciar
- Usar `sendBeacon` para unload events

### 4. Simplificar Retry Logic
```typescript
// src_v2/managers/sender.manager.ts
export class SenderManager {
  private readonly RETRY_DELAY_MS = 5000;
  private readonly MAX_RETRIES = 3;

  async sendEventsQueue(
    body: BaseEventsQueueDto,
    callbacks: { onSuccess: () => void; onFailure: () => void }
  ): Promise<void> {
    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      try {
        await this.sendWithTimeout(body);
        callbacks.onSuccess();
        return;
      } catch (error) {
        attempt++;
        
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY_MS);
        }
      }
    }

    // Max retries reached
    await this.persistForRecovery(body);
    callbacks.onFailure();
  }

  private async sendWithTimeout(body: BaseEventsQueueDto): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 🧪 Tests

### Unitarios
```typescript
test('should retry 3 times before failing', async () => {
  let attempts = 0;
  mockFetch.mockImplementation(() => {
    attempts++;
    throw new Error('Network error');
  });

  await sender.sendEventsQueue(body, callbacks);

  expect(attempts).toBe(3);
  expect(callbacks.onFailure).toHaveBeenCalled();
});

test('should succeed on second attempt', async () => {
  let attempts = 0;
  mockFetch.mockImplementation(() => {
    attempts++;
    if (attempts === 1) throw new Error('Fail');
    return { ok: true };
  });

  await sender.sendEventsQueue(body, callbacks);

  expect(attempts).toBe(2);
  expect(callbacks.onSuccess).toHaveBeenCalled();
});
```

## ✅ Criterios de Éxito
- [ ] SenderManager < 200 líneas
- [ ] Retry fijo implementado (no exponencial)
- [ ] AbortController para timeout
- [ ] Persistencia funcionando
- [ ] Tests > 80% coverage

---
**Siguiente**: PHASE_3_UTILS_CONSTANTS.md
