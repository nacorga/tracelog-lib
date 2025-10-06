import { State } from '../types';
import { DEFAULT_SAMPLING_RATE } from '../constants';

const globalState: State = {} as State;

export function getGlobalState(): Readonly<State> {
  return globalState;
}

export function resetGlobalState(): void {
  Object.keys(globalState).forEach((key) => {
    delete globalState[key as keyof State];
  });
}

export abstract class StateManager {
  protected get<T extends keyof State>(key: T): State[T] {
    return globalState[key];
  }

  protected set<T extends keyof State>(key: T, value: State[T]): void {
    if (key === 'config' && value) {
      const configValue = value as State['config'];

      if (configValue) {
        const samplingRate = configValue.samplingRate ?? DEFAULT_SAMPLING_RATE;
        const normalizedSamplingRate = samplingRate < 0 || samplingRate > 1 ? DEFAULT_SAMPLING_RATE : samplingRate;
        const hasNormalizedSampling = normalizedSamplingRate !== samplingRate;

        if (hasNormalizedSampling) {
          const normalizedConfig = { ...configValue, samplingRate: normalizedSamplingRate };
          globalState[key] = normalizedConfig as State[T];
        } else {
          globalState[key] = configValue as State[T];
        }
      } else {
        globalState[key] = value;
      }
    } else {
      globalState[key] = value;
    }
  }

  protected getState(): Readonly<State> {
    return { ...globalState };
  }
}
