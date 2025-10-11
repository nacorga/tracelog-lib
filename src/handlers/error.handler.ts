import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { ErrorType, EventType } from '../types';
import { log } from '../utils';
import {
  PII_PATTERNS,
  MAX_ERROR_MESSAGE_LENGTH,
  ERROR_SUPPRESSION_WINDOW_MS,
  MAX_TRACKED_ERRORS,
  MAX_TRACKED_ERRORS_HARD_LIMIT,
  DEFAULT_ERROR_SAMPLING_RATE,
  ERROR_BURST_WINDOW_MS,
  ERROR_BURST_THRESHOLD,
  ERROR_BURST_BACKOFF_MS,
} from '../constants/error.constants';

/**
 * Simplified error handler for tracking JavaScript errors and unhandled promise rejections
 * Includes PII sanitization and sampling support
 */
export class ErrorHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly recentErrors = new Map<string, number>();
  private errorBurstCounter = 0;
  private burstWindowStart = 0;
  private burstBackoffUntil = 0;

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
    this.errorBurstCounter = 0;
    this.burstWindowStart = 0;
    this.burstBackoffUntil = 0;
  }

  /**
   * Checks sampling rate and burst detection (Phase 3)
   * Returns false if in cooldown period after burst detection
   */
  private shouldSample(): boolean {
    const now = Date.now();

    // Check if in backoff period (Phase 3)
    if (now < this.burstBackoffUntil) {
      return false;
    }

    // Reset burst counter if window expired
    if (now - this.burstWindowStart > ERROR_BURST_WINDOW_MS) {
      this.errorBurstCounter = 0;
      this.burstWindowStart = now;
    }

    // Increment burst counter
    this.errorBurstCounter++;

    // Trigger backoff if burst threshold exceeded
    if (this.errorBurstCounter > ERROR_BURST_THRESHOLD) {
      this.burstBackoffUntil = now + ERROR_BURST_BACKOFF_MS;
      log('warn', 'Error burst detected - entering cooldown', {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: ERROR_BURST_BACKOFF_MS,
        },
      });
      return false;
    }

    // Normal sampling logic
    const config = this.get('config');
    const samplingRate = config?.errorSampling ?? DEFAULT_ERROR_SAMPLING_RATE;
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

    if (typeof reason === 'object' && 'message' in reason) {
      return String(reason.message);
    }

    try {
      return JSON.stringify(reason);
    } catch {
      return String(reason);
    }
  }

  private sanitize(text: string): string {
    let sanitized = text.length > MAX_ERROR_MESSAGE_LENGTH ? text.slice(0, MAX_ERROR_MESSAGE_LENGTH) + '...' : text;

    for (const pattern of PII_PATTERNS) {
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
