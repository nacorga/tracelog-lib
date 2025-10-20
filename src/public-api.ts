import { init, event, on, off, isInitialized, destroy, setQaMode, setTransformer, removeTransformer } from './api';

// Constants
export * from './app.constants';

// Types
export * from './types';

// TraceLog namespace containing all API methods
export const tracelog = {
  init,
  event,
  on,
  off,
  setTransformer,
  removeTransformer,
  isInitialized,
  destroy,
  setQaMode,
};
