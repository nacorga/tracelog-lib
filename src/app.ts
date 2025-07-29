import { SCROLL_DEBOUNCE_TIME, SESSION_TIMEOUT_MIN_MS } from './app.constants';
import { PageViewHandler } from './handlers/page-view-handler';
import { ApiManager } from './managers/api-manager';
import { ConfigManager } from './managers/config-manager';
import { EventManager } from './managers/event-manager';
import { SamplingManager } from './managers/sampling-manager';
import { SessionManager } from './managers/session-manager';
import { TagsManager } from './managers/tags-manager';
import { UserManager } from './managers/user-manager';
import { DataSender } from './services/data-sender';
import { MetadataType } from './types/common.types';
import { AppConfig, Config } from './types/config.types';
import { DeviceType } from './types/device.types';
import { getDeviceType } from './utils/device-detector.utils';
import { log } from './utils/log.utils';

let app: App;

export class App {
  private samplingManager!: SamplingManager;
  private eventManager!: EventManager;
  private dataSender!: DataSender;
  private tagsManager!: TagsManager;

  private apiUrl!: string;
  private config!: Config;
  private sessionId: string | null = null;
  private userId!: string;
  private device: DeviceType = DeviceType.Unknown;

  private suppressNextScroll = false;

  async init(appConfig: AppConfig): Promise<void> {
    this.setApiUrl(appConfig.id);
    await this.setConfig(appConfig);
    this.initSessionManager();
    this.setUserId();
    this.device = getDeviceType();
    await this.setManagers();
    this.initHandlers();
  }

  event(eventName: string, payload: Record<string, MetadataType> = {}): void {
    if (!this.samplingManager.isSampledIn(this.userId)) {
      return;
    }

    this.eventManager.track(this.userId, eventName, payload);
  }

  private setApiUrl(id: string): void {
    const apiManager = new ApiManager();
    this.apiUrl = apiManager.getUrl(id);
  }

  private async setConfig(appConfig: AppConfig): Promise<void> {
    const configManager = new ConfigManager();
    this.config = await configManager.get(this.apiUrl as string, appConfig);
  }

  private initSessionManager(): void {
    const onActivity = (): void => {
      if (this.sessionId) {
        return;
      }

      this.sessionId = sessionManager.startSession();
    };

    const onInactivity = (): void => {
      if (!this.sessionId) {
        return;
      }

      sessionManager.endSession(this.sessionId);

      this.sessionId = null;
    };

    const sessionManager = new SessionManager(
      this.config?.sessionTimeout ?? SESSION_TIMEOUT_MIN_MS,
      onActivity,
      onInactivity,
    );
  }

  private setUserId(): void {
    const userManager = new UserManager();
    this.userId = userManager.getUserId();
  }

  private async setManagers(): Promise<void> {
    this.setSamplingManager();
    this.setTagsManager();
    this.setDataSender();
    this.setEventManager();

    try {
      await this.dataSender.recoverPersistedEvents();
    } catch (error) {
      log(
        'error',
        `Failed to recover persisted events during initialization: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private initHandlers(): void {
    this.initPageViewHandler();
  }

  private setSamplingManager(): void {
    this.samplingManager = new SamplingManager(this.config);
  }

  private setTagsManager(): void {
    this.tagsManager = new TagsManager(this.config);
  }

  private setDataSender(): void {
    this.dataSender = new DataSender(this.config, {
      apiUrl: this.apiUrl,
      userId: this.userId,
    });
  }

  private setEventManager(): void {
    const data = {
      userId: this.userId,
      sessionId: this.sessionId as string,
      device: this.device,
    };

    const managers = {
      tags: this.tagsManager,
      dataSender: this.dataSender,
    };

    this.eventManager = new EventManager(this.config, data, managers);
  }

  private initPageViewHandler(): void {
    const onPageViewTrack = (): void => {
      this.suppressNextScroll = true;

      setTimeout(() => {
        this.suppressNextScroll = false;
      }, SCROLL_DEBOUNCE_TIME * 2);
    };

    const pageViewHandler = new PageViewHandler(this.config, this.eventManager, onPageViewTrack);

    pageViewHandler.startTracking();
  }
}

export const init = async (appConfig: AppConfig): Promise<void> => {
  const instance = new App();

  try {
    await instance.init(appConfig);
    app = instance;
  } catch (error) {
    log('error', `Initialization rejected: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getApp = (): App => {
  if (!app) {
    throw new Error('App not initialized');
  }

  return app;
};
