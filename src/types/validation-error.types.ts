/**
 * Custom error classes for TraceLog validation errors
 * Provides better error handling and consistency across validation layers
 */

/**
 * Base class for all TraceLog validation errors
 */
export abstract class TraceLogValidationError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string,
    public readonly layer: 'config' | 'app' | 'runtime',
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when project ID validation fails
 */
export class ProjectIdValidationError extends TraceLogValidationError {
  constructor(message = 'Project ID is required', layer: 'config' | 'app' | 'runtime' = 'config') {
    super(message, 'PROJECT_ID_INVALID', layer);
  }
}

/**
 * Thrown when app configuration validation fails
 */
export class AppConfigValidationError extends TraceLogValidationError {
  constructor(message: string, layer: 'config' | 'app' | 'runtime' = 'config') {
    super(message, 'APP_CONFIG_INVALID', layer);
  }
}

/**
 * Thrown when session timeout validation fails
 */
export class SessionTimeoutValidationError extends TraceLogValidationError {
  constructor(message: string, layer: 'config' | 'app' | 'runtime' = 'config') {
    super(message, 'SESSION_TIMEOUT_INVALID', layer);
  }
}

/**
 * Thrown when sampling rate validation fails
 */
export class SamplingRateValidationError extends TraceLogValidationError {
  constructor(message: string, layer: 'config' | 'app' | 'runtime' = 'config') {
    super(message, 'SAMPLING_RATE_INVALID', layer);
  }
}

/**
 * Thrown when integrations validation fails
 */
export class IntegrationValidationError extends TraceLogValidationError {
  constructor(message: string, layer: 'config' | 'app' | 'runtime' = 'config') {
    super(message, 'INTEGRATION_INVALID', layer);
  }
}

/**
 * Type guard to check if an error is a TraceLog validation error
 */
export function isTraceLogValidationError(error: unknown): error is TraceLogValidationError {
  return error instanceof TraceLogValidationError;
}

/**
 * Type guard to check if an error is a specific validation error type
 */
export function isProjectIdValidationError(error: unknown): error is ProjectIdValidationError {
  return error instanceof ProjectIdValidationError;
}
