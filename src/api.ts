import { App } from './app';
import { MetadataType, Config, EmitterCallback, EmitterMap } from './types';
import { log, validateAndNormalizeConfig } from './utils';
import { TestBridge } from './test-bridge';
import './types/window.types';

let app: App | null = null;
let isInitializing = false;
let isDestroying = false;

export const init = async (config: Config): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('[TraceLog] This library can only be used in a browser environment');
  }

  if (window.__traceLogDisabled) {
    return;
  }

  if (app) {
    return;
  }

  if (isInitializing) {
    return;
  }

  isInitializing = true;

  try {
    const validatedConfig = validateAndNormalizeConfig(config);
    const instance = new App();

    try {
      await instance.init(validatedConfig);
      app = instance;
    } catch (error) {
      try {
        await instance.destroy(true);
      } catch (cleanupError) {
        log('error', 'Failed to cleanup partially initialized app', { error: cleanupError });
      }

      throw error;
    }
  } catch (error) {
    app = null;
    throw error;
  } finally {
    isInitializing = false;
  }
};

export const event = (name: string, metadata?: Record<string, MetadataType> | Record<string, MetadataType>[]): void => {
  if (!app) {
    throw new Error('[TraceLog] TraceLog not initialized. Please call init() first.');
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Cannot send events while TraceLog is being destroyed');
  }

  app.sendCustomEvent(name, metadata);
};

export const on = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
  if (!app) {
    throw new Error('[TraceLog] TraceLog not initialized. Please call init() first.');
  }

  app.on(event, callback);
};

export const off = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
  if (!app) {
    throw new Error('[TraceLog] TraceLog not initialized. Please call init() first.');
  }

  app.off(event, callback);
};

export const isInitialized = (): boolean => {
  return app !== null;
};

export const destroy = async (): Promise<void> => {
  if (!app) {
    throw new Error('[TraceLog] App not initialized');
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Destroy operation already in progress');
  }

  isDestroying = true;

  try {
    await app.destroy();
    app = null;
    isInitializing = false;
  } catch (error) {
    app = null;
    isInitializing = false;
    log('error', 'Error during destroy, forced cleanup', { error });
    throw error;
  } finally {
    isDestroying = false;
  }
};

if (process.env.NODE_ENV === 'dev' && typeof window !== 'undefined') {
  const injectTestingBridge = (): void => {
    window.__traceLogBridge = new TestBridge(isInitializing, isDestroying);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTestingBridge);
  } else {
    injectTestingBridge();
  }
}
