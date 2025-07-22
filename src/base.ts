import { LogManager } from './modules';

export abstract class Base {
  private readonly logManager: LogManager;

  constructor() {
    this.logManager = new LogManager();
  }

  protected log(type: 'info' | 'warning' | 'error', message: string): void {
    this.logManager.log(type, message);
  }
}
