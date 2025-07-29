import { SESSION_TIMEOUT_MIN_MS } from './app.constants';
import { ApiManager } from './services/api-manager';
import { ConfigManager } from './services/config-manager';
import { SessionManager } from './services/session-manager';
import { UserManager } from './services/user-manager';
import { AppConfig, Config } from './types/config.types';
import { log } from './utils/log.utils';

let app: App;

export class App {
  private apiUrl: string | undefined;
  private config: Config | undefined;
  private sessionId: string | null = null;
  private userId: string | undefined;

  async init(appConfig: AppConfig): Promise<void> {
    this.setApiUrl(appConfig.id);
    await this.setConfig(appConfig);
    this.initSessionManager();
    this.setUserId();
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
