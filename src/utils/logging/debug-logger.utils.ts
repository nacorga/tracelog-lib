import { Mode, LogLevel } from '../../types';
import { StateManager } from '../../managers/state.manager';

/**
 * Debug logger class that extends StateManager for clean access to global state
 */
class DebugLogger extends StateManager {
  /**
   * Client-facing error - Configuration/usage errors by the client
   * Console: qa and debug modes | Events: NODE_ENV=dev
   */
  clientError(namespace: string, message: string, data?: unknown): void {
    this.logMessage('CLIENT_ERROR', namespace, message, data);
  }

  /**
   * Client-facing warning - Configuration/usage warnings by the client
   * Console: qa and debug modes | Events: NODE_ENV=dev
   */
  clientWarn(namespace: string, message: string, data?: unknown): void {
    this.logMessage('CLIENT_WARN', namespace, message, data);
  }

  /**
   * General operational information
   * Console: qa and debug modes | Events: NODE_ENV=dev
   */
  info(namespace: string, message: string, data?: unknown): void {
    this.logMessage('INFO', namespace, message, data);
  }

  /**
   * Internal library errors
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  error(namespace: string, message: string, data?: unknown): void {
    this.logMessage('ERROR', namespace, message, data);
  }

  /**
   * Internal library warnings
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  warn(namespace: string, message: string, data?: unknown): void {
    this.logMessage('WARN', namespace, message, data);
  }

  /**
   * Strategic debug information
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  debug(namespace: string, message: string, data?: unknown): void {
    this.logMessage('DEBUG', namespace, message, data);
  }

  /**
   * Detailed trace information
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  verbose(namespace: string, message: string, data?: unknown): void {
    this.logMessage('VERBOSE', namespace, message, data);
  }

  private getCurrentMode(): Mode | undefined {
    try {
      return this.get('config')?.mode;
    } catch {
      return undefined;
    }
  }

  private shouldShowLog(level: LogLevel): boolean {
    const mode = this.getCurrentMode();

    // In development/test environment, show all log levels
    if (process.env.NODE_ENV === 'dev') {
      return true;
    }

    // Always show critical errors and client errors, even when mode is undefined
    if (['CLIENT_ERROR', 'ERROR'].includes(level)) {
      return true;
    }

    // When mode is not set (during initialization), show CLIENT_WARN as well
    if (!mode) {
      return ['CLIENT_ERROR', 'CLIENT_WARN'].includes(level);
    }

    switch (mode) {
      case 'qa':
        return ['INFO', 'CLIENT_ERROR', 'CLIENT_WARN'].includes(level);

      case 'debug':
        return true;

      default:
        return false;
    }
  }

  private formatMessage(namespace: string, message: string): string {
    return `[TraceLog:${namespace}] ${message}`;
  }

  private getConsoleMethod(level: LogLevel): 'log' | 'warn' | 'error' {
    switch (level) {
      case 'CLIENT_ERROR':
      case 'ERROR':
        return 'error';

      case 'CLIENT_WARN':
      case 'WARN':
        return 'warn';

      case 'INFO':
      case 'DEBUG':
      case 'VERBOSE':
      default:
        return 'log';
    }
  }

  private logMessage(level: LogLevel, namespace: string, message: string, data?: unknown): void {
    if (!this.shouldShowLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(namespace, message);
    const consoleMethod = this.getConsoleMethod(level);

    if (data !== undefined) {
      console[consoleMethod](formattedMessage, data);
    } else {
      console[consoleMethod](formattedMessage);
    }

    if (process.env.NODE_ENV === 'dev') {
      this.dispatchEvent(level, namespace, message, data);
    }
  }

  /**
   * Dispatches tracelog:log events for E2E testing and development debugging
   */
  private dispatchEvent(level: LogLevel, namespace: string, message: string, data?: unknown): void {
    if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') {
      return;
    }

    try {
      const event = new CustomEvent('tracelog:log', {
        detail: {
          timestamp: new Date().toISOString(),
          level,
          namespace,
          message,
          data,
        },
      });

      window.dispatchEvent(event);
    } catch {
      console.log(`[TraceLog:${namespace}] ${message}`, data);
    }
  }
}

/**
 * Singleton debug logger instance
 * Provides the same API as before: debugLog.clientError(), debugLog.info(), etc.
 */
export const debugLog = new DebugLogger();
