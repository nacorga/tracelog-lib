import { init, event, on, off, isInitialized, getSessionId, getUserId, destroy, identify, resetIdentity } from './api';

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
  getSessionId,
  getUserId,
  destroy,
  identify,
  resetIdentity,
};
