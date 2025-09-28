import { EventManager } from '../managers/event.manager';
import { SessionManager } from '../managers/session.manager';
import { StateManager } from '../managers/state.manager';
import { StorageManager } from '../managers/storage.manager';
import { debugLog } from '../utils/logging';

export class SessionHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly storageManager: StorageManager;
  private sessionManager: SessionManager | null = null;
  private destroyed = false;

  constructor(storageManager: StorageManager, eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
    this.storageManager = storageManager;
  }

  async startTracking(): Promise<void> {
    if (this.isActive()) {
      debugLog.debug('SessionHandler', 'Session tracking already active');
      return;
    }

    if (this.destroyed) {
      debugLog.warn('SessionHandler', 'Cannot start tracking on destroyed handler');
      return;
    }

    debugLog.debug('SessionHandler', 'Starting session tracking');

    try {
      this.sessionManager = new SessionManager(this.storageManager, this.eventManager);
      await this.sessionManager.startTracking();
      debugLog.debug('SessionHandler', 'Session tracking started successfully');
    } catch (error) {
      // Cleanup on failure
      if (this.sessionManager) {
        try {
          this.sessionManager.destroy();
        } catch {
          // Ignore cleanup errors
        }
        this.sessionManager = null;
      }

      debugLog.error('SessionHandler', 'Failed to start session tracking', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private isActive(): boolean {
    return this.sessionManager !== null && !this.destroyed;
  }

  private async cleanupSessionManager(): Promise<void> {
    if (this.sessionManager) {
      await this.sessionManager.stopTracking();
      this.sessionManager.destroy();
      this.sessionManager = null;
    }
  }

  async stopTracking(): Promise<void> {
    debugLog.debug('SessionHandler', 'Stopping session tracking');
    await this.cleanupSessionManager();
  }

  destroy(): void {
    if (this.destroyed) {
      debugLog.debug('SessionHandler', 'Already destroyed, skipping');
      return;
    }

    if (this.sessionManager) {
      this.sessionManager.destroy();
      this.sessionManager = null;
    }

    this.destroyed = true;
    this.set('hasStartSession', false);
    debugLog.debug('SessionHandler', 'Session handler destroyed');
  }
}
