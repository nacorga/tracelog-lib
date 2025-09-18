import { State } from '../types';
import { debugLog } from '../utils/logging';

const globalState: State = {} as State;

export abstract class StateManager {
  protected get<T extends keyof State>(key: T): State[T] {
    return globalState[key];
  }

  protected set<T extends keyof State>(key: T, value: State[T]): void {
    const oldValue = globalState[key];
    globalState[key] = value;

    // Log critical state changes
    if (key === 'sessionId' || key === 'config' || key === 'hasStartSession') {
      debugLog.debug('StateManager', 'Critical state updated', {
        key,
        oldValue: key === 'config' ? !!oldValue : oldValue,
        newValue: key === 'config' ? !!value : value,
      });
    }
  }
}
