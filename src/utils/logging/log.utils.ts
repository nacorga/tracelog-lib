import { LogType } from '../../types/log.types';

/**
 * Builds a formatted log message with TraceLog prefix
 * @param message - The message to format
 * @returns The formatted message
 */
const buildMessage = (message: string): string => {
  return `[TraceLog] ${message}`;
};

/**
 * Logs a message with the appropriate console method based on log type
 * @param type - The type of log (info, warning, error)
 * @param message - The message to log
 */
export const log = (type: LogType, message: string): void => {
  if (type === 'info') {
    console.log(buildMessage(message));
  } else if (type === 'warning') {
    console.warn(buildMessage(message));
  } else {
    console.error(buildMessage(message));
  }
};
