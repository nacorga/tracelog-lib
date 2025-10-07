import { EventManager } from '../managers/event.manager';
import { SessionManager } from '../managers/session.manager';
import { StateManager } from '../managers/state.manager';
import { StorageManager } from '../managers/storage.manager';
import { log } from '../utils';

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
      return;
    }

    if (this.destroyed) {
      log('warn', 'Cannot start tracking on destroyed handler');
      return;
    }

    const config = this.get('config');
    const projectId =
      config?.integrations?.tracelog?.projectId ?? config?.integrations?.custom?.collectApiUrl ?? 'default';

    if (!projectId) {
      throw new Error('Cannot start session tracking: config not available');
    }

    try {
      this.sessionManager = new SessionManager(this.storageManager, this.eventManager, projectId);
      await this.sessionManager.startTracking();

      // Flush any events that were buffered during initialization
      this.eventManager.flushPendingEvents();
    } catch (error) {
      if (this.sessionManager) {
        try {
          this.sessionManager.destroy();
        } catch {
          // Ignore cleanup errors
        }
        this.sessionManager = null;
      }

      log('error', 'Failed to start session tracking', { error });
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
    await this.cleanupSessionManager();
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    if (this.sessionManager) {
      this.sessionManager.destroy();
      this.sessionManager = null;
    }

    this.destroyed = true;
    this.set('hasStartSession', false);
  }
}
