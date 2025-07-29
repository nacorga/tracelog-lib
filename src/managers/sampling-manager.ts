import { DEFAULT_SAMPLING_RATE } from '../app.constants';
import { Config } from '../types/config.types';

export class SamplingManager {
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
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

  public isSampledIn(userId: string): boolean {
    const samplingRate = this.config.samplingRate ?? DEFAULT_SAMPLING_RATE;

    if (samplingRate >= 1.0) {
      return true;
    }

    if (samplingRate <= 0) {
      return false;
    }

    const userHash = this.getHash(userId);
    const userValue = (userHash % 100) / 100;
    const isSampled = userValue < samplingRate;

    return isSampled;
  }
}
