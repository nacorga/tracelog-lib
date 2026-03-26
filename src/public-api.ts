import {
  init,
  event,
  on,
  off,
  isInitialized,
  getSessionId,
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
  destroy,
  setQaMode,
  updateGlobalMetadata,
  mergeGlobalMetadata,
  identify,
  resetIdentity,
};
