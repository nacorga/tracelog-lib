import { Config } from './config.types';
import { DeviceType } from './device.types';
import { Mode } from './mode.types';
import { EventData } from './event.types';
import { EventsQueue } from './queue.types';

export interface State {
  mode?: Mode;
  collectApiUrls: {
    saas: string;
    custom: string;
  };
  config: Config;
  sessionId: string | null;
  userId: string;
  device: DeviceType;
  pageUrl: string;
  hasStartSession: boolean;
  suppressNextScroll: boolean;
  scrollEventCount?: number;
  transformers: {
    custom?: {
      beforeSend?: (event: EventData) => EventData | null;
      beforeBatch?: (queue: EventsQueue) => EventsQueue | null;
    };
    googleAnalytics?: {
      beforeSend?: (event: EventData) => EventData | null;
    };
  };
}
