import { Config } from './config.types';
import { DeviceType } from './device.types';
import { Mode } from './mode.types';

export interface State {
  mode?: Mode;
  /**
   * Collection of API URLs for different integrations.
   * - saas: TraceLog SaaS endpoint (if projectId configured)
   * - custom: Custom backend endpoint (if collectApiUrl configured)
   */
  collectApiUrls: {
    saas?: string;
    custom?: string;
  };
  config: Config;
  sessionId: string | null;
  userId: string;
  device: DeviceType;
  pageUrl: string;
  hasStartSession: boolean;
  suppressNextScroll: boolean;
  scrollEventCount?: number;
}
