import { Config } from './config.types';
import { DeviceType } from './device.types';
import { Mode } from './mode.types';

export interface State {
  mode?: Mode;
  collectApiUrl: string;
  config: Config;
  sessionId: string | null;
  userId: string;
  device: DeviceType;
  pageUrl: string;
  hasStartSession: boolean;
  suppressNextScroll: boolean;
  scrollEventCount?: number;
}
