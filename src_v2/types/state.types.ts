import { Config } from './config.types';
import { DeviceType } from './device.types';

export interface State {
  apiUrl: string;
  config: Config;
  sessionId: string | null;
  userId: string;
  device: DeviceType;
  pageUrl: string;
  hasStartSession: boolean;
  suppressNextScroll: boolean;
  circuitBreakerOpen: boolean;
}
