/**
 * Common event filters for TraceLog testing
 */
export const COMMON_FILTERS = {
  INITIALIZATION: { namespace: 'App', messageContains: 'initialization' },
  SESSION_START: { namespace: 'SessionManager', messageContains: 'Session started' },
  SESSION_END: { namespace: 'SessionManager', messageContains: 'Session ended' },
  CUSTOM_EVENT: { namespace: 'EventManager', messageContains: 'Custom event tracked' },
  PAGE_VIEW: { namespace: 'PageViewHandler', messageContains: 'Page view tracked' },
  CLICK: { namespace: 'ClickHandler', messageContains: 'Click event tracked' },
  ERROR: { namespace: 'ErrorHandler', messageContains: 'error' },
} as const;

/**
 * Default timeout for waiting for events (in milliseconds)
 */
export const DEFAULT_TIMEOUT = 5000;
