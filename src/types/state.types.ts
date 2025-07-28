import { Config } from './config.types';

export interface State {
  apiUrl: string;
  config: Config;
  sessionId: string;
  userId: string;
}
