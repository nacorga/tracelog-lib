# Fase 2.2: Refactorizar SessionManager

## 🎯 Objetivo
Simplificar SessionManager eliminando cross-tab complejo y session recovery multi-estado, manteniendo funcionalidad core de sesiones.

## 📋 Tareas

### 1. Eliminar Managers Complejos

#### Eliminar CrossTabSessionManager
```bash
# ELIMINAR archivo completo
rm src_v2/managers/cross-tab-session.manager.ts
```

#### Eliminar SessionRecoveryManager
```bash
# ELIMINAR archivo completo
rm src_v2/managers/session-recovery.manager.ts
```

#### Actualizar SessionManager
```typescript
// src_v2/managers/session.manager.ts

// ELIMINAR imports:
import { CrossTabSessionManager } from './cross-tab-session.manager';
import { SessionRecoveryManager } from './session-recovery.manager';

// ELIMINAR propiedades:
private crossTabManager: CrossTabSessionManager;
private recoveryManager: SessionRecoveryManager;
```

### 2. Implementar Cross-Tab Simple

```typescript
// src_v2/managers/session.manager.ts
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { EventManager } from './event.manager';

export class SessionManager extends StateManager {
  private storageManager: StorageManager;
  private eventManager: EventManager;
  private sessionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor(storageManager: StorageManager, eventManager: EventManager) {
    super();
    this.storageManager = storageManager;
    this.eventManager = eventManager;
  }

  /**
   * Inicializa cross-tab sync simple
   */
  private initCrossTabSync(): void {
    if (typeof BroadcastChannel === 'undefined') {
      debugLog.warn('SessionManager', 'BroadcastChannel not supported');
      return;
    }

    this.broadcastChannel = new BroadcastChannel('tracelog_session');

    // Escuchar cambios de sesión de otras tabs
    this.broadcastChannel.onmessage = (event) => {
      const { sessionId, timestamp } = event.data;

      if (sessionId && timestamp) {
        const currentSessionId = this.get('sessionId');

        // Solo actualizar si es una sesión más reciente
        if (!currentSessionId || timestamp > Date.now() - 1000) {
          this.set('sessionId', sessionId);
          this.storageManager.set('sessionId', sessionId);
          this.storageManager.set('lastActivity', timestamp.toString());

          debugLog.debug('SessionManager', 'Session synced from another tab', {
            sessionId,
          });
        }
      }
    };
  }

  /**
   * Comparte sesión actual con otras tabs
   */
  private shareSession(sessionId: string): void {
    if (!this.broadcastChannel) return;

    this.broadcastChannel.postMessage({
      sessionId,
      timestamp: Date.now(),
    });
  }

  /**
   * Limpia cross-tab sync
   */
  private cleanupCrossTabSync(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}
```

### 3. Implementar Session Recovery Simple

```typescript
// src_v2/managers/session.manager.ts

export class SessionManager extends StateManager {
  /**
   * Recupera sesión desde localStorage si existe
   */
  private recoverSession(): string | null {
    const storedSessionId = this.storageManager.get('sessionId');
    const lastActivity = this.storageManager.get('lastActivity');

    if (!storedSessionId || !lastActivity) {
      return null;
    }

    const lastActivityTime = parseInt(lastActivity, 10);
    const sessionTimeout = this.get('config')?.sessionTimeout || DEFAULT_SESSION_TIMEOUT;

    // Verificar si sesión expiró
    if (Date.now() - lastActivityTime > sessionTimeout) {
      debugLog.debug('SessionManager', 'Stored session expired');
      return null;
    }

    debugLog.info('SessionManager', 'Session recovered from storage', {
      sessionId: storedSessionId,
      lastActivity: lastActivityTime,
    });

    return storedSessionId;
  }

  /**
   * Persiste sesión en localStorage
   */
  private persistSession(sessionId: string): void {
    this.storageManager.set('sessionId', sessionId);
    this.storageManager.set('lastActivity', Date.now().toString());
  }
}
```

### 4. Simplificar Gestión de Sesión

```typescript
// src_v2/managers/session.manager.ts

export class SessionManager extends StateManager {
  /**
   * Inicia tracking de sesión
   */
  async startTracking(): Promise<void> {
    // Intentar recuperar sesión existente
    const recoveredSessionId = this.recoverSession();

    let sessionId: string;
    let isRecovered = false;

    if (recoveredSessionId) {
      sessionId = recoveredSessionId;
      isRecovered = true;
    } else {
      sessionId = this.generateSessionId();
    }

    // Guardar en state y storage
    await this.set('sessionId', sessionId);
    this.persistSession(sessionId);

    // Track session start
    this.eventManager.track({
      type: EventType.SESSION_START,
      ...(isRecovered && { session_start_recovered: true }),
    });

    // Iniciar cross-tab sync
    this.initCrossTabSync();
    this.shareSession(sessionId);

    // Configurar timeout
    this.setupSessionTimeout();

    // Listeners de actividad
    this.setupActivityListeners();

    debugLog.info('SessionManager', 'Session tracking started', {
      sessionId,
      recovered: isRecovered,
    });
  }

  /**
   * Genera ID de sesión único
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Configura timeout de sesión
   */
  private setupSessionTimeout(): void {
    this.clearSessionTimeout();

    const sessionTimeout = this.get('config')?.sessionTimeout || DEFAULT_SESSION_TIMEOUT;

    this.sessionTimeoutId = setTimeout(() => {
      this.endSession('timeout');
    }, sessionTimeout);
  }

  /**
   * Reinicia timeout de sesión
   */
  private resetSessionTimeout(): void {
    this.setupSessionTimeout();
    this.persistSession(this.get('sessionId') as string);
  }

  /**
   * Limpia timeout de sesión
   */
  private clearSessionTimeout(): void {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  /**
   * Configura listeners de actividad del usuario
   */
  private setupActivityListeners(): void {
    const resetTimeout = () => this.resetSessionTimeout();

    document.addEventListener('click', resetTimeout);
    document.addEventListener('keydown', resetTimeout);
    document.addEventListener('scroll', resetTimeout);

    // Guardar para cleanup
    this.activityListeners = {
      click: resetTimeout,
      keydown: resetTimeout,
      scroll: resetTimeout,
    };
  }

  /**
   * Limpia listeners de actividad
   */
  private cleanupActivityListeners(): void {
    if (this.activityListeners) {
      document.removeEventListener('click', this.activityListeners.click);
      document.removeEventListener('keydown', this.activityListeners.keydown);
      document.removeEventListener('scroll', this.activityListeners.scroll);
      this.activityListeners = null;
    }
  }

  /**
   * Finaliza sesión
   */
  private endSession(reason: SessionEndReason): void {
    const sessionId = this.get('sessionId');

    if (!sessionId) return;

    debugLog.info('SessionManager', 'Ending session', { sessionId, reason });

    // Track session end
    this.eventManager.track({
      type: EventType.SESSION_END,
      session_end_reason: reason,
    });

    // Limpiar
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupCrossTabSync();

    // Limpiar storage
    this.storageManager.remove('sessionId');
    this.storageManager.remove('lastActivity');

    // Limpiar state
    this.set('sessionId', null);
  }

  /**
   * Detiene tracking de sesión
   */
  async stopTracking(): Promise<void> {
    this.endSession('manual');
  }
}
```

### 5. Configurar Visibilidad y Unload

```typescript
// src_v2/managers/session.manager.ts

export class SessionManager extends StateManager {
  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pausar timeout cuando tab está oculto
        this.clearSessionTimeout();
      } else {
        // Reanudar timeout cuando tab vuelve a estar visible
        const sessionId = this.get('sessionId');
        if (sessionId) {
          this.setupSessionTimeout();
        }
      }
    });
  }

  private setupUnloadListener(): void {
    window.addEventListener('beforeunload', () => {
      // NO enviar session_end aquí, solo flush eventos
      // Session end se envía solo en timeout o destroy manual
      this.eventManager.flushImmediatelySync();
    });
  }

  async startTracking(): Promise<void> {
    // ... código anterior

    this.setupVisibilityListener();
    this.setupUnloadListener();
  }
}
```

## 🧪 Tests Unitarios

```typescript
// tests/unit/managers/session.manager.test.ts
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '@/managers/session.manager';

describe('SessionManager', () => {
  let manager: SessionManager;
  let mockStorage: any;
  let mockEventManager: any;

  beforeEach(() => {
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    };

    mockEventManager = {
      track: vi.fn(),
      flushImmediatelySync: vi.fn(),
    };

    manager = new SessionManager(mockStorage, mockEventManager);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('should generate unique session ID', () => {
    const id1 = manager['generateSessionId']();
    const id2 = manager['generateSessionId']();

    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(10);
  });

  test('should track session start', async () => {
    await manager.startTracking();

    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'session_start',
      })
    );
  });

  test('should recover session from storage', async () => {
    const storedSessionId = 'stored-session-123';
    const lastActivity = (Date.now() - 1000).toString();

    mockStorage.get.mockImplementation((key: string) => {
      if (key === 'sessionId') return storedSessionId;
      if (key === 'lastActivity') return lastActivity;
      return null;
    });

    await manager.startTracking();

    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'session_start',
        session_start_recovered: true,
      })
    );
  });

  test('should NOT recover expired session', async () => {
    const storedSessionId = 'old-session-123';
    const lastActivity = (Date.now() - 20 * 60 * 1000).toString(); // 20 min ago

    mockStorage.get.mockImplementation((key: string) => {
      if (key === 'sessionId') return storedSessionId;
      if (key === 'lastActivity') return lastActivity;
      return null;
    });

    await manager.startTracking();

    // Should create new session, not recover
    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'session_start',
        session_start_recovered: undefined,
      })
    );
  });

  test('should end session on timeout', async () => {
    vi.useFakeTimers();

    await manager.startTracking();

    // Fast-forward past session timeout (15 min)
    vi.advanceTimersByTime(15 * 60 * 1000 + 1000);

    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'session_end',
        session_end_reason: 'timeout',
      })
    );
  });

  test('should reset timeout on activity', async () => {
    vi.useFakeTimers();

    await manager.startTracking();

    // Activity after 10 minutes
    vi.advanceTimersByTime(10 * 60 * 1000);
    document.dispatchEvent(new Event('click'));

    // Wait another 10 minutes (should NOT timeout)
    vi.advanceTimersByTime(10 * 60 * 1000);

    // Session should still be active
    const sessionEndCalls = mockEventManager.track.mock.calls.filter(
      (call) => call[0].type === 'session_end'
    );
    expect(sessionEndCalls.length).toBe(0);
  });

  test('should cleanup on stop', async () => {
    await manager.startTracking();
    await manager.stopTracking();

    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'session_end',
        session_end_reason: 'manual',
      })
    );

    expect(mockStorage.remove).toHaveBeenCalledWith('sessionId');
    expect(mockStorage.remove).toHaveBeenCalledWith('lastActivity');
  });
});
```

### Test Cross-Tab Sync
```typescript
// tests/unit/managers/session-cross-tab.test.ts
describe('SessionManager - Cross-Tab', () => {
  test('should share session via BroadcastChannel', async () => {
    const manager = new SessionManager(mockStorage, mockEventManager);

    const channel = new BroadcastChannel('tracelog_session');
    const messagePromise = new Promise((resolve) => {
      channel.onmessage = (e) => resolve(e.data);
    });

    await manager.startTracking();

    const message = await messagePromise;

    expect(message).toHaveProperty('sessionId');
    expect(message).toHaveProperty('timestamp');
  });

  test('should sync session from another tab', async () => {
    const manager = new SessionManager(mockStorage, mockEventManager);
    await manager.startTracking();

    const channel = new BroadcastChannel('tracelog_session');
    const newSessionId = 'new-session-from-tab-2';

    // Simulate message from another tab
    channel.postMessage({
      sessionId: newSessionId,
      timestamp: Date.now(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockStorage.set).toHaveBeenCalledWith('sessionId', newSessionId);
  });
});
```

## 🧪 Tests E2E

```typescript
// tests/e2e/session.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
  test('should create session on init', async ({ page }) => {
    let sessionStartEvent: any;

    await page.route('**/api/**', (route) => {
      const payload = route.request().postDataJSON();
      const event = payload.events.find((e: any) => e.type === 'session_start');
      if (event) sessionStartEvent = event;
      route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    expect(sessionStartEvent).toBeDefined();
    expect(sessionStartEvent.type).toBe('session_start');
  });

  test('should recover session on reload', async ({ page, context }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);

    let recoveredEvent: any;

    await page.route('**/api/**', (route) => {
      const payload = route.request().postDataJSON();
      const event = payload.events.find(
        (e: any) => e.type === 'session_start' && e.session_start_recovered
      );
      if (event) recoveredEvent = event;
      route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    expect(recoveredEvent?.session_start_recovered).toBe(true);
  });

  test('should end session on timeout', async ({ page }) => {
    // Config with short timeout (5 sec for test)
    await page.goto('http://localhost:3000?sessionTimeout=5000');

    let sessionEndEvent: any;

    await page.route('**/api/**', (route) => {
      const payload = route.request().postDataJSON();
      const event = payload.events.find((e: any) => e.type === 'session_end');
      if (event) sessionEndEvent = event;
      route.fulfill({ status: 200, body: '{}' });
    });

    // Wait for timeout
    await page.waitForTimeout(6000);

    expect(sessionEndEvent).toBeDefined();
    expect(sessionEndEvent.session_end_reason).toBe('timeout');
  });

  test('should reset timeout on activity', async ({ page }) => {
    await page.goto('http://localhost:3000?sessionTimeout=5000');

    // Activity at 3 seconds
    await page.waitForTimeout(3000);
    await page.click('button');

    // Wait another 3 seconds (total 6, but timeout should be reset)
    await page.waitForTimeout(3000);

    let sessionEndEvent: any;

    await page.route('**/api/**', (route) => {
      const payload = route.request().postDataJSON();
      const event = payload.events.find((e: any) => e.type === 'session_end');
      if (event) sessionEndEvent = event;
      route.fulfill({ status: 200, body: '{}' });
    });

    // Should still be active
    expect(sessionEndEvent).toBeUndefined();
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
```

Verificar coverage SessionManager > 85%

### 3. Tests E2E
```bash
npm run test:e2e:v2 -- session.spec.ts
```

### 4. Manual Testing

```bash
npm run serve:test:v2
```

**Test 1: Session Start**
- Abrir http://localhost:3000
- Verificar en DevTools → Network → session_start event

**Test 2: Session Recovery**
- Refresh page
- Verificar session_start con `session_start_recovered: true`

**Test 3: Session Timeout**
- No interactuar por 15 minutos
- Verificar session_end con `session_end_reason: 'timeout'`

**Test 4: Cross-Tab Sync**
- Tab 1: Abrir app
- Tab 2: Abrir app
- Verificar mismo sessionId en ambas tabs

## 📊 Resultado Esperado

### Reducción de Código
```
SessionManager:
- ANTES: ~400 líneas (con cross-tab y recovery complejo)
- DESPUÉS: ~250 líneas
- REDUCCIÓN: -37%

Cross-Tab:
- ANTES: ~250 líneas (manager completo)
- DESPUÉS: ~40 líneas (inline)
- REDUCCIÓN: -84%

Recovery:
- ANTES: ~200 líneas (multi-estado)
- DESPUÉS: ~30 líneas (básico)
- REDUCCIÓN: -85%
```

### Archivos Eliminados
- `cross-tab-session.manager.ts`
- `session-recovery.manager.ts`

### Funcionalidad Preservada
- ✅ Session ID único
- ✅ Session timeout configurable
- ✅ Session recovery básico
- ✅ Cross-tab sync simple
- ✅ Session end reasons
- ✅ Activity tracking
- ✅ Visibility handling

## 🚦 Criterios de Éxito

- [ ] SessionManager < 300 líneas
- [ ] cross-tab-session.manager.ts eliminado
- [ ] session-recovery.manager.ts eliminado
- [ ] Cross-tab sync funcionando (BroadcastChannel)
- [ ] Session recovery básico funcionando
- [ ] Tests unitarios > 85% coverage
- [ ] Tests E2E pasando 100%
- [ ] Session data en EventData intacto
- [ ] No breaking changes

---

**Estado**: Pendiente
**Dependencias**: PHASE_2_EVENT_MANAGER completada
**Siguiente**: PHASE_2_SENDER_MANAGER.md