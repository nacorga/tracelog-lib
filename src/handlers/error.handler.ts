import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { ErrorType, EventType } from '../types';
import {
  PII_PATTERNS,
  MAX_ERROR_MESSAGE_LENGTH,
  ERROR_SUPPRESSION_WINDOW_MS,
  MAX_TRACKED_ERRORS,
  MAX_TRACKED_ERRORS_HARD_LIMIT,
} from '../constants/error.constants';

/**
 * Simplified error handler for tracking JavaScript errors and unhandled promise rejections
 * Includes PII sanitization and sampling support
 */
export class ErrorHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly recentErrors = new Map<string, number>();

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  startTracking(): void {
    window.addEventListener('error', this.handleError);
    window.addEventListener('unhandledrejection', this.handleRejection);
  }

  stopTracking(): void {
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleRejection);
    this.recentErrors.clear();
  }

  private shouldSample(): boolean {
    const config = this.get('config');
    const samplingRate = config?.errorSampling ?? 0.1;
    return Math.random() < samplingRate;
  }

  private readonly handleError = (event: ErrorEvent): void => {
    if (!this.shouldSample()) {
      return;
    }

    const sanitizedMessage = this.sanitize(event.message || 'Unknown error');

    if (this.shouldSuppressError(ErrorType.JS_ERROR, sanitizedMessage)) {
      return;
    }

    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.JS_ERROR,
        message: sanitizedMessage,
        ...(event.filename && { filename: event.filename }),
        ...(event.lineno && { line: event.lineno }),
        ...(event.colno && { column: event.colno }),
      },
    });
  };

  private readonly handleRejection = (event: PromiseRejectionEvent): void => {
    if (!this.shouldSample()) {
      return;
    }

    const message = this.extractRejectionMessage(event.reason);
    const sanitizedMessage = this.sanitize(message);

    if (this.shouldSuppressError(ErrorType.PROMISE_REJECTION, sanitizedMessage)) {
      return;
    }

    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.PROMISE_REJECTION,
        message: sanitizedMessage,
      },
    });
  };

  private extractRejectionMessage(reason: unknown): string {
    if (!reason) return 'Unknown rejection';

    if (typeof reason === 'string') return reason;

    if (reason instanceof Error) {
      return reason.stack ?? reason.message ?? reason.toString();
    }

    // Handle objects with message property
    if (typeof reason === 'object' && 'message' in reason) {
      return String(reason.message);
    }

    // Try to stringify objects
    try {
      return JSON.stringify(reason);
    } catch {
      return String(reason);
    }
  }

  private sanitize(text: string): string {
    let sanitized = text.length > MAX_ERROR_MESSAGE_LENGTH ? text.slice(0, MAX_ERROR_MESSAGE_LENGTH) + '...' : text;

    for (const pattern of PII_PATTERNS) {
      // Create new regex instance to avoid global flag state issues
      const regex = new RegExp(pattern.source, pattern.flags);
      sanitized = sanitized.replace(regex, '[REDACTED]');
    }

    return sanitized;
  }

  private shouldSuppressError(type: ErrorType, message: string): boolean {
    const now = Date.now();
    const key = `${type}:${message}`;
    const lastSeenAt = this.recentErrors.get(key);

    if (lastSeenAt && now - lastSeenAt < ERROR_SUPPRESSION_WINDOW_MS) {
      this.recentErrors.set(key, now);
      return true;
    }

    this.recentErrors.set(key, now);

    if (this.recentErrors.size > MAX_TRACKED_ERRORS_HARD_LIMIT) {
      // Hard limit exceeded, clearing all tracked errors
      this.recentErrors.clear();
      this.recentErrors.set(key, now);

      return false;
    }

    if (this.recentErrors.size > MAX_TRACKED_ERRORS) {
      this.pruneOldErrors();
    }

    return false;
  }

  private pruneOldErrors(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.recentErrors.entries()) {
      if (now - timestamp > ERROR_SUPPRESSION_WINDOW_MS) {
        this.recentErrors.delete(key);
      }
    }

    if (this.recentErrors.size <= MAX_TRACKED_ERRORS) {
      return;
    }

    const entries = Array.from(this.recentErrors.entries()).sort((a, b) => a[1] - b[1]);
    const excess = this.recentErrors.size - MAX_TRACKED_ERRORS;

    for (let index = 0; index < excess; index += 1) {
      const entry = entries[index];
      if (entry) {
        this.recentErrors.delete(entry[0]);
      }
    }
  }
}
