import { DEFAULT_CONFIG, SCROLL_DEBOUNCE_TIME, SESSION_TIMEOUT_MIN_MS } from './app.constants';
import { PageViewHandler } from './handlers/page-view-handler';
import { ApiManager } from './services/api-manager';
import { ConfigManager } from './services/config-manager';
import { EventManager } from './services/event-manager';
import { SamplingManager } from './services/sampling-manager';
import { SessionManager } from './services/session-manager';
import { UserManager } from './services/user-manager';
import { MetadataType } from './types/common.types';
import { AppConfig, Config } from './types/config.types';
import { DeviceType } from './types/device.types';
import { UTM } from './types/event.types';
import { getDeviceType } from './utils/device-detector.utils';
import { log } from './utils/log.utils';
import { getUTMParameters } from './utils/utm-params.utils';

let app: App;

export class App {
  private samplingManager!: SamplingManager;
  private eventManager!: EventManager;

  private pageViewHandler!: PageViewHandler;

  private apiUrl!: string;
  private config!: Config;
  private sessionId: string | null = null;
  private userId!: string;
  private globalMetadata: Record<string, MetadataType> = {};
  private device: DeviceType = DeviceType.Unknown;

  private suppressNextScroll = false;

  async init(appConfig: AppConfig): Promise<void> {
    this.setApiUrl(appConfig.id);
    await this.setConfig(appConfig);
    this.initSessionManager();
    this.setUserId();
    this.setManagers();
    this.device = getDeviceType();
    this.initHandlers();
  }

  event(eventName: string, payload: EventPayload = {}): void {
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

  private setManagers(): void {
    this.samplingManager = new SamplingManager(this.config);
    this.eventManager = new EventManager();
  }

  private initHandlers(): void {
    this.initPageViewHandler();
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
  if (!app) throw new Error('App no ha sido inicializada. Llama a init() primero.');
  return app;
};
