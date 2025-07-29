import { DEFAULT_CONFIG, SESSION_TIMEOUT_MIN_MS } from './app.constants';
import { ApiManager } from './services/api-manager';
import { ConfigManager } from './services/config-manager';
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
  private apiUrl = '';
  private config: Config = DEFAULT_CONFIG;
  private sessionId: string | null = null;
  private userId = '';
  private globalMetadata: Record<string, MetadataType> = {};
  private device: DeviceType = DeviceType.Unknown;
  private utmParams: UTM | null = null;

  async init(appConfig: AppConfig): Promise<void> {
    this.setApiUrl(appConfig.id);
    await this.setConfig(appConfig);
    this.initSessionManager();
    this.setUserId();
    this.utmParams = getUTMParameters();
    this.device = getDeviceType();
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
