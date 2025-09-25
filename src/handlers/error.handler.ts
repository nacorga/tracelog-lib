import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { ErrorType, EventType } from '../types';
import { debugLog } from '../utils/logging';

/**
 * Simplified error handler for tracking JavaScript errors and unhandled promise rejections
 * Includes PII sanitization and sampling support
 */
export class ErrorHandler extends StateManager {
  private readonly eventManager: EventManager;

  private static readonly PII_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, // Email
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone US
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
    /\b[A-Z]{2}\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/gi, // IBAN
  ];

  private static readonly MAX_ERROR_MESSAGE_LENGTH = 500;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  startTracking(): void {
    window.addEventListener('error', this.handleError);
    window.addEventListener('unhandledrejection', this.handleRejection);
    debugLog.debug('ErrorHandler', 'Error tracking started');
  }

  stopTracking(): void {
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleRejection);
    debugLog.debug('ErrorHandler', 'Error tracking stopped');
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

    debugLog.warn('ErrorHandler', 'JS error captured', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
    });

    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.JS_ERROR,
        message: this.sanitize(event.message || 'Unknown error'),
        ...(event.filename && { url: event.filename }),
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

    debugLog.warn('ErrorHandler', 'Promise rejection captured', { message });

    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.PROMISE_REJECTION,
        message: this.sanitize(message),
      },
    });
  };

  private extractRejectionMessage(reason: unknown): string {
    if (!reason) return 'Unknown rejection';

    if (typeof reason === 'string') return reason;

    if (reason instanceof Error) {
      return reason.stack || reason.message || reason.toString();
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
    let sanitized =
      text.length > ErrorHandler.MAX_ERROR_MESSAGE_LENGTH
        ? text.slice(0, ErrorHandler.MAX_ERROR_MESSAGE_LENGTH) + '...'
        : text;

    for (const pattern of ErrorHandler.PII_PATTERNS) {
      // Create new regex instance to avoid global flag state issues
      const regex = new RegExp(pattern.source, pattern.flags);
      sanitized = sanitized.replace(regex, '[REDACTED]');
    }

    return sanitized;
  }
}
