import { EventManager } from '../managers/event.manager';
import { SessionManager } from '../managers/session.manager';
import { StateManager } from '../managers/state.manager';
import { StorageManager } from '../managers/storage.manager';
import { debugLog } from '../utils/logging';

export class SessionHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly storageManager: StorageManager;
  private sessionManager: SessionManager | null = null;

  constructor(storageManager: StorageManager, eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
    this.storageManager = storageManager;
  }

  async startTracking(): Promise<void> {
    if (this.sessionManager) {
      debugLog.debug('SessionHandler', 'Session tracking already active');
      return;
    }

    debugLog.debug('SessionHandler', 'Starting session tracking');

    this.sessionManager = new SessionManager(this.storageManager, this.eventManager);

    await this.sessionManager.startTracking();

    debugLog.debug('SessionHandler', 'Session tracking started');
  }

  async stopTracking(): Promise<void> {
    debugLog.info('SessionHandler', 'Stopping session tracking');

    if (this.sessionManager) {
      await this.sessionManager.stopTracking();
      this.sessionManager.destroy();
      this.sessionManager = null;
    }
  }

  destroy(): void {
    if (this.sessionManager) {
      this.sessionManager.destroy();
      this.sessionManager = null;
    }
  }
}
