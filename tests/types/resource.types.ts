export interface ResourceSnapshot {
  domListeners: {
    click: number;
    scroll: number;
    beforeunload: number;
    visibilitychange: number;
    focus: number;
    blur: number;
    touchstart: number;
    touchend: number;
    total: number;
  };
  timers: {
    timeouts: number;
    intervals: number;
    total: number;
  };
  storage: {
    traceLogKeys: string[];
    totalKeys: number;
    traceLogEntries: number;
  };
  broadcastChannels: {
    activeChannels: string[];
    channelCount: number;
  };
  memoryUsage?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}
