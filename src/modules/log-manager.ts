import { logError, logInfo, logWarning } from '../utils';

export class LogManager {
  log(type: 'info' | 'warning' | 'error', message: string): void {
    if (type === 'info') {
      logInfo(message);
    } else if (type === 'warning') {
      logWarning(message);
    } else {
      logError(message);
    }
  }
}
