import { State } from '../types';
import { debugLog } from '../utils/logging';

const globalState: State = {} as State;
let stateVersion = 0;
const updateQueue: Array<() => void> = [];
let isUpdating = false;

export abstract class StateManager {
  protected get<T extends keyof State>(key: T): State[T] {
    return globalState[key];
  }

  protected async set<T extends keyof State>(key: T, value: State[T]): Promise<void> {
    return new Promise<void>((resolve) => {
      const update = (): void => {
        const oldValue = globalState[key];
        const oldVersion = stateVersion;

        globalState[key] = value;
        stateVersion++;

        if (key === 'sessionId' || key === 'config' || key === 'hasStartSession') {
          debugLog.debug('StateManager', 'Critical state updated', {
            key,
            oldValue: key === 'config' ? !!oldValue : oldValue,
            newValue: key === 'config' ? !!value : value,
            version: stateVersion,
            previousVersion: oldVersion,
          });
        }

        resolve();
        this.processNextUpdate();
      };

      updateQueue.push(update);
      this.processNextUpdate();
    });
  }

  private processNextUpdate(): void {
    if (isUpdating || updateQueue.length === 0) {
      return;
    }

    isUpdating = true;
    const update = updateQueue.shift();

    if (update) {
      update();
    }

    isUpdating = false;

    if (updateQueue.length > 0) {
      this.processNextUpdate();
    }
  }

  protected getStateVersion(): number {
    return stateVersion;
  }
}
