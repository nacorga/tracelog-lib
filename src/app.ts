import { SCROLL_DEBOUNCE_TIME } from './app.constants';
import { ApiManager } from './services/api-manager';
import { ConfigManager } from './services/config-manager';
import { EventManager } from './services/event-manager';
import { AppConfig } from './types/config.types';
import { getDeviceType } from './utils/device-detector.utils';
import { log } from './utils/log.utils';
import { UserManager } from './services/user.manager';
import { StateManager } from './services/state-manager';
import { SessionHandler } from './handlers/session.handler';
import { PageViewHandler } from './handlers/page-view.handler';
import { ClickHandler } from './handlers/click.handler';

let app: App;

export class App extends StateManager {
  private eventManager!: EventManager;
  private suppressNextScroll = false;

  async init(appConfig: AppConfig): Promise<void> {
    await this.setState(appConfig);
    this.setManagers();
    this.initHandlers();
  }

  private async setState(appConfig: AppConfig): Promise<void> {
    this.setApiUrl(appConfig.id);
    await this.setConfig(appConfig);
    this.setUserId();
    this.setDevice();
  }

  private setApiUrl(id: string): void {
    const apiManager = new ApiManager();
    this.set('apiUrl', apiManager.getUrl(id));
  }

  private async setConfig(appConfig: AppConfig): Promise<void> {
    const configManager = new ConfigManager();
    const config = await configManager.get(this.get('apiUrl'), appConfig);

    this.set('config', config);
  }

  private setUserId(): void {
    const userManager = new UserManager();
    const userId = userManager.getUserId();

    this.set('userId', userId);
  }

  private setDevice(): void {
    const device = getDeviceType();
    this.set('device', device);
  }

  private setManagers(): void {
    this.setEventManager();
  }

  private initHandlers(): void {
    this.initSessionHandler();
    this.initPageViewHandler();
    this.initClickHandler();
  }

  private setEventManager(): void {
    this.eventManager = new EventManager();
  }

  private initSessionHandler(): void {
    const onSessionTrack = (): void => {};
    const sessionHandler = new SessionHandler(this.eventManager, onSessionTrack);

    sessionHandler.startTracking();
  }

  private initPageViewHandler(): void {
    const onPageViewTrack = (): void => this.onPageViewTrack();
    const pageViewHandler = new PageViewHandler(this.eventManager, onPageViewTrack);

    pageViewHandler.startTracking();
  }

  private onPageViewTrack(): void {
    this.suppressNextScroll = true;

    setTimeout(() => {
      this.suppressNextScroll = false;
    }, SCROLL_DEBOUNCE_TIME * 2);
  }

  private initClickHandler(): void {
    const onClickTrack = (): void => {};
    const clickHandler = new ClickHandler(this.eventManager, onClickTrack);

    clickHandler.startTracking();
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
