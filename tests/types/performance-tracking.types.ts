export interface WebVitalsEvent {
  type: string;
  web_vitals?: {
    type: string;
    value: number;
  };
  timestamp?: number;
  page_url?: string;
}

export interface LongTaskEvent {
  type: string;
  timestamp?: number;
  page_url?: string;
  web_vitals?: {
    type: string;
    value: number;
  };
}

export interface WebVitalsValidationResult {
  type: string;
  value: number;
  hasType: boolean;
  hasValue: boolean;
  valueIsFinite: boolean;
  valueIsValid: boolean;
  hasTimestamp: boolean;
  hasPageUrl: boolean;
  eventStructure: {
    hasType: boolean;
    hasWebVitals: boolean;
    hasTimestamp: boolean;
    hasPageUrl: boolean;
  };
}

export interface LongTaskDetectionInfo {
  hasLongTasks: boolean;
  longTaskCount: number;
  longTaskValues: number[];
  validDurations: boolean;
  validThreshold: boolean;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
}

export interface ThrottlingTestInfo {
  totalLongTasks: number;
  eventsWithinThrottleWindow: number;
  throttleEffective: boolean;
  timeBetweenEvents: number[];
  respectsThrottleLimit: boolean;
}

export interface SamplingTestInfo {
  attemptsGenerated: number;
  eventsRecorded: number;
  samplingRatio: number;
  withinExpectedRange: boolean;
}

export interface BrowserCapabilityInfo {
  hasPerformanceObserver: boolean;
  supportsLongTask: boolean;
  userAgent: string;
}

export interface MetricRangeValidation {
  type: string;
  value: number;
  isWithinExpectedRange: boolean;
  expectedRange: string;
}

export interface EventsByType {
  [key: string]: WebVitalsEvent[];
}

export interface DuplicateDetectionInfo {
  type: string;
  count: number;
  hasDuplicates: boolean;
}

export interface MemoryUsageInfo {
  timestamp: number;
  duration: number;
  memoryUsage?: number;
}

export interface InitializationPerformanceInfo {
  initStartTime: number;
  initEndTime: number;
  initDuration: number;
  memoryBeforeInit: number;
  memoryAfterInit: number;
  memoryIncrease: number;
  withinTimeThreshold: boolean;
  withinMemoryThreshold: boolean;
}

export interface MainThreadPerformanceInfo {
  taskStartTime: number;
  taskEndTime: number;
  taskDuration: number;
  blockingDuration: number;
  isMainThreadBlocked: boolean;
  withinBlockingThreshold: boolean;
}

export interface PassiveListenerInfo {
  eventType: string;
  isPassive: boolean;
  listenerCount: number;
  supportsPassive: boolean;
}

export interface UserInteractionPerformanceInfo {
  interactionType: string;
  startTime: number;
  endTime: number;
  responseTime: number;
  withinDelayThreshold: boolean;
  wasBlocked: boolean;
}

export interface EventProcessingPerformanceInfo {
  eventType: string;
  processingStartTime: number;
  processingEndTime: number;
  processingDuration: number;
  withinProcessingThreshold: boolean;
  queueLength: number;
}

export interface AsyncOperationPerformanceInfo {
  operationType: string;
  startTime: number;
  endTime: number;
  duration: number;
  interferedWithInteraction: boolean;
  withinDelayThreshold: boolean;
}

export interface PerformanceImpactAnalysis {
  testable: boolean;
  initialization: InitializationPerformanceInfo;
  mainThreadBlocking: MainThreadPerformanceInfo[];
  passiveListeners: PassiveListenerInfo[];
  userInteractions: UserInteractionPerformanceInfo[];
  eventProcessing: EventProcessingPerformanceInfo[];
  asyncOperations: AsyncOperationPerformanceInfo[];
  memoryUsage: {
    baseline: number;
    peak: number;
    current: number;
    stable: boolean;
    withinThreshold: boolean;
  };
  overallPerformanceScore: {
    score: number; // 0-100
    passed: boolean;
    issues: string[];
  };
}
