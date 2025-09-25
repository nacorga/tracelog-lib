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
  private readonly piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone US
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
    /\b[A-Z]{2}\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // IBAN
  ];

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

  private readonly handleError = (event: ErrorEvent): void => {
    const config = this.get('config');
    const samplingRate = config?.errorSampling ?? 0.1;

    if (Math.random() >= samplingRate) {
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
      },
    });
  };

  private readonly handleRejection = (event: PromiseRejectionEvent): void => {
    const config = this.get('config');
    const samplingRate = config?.errorSampling ?? 0.1;

    if (Math.random() >= samplingRate) {
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
    if (reason instanceof Error) return reason.message || reason.toString();
    return String(reason);
  }

  private sanitize(text: string): string {
    let sanitized = text;
    for (const pattern of this.piiPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
  }
}
