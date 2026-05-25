import { Config } from './config.types';
import { DeviceInfo } from './device.types';
import { UTM } from './event.types';
import { Mode } from './mode.types';
import { IdentifyData } from './queue.types';

export interface State {
  /** QA mode flag - when true, custom events are logged to console */
  mode?: Mode;
  /**
   * Collection of API URLs for different integrations.
   * - saas: TraceLog SaaS endpoint (if projectId configured)
   */
  collectApiUrls: {
    saas?: string;
  };
  config: Config;
  sessionId: string | null;
  userId: string;
  device: DeviceInfo;
  pageUrl: string;
  hasStartSession: boolean;
  suppressNextScroll: boolean;
  scrollEventCount?: number;
  sessionReferrer?: string;
  sessionUtm?: UTM;
  /** Visitor identity from identify() call */
  identity?: IdentifyData;
}
