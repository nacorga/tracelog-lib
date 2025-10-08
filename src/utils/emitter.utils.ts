import { EmitterCallback, EmitterMap } from '../types';

export class Emitter {
  private readonly listeners: Map<string, EmitterCallback[]> = new Map();

  on<K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);
  }

  off<K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void {
    const callbacks = this.listeners.get(event);

    if (callbacks) {
      const index = callbacks.indexOf(callback);

      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit<K extends keyof EmitterMap>(event: K, data: EmitterMap[K]): void {
    const callbacks = this.listeners.get(event);

    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(data);
      });
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
