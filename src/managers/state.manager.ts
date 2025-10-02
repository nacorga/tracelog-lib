import { State } from '../types';
import { debugLog } from '../utils/logging';
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
    const oldValue = globalState[key];

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

    if (this.isCriticalStateKey(key) && this.shouldLog(oldValue, globalState[key])) {
      debugLog.debug('StateManager', 'State updated', {
        key,
        oldValue: this.formatLogValue(key, oldValue),
        newValue: this.formatLogValue(key, globalState[key]),
      });
    }
  }

  protected getState(): Readonly<State> {
    return { ...globalState };
  }

  private isCriticalStateKey(key: keyof State): boolean {
    return key === 'sessionId' || key === 'config' || key === 'hasStartSession';
  }

  private shouldLog<T extends keyof State>(oldValue: State[T], newValue: State[T]): boolean {
    return oldValue !== newValue;
  }

  private formatLogValue<T extends keyof State>(key: T, value: State[T]): State[T] | string {
    if (key === 'config') {
      return value ? '(configured)' : '(not configured)';
    }
    return value;
  }
}
