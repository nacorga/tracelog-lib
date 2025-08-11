import { WebVitalType } from './event.types';

export type NavigationId = string;

export interface VitalSample {
  type: WebVitalType;
  value: number;
}
