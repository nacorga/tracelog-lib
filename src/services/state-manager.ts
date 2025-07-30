import { State } from '../types/state.types';

export abstract class StateManager {
  private state: State = {} as State;

  get<T extends keyof State>(key: T): State[T] {
    return this.state[key];
  }

  set<T extends keyof State>(key: T, value: State[T]): void {
    this.state[key] = value;
  }
}
