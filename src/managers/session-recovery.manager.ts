import {
  DEFAULT_SESSION_TIMEOUT_MS,
  SESSION_RECOVERY_WINDOW_MULTIPLIER,
  MAX_SESSION_RECOVERY_ATTEMPTS,
  MAX_SESSION_RECOVERY_WINDOW_MS,
  MIN_SESSION_RECOVERY_WINDOW_MS,
} from '../constants';
import { SESSION_RECOVERY_KEY } from '../constants/storage.constants';
import { SessionRecoveryConfig, SessionContext, RecoveryAttempt } from '../types/session.types';
import { debugLog } from '../utils/logging';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { EventManager } from './event.manager';

export class SessionRecoveryManager extends StateManager {
  private readonly config: SessionRecoveryConfig;
  private readonly storageManager: StorageManager;
  private readonly eventManager: EventManager | null;
  private readonly projectId: string;
  private readonly debugMode: boolean;

  constructor(
    storageManager: StorageManager,
    projectId: string,
    eventManager?: EventManager,
    config?: Partial<SessionRecoveryConfig>,
  ) {
    super();

    this.storageManager = storageManager;
    this.eventManager = eventManager ?? null;
    this.projectId = projectId;
    this.debugMode = (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') ?? false;

    this.config = {
      recoveryWindowMs: this.calculateRecoveryWindow(),
      maxRecoveryAttempts: MAX_SESSION_RECOVERY_ATTEMPTS,
      contextPreservation: true,
      ...config,
    };
  }

  /**
   * Attempt to recover a session
   */
  attemptSessionRecovery(currentSessionId?: string): {
    recovered: boolean;
    recoveredSessionId?: string;
    context?: SessionContext;
  } {
    if (this.debugMode) {
      debugLog.debug('SessionRecovery', 'Attempting session recovery');
    }

    // Get stored recovery attempts
    const recoveryAttempts = this.getStoredRecoveryAttempts();
    const lastAttempt = this.getLastRecoveryAttempt();

    // Check if we can recover
    if (!this.canAttemptRecovery(lastAttempt)) {
      if (this.debugMode) {
        debugLog.debug(
          'SessionRecovery',
          'Session recovery not possible - outside recovery window or max attempts reached',
        );
      }

      return {
        recovered: false,
      };
    }

    // Get the last session context
    const lastSessionContext = lastAttempt?.context;

    if (!lastSessionContext) {
      if (this.debugMode) {
        debugLog.debug('SessionRecovery', 'No session context available for recovery');
      }

      return {
        recovered: false,
      };
    }

    // Check if recovery is possible
    const now = Date.now();
    const timeSinceLastActivity = now - lastSessionContext.lastActivity;

    if (timeSinceLastActivity > this.config.recoveryWindowMs) {
      if (this.debugMode) {
        debugLog.debug('SessionRecovery', 'Session recovery failed - outside recovery window');
      }

      return {
        recovered: false,
      };
    }

    // Perform recovery
    const recoveredSessionId = lastSessionContext.sessionId;
    const attemptNumber = (lastAttempt?.attempt ?? 0) + 1;

    // Create recovery attempt record
    const recoveryAttempt: RecoveryAttempt = {
      sessionId: currentSessionId ?? recoveredSessionId,
      timestamp: now,
      attempt: attemptNumber,
      context: {
        ...lastSessionContext,
        recoveryAttempts: attemptNumber,
        lastActivity: now,
      },
    };

    recoveryAttempts.push(recoveryAttempt);

    this.storeRecoveryAttempts(recoveryAttempts);

    if (this.debugMode) {
      debugLog.debug('SessionRecovery', `Session recovery successful: recovery of session ${recoveredSessionId}`);
    }

    return {
      recovered: true,
      recoveredSessionId,
      context: recoveryAttempt.context,
    };
  }

  /**
   * Calculate the recovery window with bounds checking
   */
  private calculateRecoveryWindow(): number {
    const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS;
    const calculatedRecoveryWindow = sessionTimeout * SESSION_RECOVERY_WINDOW_MULTIPLIER;
    const boundedRecoveryWindow = Math.max(
      Math.min(calculatedRecoveryWindow, MAX_SESSION_RECOVERY_WINDOW_MS),
      MIN_SESSION_RECOVERY_WINDOW_MS,
    );

    if (this.debugMode) {
      if (calculatedRecoveryWindow > MAX_SESSION_RECOVERY_WINDOW_MS) {
        debugLog.warn(
          'SessionRecovery',
          `Recovery window capped at ${MAX_SESSION_RECOVERY_WINDOW_MS}ms (24h). Calculated: ${calculatedRecoveryWindow}ms`,
        );
      } else if (calculatedRecoveryWindow < MIN_SESSION_RECOVERY_WINDOW_MS) {
        debugLog.warn(
          'SessionRecovery',
          `Recovery window increased to minimum ${MIN_SESSION_RECOVERY_WINDOW_MS}ms (2min). Calculated: ${calculatedRecoveryWindow}ms`,
        );
      }
    }

    return boundedRecoveryWindow;
  }

  /**
   * Check if session recovery can be attempted
   */
  private canAttemptRecovery(lastAttempt: RecoveryAttempt | null): boolean {
    if (!lastAttempt) {
      return true; // First recovery attempt
    }

    const now = Date.now();
    const timeSinceLastActivity = now - lastAttempt.context.lastActivity;

    // Check if within recovery window
    if (timeSinceLastActivity > this.config.recoveryWindowMs) {
      return false;
    }

    // Check max attempts
    if (lastAttempt.attempt >= this.config.maxRecoveryAttempts) {
      return false;
    }

    return true;
  }

  /**
   * Store session context for potential recovery
   */
  storeSessionContextForRecovery(sessionContext: SessionContext): void {
    try {
      const recoveryAttempts = this.getStoredRecoveryAttempts();

      // Create a recovery attempt record
      const recoveryAttempt: RecoveryAttempt = {
        sessionId: sessionContext.sessionId,
        timestamp: Date.now(),
        attempt: 0,
        context: sessionContext,
      };

      // Add to recovery attempts (keep only the latest few)
      recoveryAttempts.push(recoveryAttempt);

      const maxStoredRecoveryAttempts = 5;

      if (recoveryAttempts.length > maxStoredRecoveryAttempts) {
        recoveryAttempts.splice(0, recoveryAttempts.length - maxStoredRecoveryAttempts);
      }

      this.storeRecoveryAttempts(recoveryAttempts);

      if (this.debugMode) {
        debugLog.debug('SessionRecovery', `Stored session context for recovery: ${sessionContext.sessionId}`);
      }
    } catch (error) {
      if (this.debugMode) {
        debugLog.warn('SessionRecovery', 'Failed to store session context for recovery', { error });
      }
    }
  }

  /**
   * Get stored recovery attempts
   */
  private getStoredRecoveryAttempts(): RecoveryAttempt[] {
    try {
      const stored = this.storageManager.getItem(SESSION_RECOVERY_KEY(this.projectId));
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      if (this.debugMode) {
        const stored = this.storageManager.getItem(SESSION_RECOVERY_KEY(this.projectId));

        debugLog.warn(
          'SessionRecovery',
          `Failed to parse stored recovery attempts for projectId ${this.projectId}. Data: ${stored}`,
          { error },
        );
      }

      return [];
    }
  }

  /**
   * Store recovery attempts
   */
  private storeRecoveryAttempts(attempts: RecoveryAttempt[]): void {
    try {
      this.storageManager.setItem(SESSION_RECOVERY_KEY(this.projectId), JSON.stringify(attempts));
    } catch (error) {
      if (this.debugMode) {
        debugLog.warn('SessionRecovery', 'Failed to store recovery attempts', { error });
      }
    }
  }

  /**
   * Get the last recovery attempt
   */
  private getLastRecoveryAttempt(): RecoveryAttempt | null {
    const attempts = this.getStoredRecoveryAttempts();
    return attempts.length > 0 ? attempts[attempts.length - 1] : null;
  }

  /**
   * Clean up old recovery attempts
   */
  cleanupOldRecoveryAttempts(): void {
    const attempts = this.getStoredRecoveryAttempts();
    const now = Date.now();

    // Remove attempts older than recovery window
    const validAttempts = attempts.filter((attempt) => now - attempt.timestamp <= this.config.recoveryWindowMs);

    if (validAttempts.length !== attempts.length) {
      this.storeRecoveryAttempts(validAttempts);

      if (this.debugMode) {
        debugLog.debug('SessionRecovery', `Cleaned up ${attempts.length - validAttempts.length} old recovery attempts`);
      }
    }
  }

  /**
   * Check if there's a recoverable session.
   * Returns false when no recovery attempts are stored.
   */
  hasRecoverableSession(): boolean {
    const lastAttempt = this.getLastRecoveryAttempt();

    if (!lastAttempt) {
      return false;
    }

    return this.canAttemptRecovery(lastAttempt);
  }

  /**
   * Get recovery window in milliseconds
   */
  getRecoveryWindowMs(): number {
    return this.config.recoveryWindowMs;
  }

  /**
   * Get max recovery attempts
   */
  getMaxRecoveryAttempts(): number {
    return this.config.maxRecoveryAttempts;
  }

  /**
   * Clear all stored recovery data
   */
  clearRecoveryData(): void {
    this.storageManager.removeItem(SESSION_RECOVERY_KEY(this.projectId));

    if (this.debugMode) {
      debugLog.debug('SessionRecovery', 'Cleared all recovery data');
    }
  }
}
