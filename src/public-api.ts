import {
  init,
  event,
  on,
  off,
  isInitialized,
  getSessionId,
  getUserId,
  destroy,
  setQaMode,
  setTransformer,
  removeTransformer,
  setCustomHeaders,
  removeCustomHeaders,
  updateGlobalMetadata,
  mergeGlobalMetadata,
  identify,
  resetIdentity,
  flushImmediately,
  flushImmediatelySync,
} from './api';

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
  setCustomHeaders,
  removeCustomHeaders,
  isInitialized,
  getSessionId,
  getUserId,
  destroy,
  setQaMode,
  updateGlobalMetadata,
  mergeGlobalMetadata,
  identify,
  resetIdentity,
  flushImmediately,
  flushImmediatelySync,
};
