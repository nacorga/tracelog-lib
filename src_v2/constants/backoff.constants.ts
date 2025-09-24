/**
 * Centralized backoff configuration for all components
 * This ensures consistency between EventManager circuit breaker and SenderManager retry logic
 */

export const BACKOFF_CONFIGS = {
  /** Circuit breaker backoff configuration for EventManager */
  CIRCUIT_BREAKER: {
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    multiplier: 2,
  },

  /** Retry backoff configuration for SenderManager */
  RETRY: {
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    multiplier: 2,
  },

  /** General backoff configuration for other components */
  DEFAULT: {
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    multiplier: 2,
  },
} as const;

// Validate configurations are synchronized
const validateBackoffSync = (): void => {
  const { CIRCUIT_BREAKER, RETRY } = BACKOFF_CONFIGS;

  if (
    CIRCUIT_BREAKER.initialDelay !== RETRY.initialDelay ||
    CIRCUIT_BREAKER.maxDelay !== RETRY.maxDelay ||
    CIRCUIT_BREAKER.multiplier !== RETRY.multiplier
  ) {
    console.warn('TraceLog: Backoff configurations are not synchronized between components');
  }
};

// Run validation in development
if (process.env.NODE_ENV !== 'production') {
  validateBackoffSync();
}
