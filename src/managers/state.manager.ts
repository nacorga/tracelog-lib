import { State } from '../types';

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
    globalState[key] = value;
  }

  protected getState(): Readonly<State> {
    return { ...globalState };
  }
}
