/**
 * Common event filters for TraceLog testing
 */
export const COMMON_FILTERS = {
  INITIALIZATION: { namespace: 'App', messageContains: 'initialization' },
  SESSION_START: { namespace: 'SessionHandler', messageContains: 'Session started' },
  SESSION_END: { namespace: 'SessionHandler', messageContains: 'Session ended' },
  SESSION_MANAGER: { namespace: 'SessionManager', messageContains: 'Session' },
  SESSION_HANDLER: { namespace: 'SessionHandler', messageContains: 'Session' },
  CUSTOM_EVENT: { namespace: 'EventManager', messageContains: 'Custom event tracked' },
  PAGE_VIEW: { namespace: 'PageViewHandler', messageContains: 'Page view tracked' },
  CLICK: { namespace: 'ClickHandler', messageContains: 'Click event tracked' },
  SCROLL: { namespace: 'ScrollHandler', messageContains: 'Scroll' },
  PERFORMANCE: { namespace: 'PerformanceHandler', messageContains: 'Performance' },
  ERROR: { namespace: 'ErrorHandler', messageContains: 'error' },
  NETWORK: { namespace: 'NetworkHandler', messageContains: 'Network' },
  EVENT_MANAGER: { namespace: 'EventManager', messageContains: 'Event' },
  STATE_MANAGER: { namespace: 'StateManager', messageContains: 'State' },
} as const;

/**
 * Default timeout for waiting for events (in milliseconds)
 */
export const DEFAULT_TIMEOUT = 5000;
