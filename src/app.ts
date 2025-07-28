import { ApiManager } from './services/api-manager';
import { ConfigManager } from './services/config-manager';
import { StateManager } from './services/state-manager';
import { AppConfig } from './types/config.types';
import { log } from './utils/log';

let app: App;

export class App extends StateManager {
  constructor(private readonly appConfig: AppConfig) {
    super();
  }

  async init(): Promise<void> {
    this.setApiUrl();
    await this.setConfig();
  }

  private setApiUrl(): void {
    const apiManager = new ApiManager();
    apiManager.set(this.appConfig.id);
  }

  private async setConfig(): Promise<void> {
    const configManager = new ConfigManager();
    await configManager.set(this.appConfig);
  }
}

export const init = async (appConfig: AppConfig): Promise<void> => {
  const instance = new App(appConfig);

  try {
    await instance.init();
    app = instance;
  } catch (error) {
    log('error', `Initialization rejected: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getApp = (): App => {
  if (!app) throw new Error('App no ha sido inicializada. Llama a init() primero.');
  return app;
};
