import { LogType } from '../types/log.types';

const buildMessage = (message: string): string => {
  return `[TraceLog] ${message}`;
};

export const log = (type: LogType, message: string): void => {
  if (type === 'info') {
    console.log(buildMessage(message));
  } else if (type === 'warning') {
    console.warn(buildMessage(message));
  } else {
    console.error(buildMessage(message));
  }
};
