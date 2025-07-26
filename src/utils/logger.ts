import { logInfo, logWarning, logError } from './error.utils';

export type LogType = 'info' | 'warning' | 'error';

export const log = (type: LogType, message: string): void => {
  if (type === 'info') {
    logInfo(message);
  } else if (type === 'warning') {
    logWarning(message);
  } else {
    logError(message);
  }
};
