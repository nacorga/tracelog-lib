import { Mode, LogLevel } from '../../types';
import { StateManager } from '../../managers/state.manager';

/**
 * Debug logger class that extends StateManager for clean access to global state
 */
class DebugLogger extends StateManager {
  /**
   * Get the current logging mode from the global state
   */
  private getCurrentMode(): Mode {
    try {
      const config = this.get('config');
      return config?.mode ?? 'production';
    } catch {
      // Fallback to production mode if state is not available
      return 'production';
    }
  }

  /**
   * Check if a log level should be shown based on the current mode
   */
  private shouldShowLog(level: LogLevel): boolean {
    const mode = this.getCurrentMode();

    switch (mode) {
      case 'production':
        return false;

      case 'qa':
        return ['INFO', 'CLIENT_ERROR', 'CLIENT_WARN'].includes(level);

      case 'debug':
        return true;

      default:
        return false;
    }
  }

  /**
   * Format a log message with TraceLog prefix and namespace
   */
  private formatMessage(namespace: string, message: string): string {
    return `[TraceLog:${namespace}] ${message}`;
  }

  /**
   * Get the appropriate console method for a log level
   */
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

  /**
   * Core logging function
   */
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
  }

  /**
   * Client-facing error - Configuration/usage errors by the client
   * Visible in QA and debug modes
   */
  clientError(namespace: string, message: string, data?: unknown): void {
    this.handleModeBasedEvent('CLIENT_ERROR', namespace, message, data);
  }

  /**
   * Client-facing warning - Configuration/usage warnings by the client
   * Visible in QA and debug modes
   */
  clientWarn(namespace: string, message: string, data?: unknown): void {
    this.handleModeBasedEvent('CLIENT_WARN', namespace, message, data);
  }

  /**
   * General operational information
   * QA mode: dispatches custom events, Debug mode: console logs
   */
  info(namespace: string, message: string, data?: unknown): void {
    this.handleModeBasedEvent('INFO', namespace, message, data);
  }

  /**
   * Internal library errors
   * Visible only in debug mode
   */
  error(namespace: string, message: string, data?: unknown): void {
    this.logMessage('ERROR', namespace, message, data);
  }

  /**
   * Internal library warnings
   * Visible only in debug mode
   */
  warn(namespace: string, message: string, data?: unknown): void {
    this.logMessage('WARN', namespace, message, data);
  }

  /**
   * Strategic debug information
   * Visible only in debug mode
   */
  debug(namespace: string, message: string, data?: unknown): void {
    this.logMessage('DEBUG', namespace, message, data);
  }

  /**
   * Detailed trace information
   * Visible only in debug mode
   */
  verbose(namespace: string, message: string, data?: unknown): void {
    this.logMessage('VERBOSE', namespace, message, data);
  }

  /**
   * Handle the event based on the current mode and project ID
   */
  private handleModeBasedEvent(level: LogLevel, namespace: string, message: string, data?: unknown): void {
    const mode = this.getCurrentMode();

    if (mode === 'production') {
      return;
    }

    const shouldDispatchEvent = this.shouldUseDispatchEvent(mode);

    if (shouldDispatchEvent) {
      this.dispatchEvent(level, namespace, message, data);
    } else if (mode === 'debug') {
      this.logMessage(level, namespace, message, data);
    }
  }

  /**
   * Determine if we should use dispatchEvent based on mode and project ID
   */
  private shouldUseDispatchEvent(mode: string): boolean {
    // Always use dispatchEvent for QA mode
    if (mode === 'qa') {
      return true;
    }

    // For debug mode, only use dispatchEvent for specific test IDs
    if (mode === 'debug') {
      try {
        const config = this.get('config');
        const projectId = config?.id;
        return projectId === 'test' || projectId === 'demo';
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Dispatch custom event for QA mode or specific test IDs (test/demo)
   */
  private dispatchEvent(level: LogLevel, namespace: string, message: string, data?: unknown): void {
    if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') {
      return;
    }

    try {
      const event = new CustomEvent('tracelog:qa', {
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
