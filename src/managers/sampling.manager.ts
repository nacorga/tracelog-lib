import { DEFAULT_SAMPLING_RATE } from '../constants';
import { StateManager } from './state.manager';

export class SamplingManager extends StateManager {
  isSampledIn(): boolean {
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
