import { DEFAULT_SAMPLING_RATE, WEB_VITALS_SAMPLING, WEB_VITALS_LONG_TASK_SAMPLING } from '../constants';
import { EventType, WebVitalsData, WebVitalType } from '../types';
import { StateManager } from './state.manager';

export class SamplingManager extends StateManager {
  shouldSampleEvent(type: EventType, webVitals?: WebVitalsData): boolean {
    const isQaMode = this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug';

    if (isQaMode) {
      return true;
    }

    if (type === EventType.WEB_VITALS) {
      return this.isWebVitalEventSampledIn(webVitals?.type);
    }

    return this.isSampledIn();
  }

  private isSampledIn(): boolean {
    const samplingRate = this.get('config').samplingRate ?? DEFAULT_SAMPLING_RATE;

    if (samplingRate >= 1.0) {
      return true;
    }

    if (samplingRate <= 0) {
      return false;
    }

    const userHash = this.getHash(this.get('userId'));
    const userValue = (userHash % 100) / 100;
    const isSampled = userValue < samplingRate;

    return isSampled;
  }

  private isWebVitalEventSampledIn(type?: WebVitalType): boolean {
    const isLongTask = type === 'LONG_TASK';
    const rate = isLongTask ? WEB_VITALS_LONG_TASK_SAMPLING : WEB_VITALS_SAMPLING;

    if (rate >= 1) return true;
    if (rate <= 0) return false;

    const seed = `${this.get('userId')}|${isLongTask ? 'long_task' : 'web_vitals'}`;
    const hash = this.getHash(seed);
    const value = (hash % 100) / 100;

    return value < rate;
  }

  private getHash(input: string): number {
    let hash = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);

      hash = (hash << 5) - hash + char;
      hash |= 0;
    }

    return Math.abs(hash);
  }
}
