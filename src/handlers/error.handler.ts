import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { EmitterEvent, ErrorType, EventType } from '../types';
import type { EmitterCallback, EmitterMap } from '../types';
import type { Emitter } from '../utils';
import { buildErrorSignatureKey, log } from '../utils';
import {
  PII_PATTERNS,
  MAX_ERROR_MESSAGE_LENGTH,
  MAX_STACK_TRACE_LENGTH,
  ERROR_SUPPRESSION_WINDOW_MS,
  MAX_TRACKED_ERRORS,
  MAX_TRACKED_ERRORS_HARD_LIMIT,
  DEFAULT_ERROR_SAMPLING_RATE,
  ERROR_BURST_WINDOW_MS,
  ERROR_BURST_THRESHOLD,
  ERROR_BURST_BACKOFF_MS,
  MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW,
} from '../constants/error.constants';

/**
 * Captures JavaScript errors and unhandled promise rejections for debugging and monitoring.
 *
 * **Events Generated**: `error`
 *
 * **Features**:
 * - Tracks JavaScript runtime errors and unhandled promise rejections
 * - Configurable error sampling rate (default: 100%)
 * - PII sanitization (emails, phone numbers, credit cards, API keys, tokens)
 * - Message truncation (500 character limit)
 * - Burst detection (>10 errors/second triggers 5-second cooldown)
 * - Deduplication within 5-second window per error type+message
 * - Per-pageview signature cap (`MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW`): after the
 *   5s dedup window expires, the same `(normalizedMessage, filename, line)` may only
 *   recur up to N times per pageview. Counter resets on `pagehide`, `SESSION_START`,
 *   and `PAGE_VIEW` (covers SPA navigation via patched History API + popstate/hashchange).
 *
 * **Privacy Protection**:
 * - Automatically redacts PII from error messages before storage
 * - Sanitizes emails, phone numbers, credit cards, IBAN, API keys, Bearer tokens
 *
 * @see src/handlers/README.md (`## ErrorHandler` section) for detailed documentation
 */
export class ErrorHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly emitter?: Emitter;
  private readonly recentErrors = new Map<string, number>();
  private readonly pageviewSignatureCounts = new Map<string, number>();
  private errorBurstCounter = 0;
  private burstWindowStart = 0;
  private burstBackoffUntil = 0;
  private pagehideHandler: (() => void) | null = null;
  private pageviewResetListener: EmitterCallback<EmitterMap[EmitterEvent.EVENT]> | null = null;

  constructor(eventManager: EventManager, emitter?: Emitter) {
    super();
    this.eventManager = eventManager;
    this.emitter = emitter;
  }

  /**
   * Starts tracking JavaScript errors and promise rejections.
   *
   * - Registers global error event listener
   * - Registers unhandledrejection event listener
   * - Registers pagehide listener to reset the per-pageview signature counter
   * - Subscribes to emitter SESSION_START + PAGE_VIEW to reset the counter on new
   *   sessions and SPA route changes (the only signal `pagehide` does not cover)
   */
  startTracking(): void {
    window.addEventListener('error', this.handleError);
    window.addEventListener('unhandledrejection', this.handleRejection);

    this.pagehideHandler = (): void => {
      this.resetPageviewCounter();
    };
    window.addEventListener('pagehide', this.pagehideHandler, { passive: true });

    if (this.emitter) {
      this.pageviewResetListener = (event): void => {
        if (event.type === EventType.SESSION_START || event.type === EventType.PAGE_VIEW) {
          this.resetPageviewCounter();
        }
      };
      this.emitter.on(EmitterEvent.EVENT, this.pageviewResetListener);
    }
  }

  /**
   * Stops tracking errors and cleans up resources.
   *
   * - Removes error event listeners
   * - Removes pagehide listener and unsubscribes from emitter
   * - Clears recent errors and pageview signature counters
   * - Resets burst detection counters
   */
  stopTracking(): void {
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleRejection);

    if (this.pagehideHandler) {
      window.removeEventListener('pagehide', this.pagehideHandler);
      this.pagehideHandler = null;
    }

    if (this.emitter && this.pageviewResetListener) {
      this.emitter.off(EmitterEvent.EVENT, this.pageviewResetListener);
      this.pageviewResetListener = null;
    }

    this.recentErrors.clear();
    this.pageviewSignatureCounts.clear();
    this.errorBurstCounter = 0;
    this.burstWindowStart = 0;
    this.burstBackoffUntil = 0;
  }

  /**
   * Clears the per-pageview signature counter.
   *
   * Public so `App` or tests can drive a reset explicitly; the handler itself wires
   * `pagehide` and emitter `SESSION_START` / `PAGE_VIEW` in `startTracking()`.
   */
  resetPageviewCounter(): void {
    this.pageviewSignatureCounts.clear();
  }

  /**
   * Checks sampling rate and burst detection
   * Returns false if in cooldown period after burst detection
   */
  private shouldSample(): boolean {
    const now = Date.now();

    if (now < this.burstBackoffUntil) {
      return false;
    }

    if (now - this.burstWindowStart > ERROR_BURST_WINDOW_MS) {
      this.errorBurstCounter = 0;
      this.burstWindowStart = now;
    }

    this.errorBurstCounter++;

    if (this.errorBurstCounter > ERROR_BURST_THRESHOLD) {
      this.burstBackoffUntil = now + ERROR_BURST_BACKOFF_MS;
      log('debug', 'Error burst detected - entering cooldown', {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: ERROR_BURST_BACKOFF_MS,
        },
      });
      return false;
    }

    const config = this.get('config');
    const samplingRate = config.errorSampling ?? DEFAULT_ERROR_SAMPLING_RATE;
    return Math.random() < samplingRate;
  }

  /**
   * Returns true when the per-pageview signature cap has been hit for this error.
   * Dropped errors do not increment the counter — the 5s suppression window already
   * silences identical repeats, and double-counting here would skew the cap for any
   * later signature that recycles the same map key after a counter reset.
   */
  private shouldThrottleBySignature(input: { message: string; filename?: string; line?: number }): boolean {
    const key = buildErrorSignatureKey({
      message: input.message,
      filename: input.filename,
      line: input.line,
    });
    const current = this.pageviewSignatureCounts.get(key) ?? 0;

    if (current >= MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW) {
      log('debug', 'Error throttled (pageview cap)', {
        data: { signature: key, count: current },
      });
      return true;
    }

    this.pageviewSignatureCounts.set(key, current + 1);
    return false;
  }

  private readonly handleError = (event: ErrorEvent): void => {
    if (!this.shouldSample()) {
      return;
    }

    const sanitizedMessage = this.sanitize(event.message || 'Unknown error');

    if (this.shouldSuppressError(ErrorType.JS_ERROR, sanitizedMessage)) {
      return;
    }

    if (
      this.shouldThrottleBySignature({
        message: sanitizedMessage,
        filename: event.filename,
        line: event.lineno,
      })
    ) {
      return;
    }

    const stack = typeof event.error?.stack === 'string' ? this.truncateStack(event.error.stack) : undefined;
    const errorName =
      typeof event.error?.name === 'string' && event.error.name !== 'Error' ? event.error.name : undefined;
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.JS_ERROR,
        message: sanitizedMessage,
        ...(errorName !== undefined && { name: errorName }),
        ...(event.filename !== '' && { filename: event.filename }),
        ...(event.lineno !== 0 && { line: event.lineno }),
        ...(event.colno !== 0 && { column: event.colno }),
        ...(stack !== undefined && { stack }),
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

    if (this.shouldThrottleBySignature({ message: sanitizedMessage })) {
      return;
    }

    const stack =
      event.reason instanceof Error && typeof event.reason.stack === 'string'
        ? this.truncateStack(event.reason.stack)
        : undefined;
    const errorName = event.reason instanceof Error && event.reason.name !== 'Error' ? event.reason.name : undefined;
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.PROMISE_REJECTION,
        message: sanitizedMessage,
        ...(errorName !== undefined && { name: errorName }),
        ...(stack !== undefined && { stack }),
      },
    });
  };

  private extractRejectionMessage(reason: unknown): string {
    if (reason == null) return 'Unknown rejection';

    if (typeof reason === 'string') return reason;

    if (reason instanceof Error) {
      return reason.message;
    }

    if (typeof reason === 'object' && 'message' in reason) {
      return String(reason.message);
    }

    try {
      return JSON.stringify(reason);
    } catch {
      return 'Unserializable rejection';
    }
  }

  private sanitize(text: string): string {
    const truncated = text.length > MAX_ERROR_MESSAGE_LENGTH ? text.slice(0, MAX_ERROR_MESSAGE_LENGTH) + '...' : text;
    return this.sanitizePii(truncated);
  }

  private sanitizePii(text: string): string {
    let sanitized = text;

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

    if (lastSeenAt !== undefined && now - lastSeenAt < ERROR_SUPPRESSION_WINDOW_MS) {
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

  private static readonly TRUNCATION_SUFFIX = '\n...truncated';

  private truncateStack(stack: string): string {
    if (stack.length <= MAX_STACK_TRACE_LENGTH) return this.sanitizePii(stack);
    const limit = MAX_STACK_TRACE_LENGTH - ErrorHandler.TRUNCATION_SUFFIX.length;
    const truncated = stack.slice(0, limit) + ErrorHandler.TRUNCATION_SUFFIX;
    return this.sanitizePii(truncated);
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
