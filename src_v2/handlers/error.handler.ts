import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { ErrorType, EventType } from '../types';
import { debugLog } from '../utils/logging';

export class ErrorHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    /\b[A-Z]{2}\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ];

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  startTracking(): void {
    debugLog.debug('ErrorHandler', 'Starting error tracking');

    this.setupErrorListener();
    this.setupUnhandledRejectionListener();
  }

  stopTracking(): void {
    debugLog.debug('ErrorHandler', 'Stopping error tracking');

    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private setupErrorListener(): void {
    window.addEventListener('error', this.handleError);
  }

  private setupUnhandledRejectionListener(): void {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private readonly handleError = (event: ErrorEvent): void => {
    const config = this.get('config');

    if (!this.shouldSample(config?.errorSampling ?? 0.1)) {
      debugLog.debug('ErrorHandler', `Error not sampled, skipping (errorSampling: ${config?.errorSampling})`, {
        errorSampling: config?.errorSampling,
      });
      return;
    }

    debugLog.warn(
      'ErrorHandler',
      `JavaScript error captured: ${event.message} (filename: ${event.filename}, lineno: ${event.lineno})`,
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
      },
    );

    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.JS_ERROR,
        message: this.sanitizeText(event.message || 'Unknown error'),
      },
    });
  };

  private readonly handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const config = this.get('config');

    if (!this.shouldSample(config?.errorSampling ?? 0.1)) {
      debugLog.debug('ErrorHandler', 'Promise rejection not sampled, skipping', {
        errorSampling: config?.errorSampling,
      });
      return;
    }

    debugLog.warn('ErrorHandler', `Unhandled promise rejection captured (reason: ${typeof event.reason})`, {
      reason: typeof event.reason,
    });

    let reason = 'Unknown rejection';

    if (event.reason) {
      if (typeof event.reason === 'string') {
        reason = event.reason;
      } else if (event.reason instanceof Error) {
        reason = event.reason.message || event.reason.toString();
      } else {
        reason = String(event.reason);
      }
    }

    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.PROMISE_REJECTION,
        message: this.sanitizeText(reason),
      },
    });
  };

  private sanitizeText(text: string): string {
    let sanitized = text;

    for (const pattern of this.piiPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
  }

  private shouldSample(rate: number): boolean {
    return Math.random() < rate;
  }
}
