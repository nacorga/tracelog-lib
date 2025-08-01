import { State } from '../types/state.types';

const globalState: State = {} as State;

export abstract class StateManager {
  protected get<T extends keyof State>(key: T): State[T] {
    return globalState[key];
  }

  protected set<T extends keyof State>(key: T, value: State[T]): void {
    globalState[key] = value;
  }
}
