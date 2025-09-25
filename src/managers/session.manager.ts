import { DEFAULT_SESSION_TIMEOUT } from '../constants';
import { EventType } from '../types';
import { SessionEndReason } from '../types/session.types';
import { debugLog } from '../utils/logging';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { EventManager } from './event.manager';

interface ActivityListeners {
  click: () => void;
  keydown: () => void;
  scroll: () => void;
}

export class SessionManager extends StateManager {
  private readonly storageManager: StorageManager;
  private readonly eventManager: EventManager;
  private sessionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private activityListeners: ActivityListeners | null = null;
  private visibilityChangeTimeout: number | null = null;

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
    this.broadcastChannel.onmessage = (event): void => {
      const { sessionId, timestamp } = event.data;

      if (sessionId && timestamp) {
        const currentSessionId = this.get('sessionId');

        // Solo actualizar si es una sesión más reciente
        if (!currentSessionId || timestamp > Date.now() - 1000) {
          this.set('sessionId', sessionId);
          this.storageManager.setItem('sessionId', sessionId);
          this.storageManager.setItem('lastActivity', timestamp.toString());

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

  /**
   * Recupera sesión desde localStorage si existe
   */
  private recoverSession(): string | null {
    const storedSessionId = this.storageManager.getItem('sessionId');
    const lastActivity = this.storageManager.getItem('lastActivity');

    if (!storedSessionId || !lastActivity) {
      return null;
    }

    const lastActivityTime = parseInt(lastActivity, 10);
    const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;

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
    this.storageManager.setItem('sessionId', sessionId);
    this.storageManager.setItem('lastActivity', Date.now().toString());
  }

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

    // Visibility y unload listeners
    this.setupVisibilityListener();
    this.setupUnloadListener();

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

    const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;

    this.sessionTimeoutId = setTimeout(() => {
      this.endSession('inactivity');
    }, sessionTimeout);
  }

  /**
   * Reinicia timeout de sesión
   */
  private resetSessionTimeout(): void {
    this.setupSessionTimeout();
    const sessionId = this.get('sessionId');
    if (sessionId) {
      this.persistSession(sessionId as string);
    }
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
    const resetTimeout = (): void => this.resetSessionTimeout();

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
   * Configura listener de visibilidad
   */
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

  /**
   * Configura listener de unload
   */
  private setupUnloadListener(): void {
    window.addEventListener('beforeunload', () => {
      // NO enviar session_end aquí, solo flush eventos
      // Session end se envía solo en timeout o destroy manual
      this.eventManager.flushImmediatelySync();
    });
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
    this.storageManager.removeItem('sessionId');
    this.storageManager.removeItem('lastActivity');

    // Limpiar state
    this.set('sessionId', null);
  }

  /**
   * Detiene tracking de sesión
   */
  async stopTracking(): Promise<void> {
    this.endSession('manual_stop');
  }

  /**
   * Limpia recursos
   */
  destroy(): void {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupCrossTabSync();

    if (this.visibilityChangeTimeout) {
      clearTimeout(this.visibilityChangeTimeout);
      this.visibilityChangeTimeout = null;
    }
  }
}
