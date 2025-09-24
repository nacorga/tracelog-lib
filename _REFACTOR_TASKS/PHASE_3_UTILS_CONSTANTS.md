# Fase 3: Consolidar Utils y Constants

## 🎯 Objetivo
Consolidar utils y constants eliminando duplicación y simplificando estructura.

## 📋 Parte 1: Consolidar Constants

### Estructura Actual → Objetivo
```
ANTES (8+ archivos):                  DESPUÉS (4 archivos):
├── api.constants.ts                  ├── api.constants.ts
├── backoff.constants.ts       ❌     │   (URLs, endpoints)
├── security.constants.ts      ❌     ├── config.constants.ts
├── validation.constants.ts    ❌     │   (defaults, limits, timeouts)
├── browser.constants.ts       📦     ├── storage.constants.ts
├── storage.constants.ts       ✅     │   (keys, prefixes)
├── timing.constants.ts        📦     └── event.constants.ts
├── limits.constants.ts        📦         (thresholds, intervals)
└── initialization.constants.ts ❌
```

### Consolidar en config.constants.ts
```typescript
// src_v2/constants/config.constants.ts
export const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1000; // 15 min
export const DUPLICATE_EVENT_THRESHOLD_MS = 1000; // 1 sec
export const MAX_EVENTS_QUEUE_LENGTH = 100;
export const EVENT_SENT_INTERVAL_MS = 5000; // 5 sec
export const EVENT_SENT_INTERVAL_TEST_MS = 1000; // 1 sec test
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 5000;
export const REQUEST_TIMEOUT_MS = 10000;
export const MAX_METADATA_SIZE = 5000;
export const CLICK_TOLERANCE_PX = 5;
```

## 📋 Parte 2: Consolidar Utils

### Mantener (refactorizar si es necesario)
```
✅ browser/
   ├── device.utils.ts     → Detección device
   └── user-agent.utils.ts → Parse user agent

✅ data/
   ├── sanitize.utils.ts   → Sanitización metadata
   ├── normalize.utils.ts  → Normalización URLs
   └── hash.utils.ts       → Hash generation

✅ validations/
   ├── event.validations.ts → Validar eventos
   └── url.validations.ts   → Validar URLs
```

### Eliminar/Consolidar
```
❌ network/
   └── fetch-with-timeout.utils.ts  → Usar AbortController

❌ security/
   └── (validaciones excesivas)     → Consolidar en validations/

📦 logging/
   └── debug-logger.utils.ts        → Simplificar logger
```

### Simplificar Logger
```typescript
// src_v2/utils/logger.ts
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private enabled = true;
  private level: LogLevel = 'info';

  error(module: string, message: string, data?: any): void {
    if (!this.enabled) return;
    console.error(`[${module}] ${message}`, data || '');
  }

  warn(module: string, message: string, data?: any): void {
    if (!this.enabled || this.level === 'error') return;
    console.warn(`[${module}] ${message}`, data || '');
  }

  info(module: string, message: string, data?: any): void {
    if (!this.enabled || ['error', 'warn'].includes(this.level)) return;
    console.log(`[${module}] ${message}`, data || '');
  }

  debug(module: string, message: string, data?: any): void {
    if (!this.enabled || this.level !== 'debug') return;
    console.debug(`[${module}] ${message}`, data || '');
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }
}

export const debugLog = new Logger();
```

## 🧪 Tests

### Test Utils
```typescript
// tests/unit/utils/sanitize.test.ts
test('should remove sensitive fields', () => {
  const input = { password: '123', token: 'secret', name: 'John' };
  const result = sanitize(input);
  
  expect(result).not.toHaveProperty('password');
  expect(result).not.toHaveProperty('token');
  expect(result).toHaveProperty('name');
});

// tests/unit/utils/normalize.test.ts
test('should remove sensitive query params', () => {
  const url = 'https://app.com?token=secret&user=john';
  const result = normalizeUrl(url, ['token']);
  
  expect(result).toBe('https://app.com?user=john');
});
```

## ✅ Criterios de Éxito
- [ ] Constants: 8 → 4 archivos
- [ ] Utils organizados lógicamente
- [ ] Logger simplificado < 50 líneas
- [ ] fetch-with-timeout eliminado
- [ ] Tests utils > 90% coverage

---
**Siguiente**: PHASE_4_HANDLERS.md
