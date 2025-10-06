import { init, event, on, off, isInitialized, destroy } from './api';

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
  isInitialized,
  destroy,
};
