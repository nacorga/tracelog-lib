import { DEFAULT_CONFIG } from '../app.constants';
import { State } from '../types/state.types';

export class StateManager {
  private state: State;

  constructor() {
    this.state = {
      apiUrl: '',
      config: DEFAULT_CONFIG,
      sessionId: '',
      userId: '',
    };
  }

  getState<T extends keyof State>(key: T): State[T] {
    return this.state[key];
  }

  setState<T extends keyof State>(key: T, value: State[T]): void {
    this.state[key] = value;
  }
}
