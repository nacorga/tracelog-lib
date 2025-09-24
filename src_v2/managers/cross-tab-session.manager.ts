import { TAB_HEARTBEAT_INTERVAL_MS, TAB_ELECTION_TIMEOUT_MS, DEFAULT_SESSION_TIMEOUT_MS } from '../constants';
import { BROADCAST_CHANNEL_NAME, CROSS_TAB_SESSION_KEY, TAB_SPECIFIC_INFO_KEY } from '../constants/storage.constants';
import {
  CrossTabSessionConfig,
  TabInfo,
  CrossTabMessage,
  SessionContext,
  SessionEndReason,
} from '../types/session.types';
import { generateUUID } from '../utils';
import { debugLog } from '../utils/logging';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';

export class CrossTabSessionManager extends StateManager {
  private readonly config: CrossTabSessionConfig;
  private readonly storageManager: StorageManager;
  private broadcastChannel: BroadcastChannel | null;
  private readonly tabId: string;
  private readonly tabInfo: TabInfo;
  private readonly projectId: string;

  private leaderTabId: string | null = null;

  private isTabLeader = false;
  private heartbeatInterval: number | null = null;
  private electionTimeout: number | null = null;
  private cleanupTimeout: number | null = null;
  private sessionEnded = false;

  // Additional timeout tracking for proper cleanup
  private fallbackLeadershipTimeout: number | null = null;
  private electionDelayTimeout: number | null = null;
  private tabInfoCleanupTimeout: number | null = null;
  private closingAnnouncementTimeout: number | null = null;
  private leaderHealthCheckInterval: number | null = null;
  private lastHeartbeatSent = 0;

  constructor(
    storageManager: StorageManager,
    projectId: string,
    config?: Partial<CrossTabSessionConfig>,
    private readonly callbacks?: {
      onSessionStart?: (sessionId: string) => void;
      onSessionEnd?: (reason: SessionEndReason) => void;
      onTabActivity?: () => void;
      onCrossTabConflict?: () => void;
    },
  ) {
    super();

    this.storageManager = storageManager;
    this.projectId = projectId;
    this.tabId = generateUUID();

    this.config = {
      tabHeartbeatIntervalMs: TAB_HEARTBEAT_INTERVAL_MS,
      tabElectionTimeoutMs: TAB_ELECTION_TIMEOUT_MS,
      debugMode: (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') ?? false,
      ...config,
    };

    this.tabInfo = {
      id: this.tabId,
      lastHeartbeat: Date.now(),
      isLeader: false,
      sessionId: '',
      startTime: Date.now(),
    };

    this.broadcastChannel = this.initializeBroadcastChannel();

    this.initialize();
  }

  /**
   * Initialize BroadcastChannel if supported
   */
  private initializeBroadcastChannel(): BroadcastChannel | null {
    if (!this.isBroadcastChannelSupported()) {
      return null;
    }

    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME(this.projectId));

      this.setupBroadcastListeners(channel);

      return channel;
    } catch (error) {
      if (this.config.debugMode) {
        debugLog.warn('CrossTabSession', 'Failed to initialize BroadcastChannel', { error });
      }

      return null;
    }
  }

  /**
   * Initialize the cross-tab session manager
   */
  private initialize(): void {
    if (!this.broadcastChannel) {
      // Fallback to single-tab behavior when BroadcastChannel is not available
      this.becomeLeader(); // This will create a session and set up the tab as leader
      return;
    }

    // Check for existing session
    const existingSession = this.getStoredSessionContext();

    if (existingSession) {
      // Try to join existing session
      this.tryJoinExistingSession(existingSession);
    } else {
      // Start new session leadership election
      this.startLeaderElection();
    }

    // Start heartbeat
    this.startHeartbeat();

    // Fallback mechanism: only in multi-tab scenarios (when BroadcastChannel is available)
    if (this.broadcastChannel) {
      this.setupLeadershipFallback();
    }
  }

  /**
   * Check if this tab should be the session leader
   */
  private tryJoinExistingSession(sessionContext: SessionContext): void {
    if (this.config.debugMode) {
      debugLog.debug('CrossTabSession', `Attempting to join existing session: ${sessionContext.sessionId}`);
    }

    // Set session info
    this.tabInfo.sessionId = sessionContext.sessionId;

    // Request leadership status from other tabs
    this.requestLeadershipStatus();

    // Update session context with new tab
    sessionContext.tabCount += 1;
    sessionContext.lastActivity = Date.now();
    this.storeSessionContext(sessionContext);

    // Notify activity callback
    if (this.callbacks?.onTabActivity) {
      this.callbacks.onTabActivity();
    }
  }

  /**
   * Request leadership status from other tabs
   */
  private requestLeadershipStatus(): void {
    if (!this.broadcastChannel) return;

    // Clear any existing election timeout
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
      this.electionTimeout = null;
    }

    const message: CrossTabMessage = {
      type: 'election_request',
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
    };

    this.broadcastChannel.postMessage(message);

    // Set timeout for election with additional random delay to prevent race conditions
    const randomDelay = Math.floor(Math.random() * 500); // 0-500ms random delay
    this.electionTimeout = window.setTimeout(() => {
      // No response means we become the leader
      if (!this.isTabLeader) {
        this.becomeLeader();
      }
    }, this.config.tabElectionTimeoutMs + randomDelay);
  }

  /**
   * Start leader election process with debouncing to prevent excessive elections
   */
  private startLeaderElection(): void {
    // Prevent multiple concurrent elections
    if (this.electionTimeout) {
      if (this.config.debugMode) {
        debugLog.debug('CrossTabSession', 'Leader election already in progress, skipping');
      }
      return;
    }

    if (this.config.debugMode) {
      debugLog.debug('CrossTabSession', 'Starting leader election');
    }

    // Add randomized delay to prevent thundering herd (optimized for performance tests)
    const randomDelay = Math.floor(Math.random() * 50) + 10; // 10-60ms delay (reduced for better performance)

    this.electionTimeout = window.setTimeout(() => {
      this.electionTimeout = null;
      this.requestLeadershipStatus();
    }, randomDelay);
  }

  /**
   * Become the session leader
   */
  private becomeLeader(): void {
    // Double-check we're not already a leader (race condition protection)
    if (this.isTabLeader) {
      return;
    }

    this.isTabLeader = true;
    this.tabInfo.isLeader = true;
    this.leaderTabId = this.tabId;

    if (this.config.debugMode) {
      debugLog.debug('CrossTabSession', `Tab ${this.tabId} became session leader`);
    }

    // Clear any existing election timeout
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
      this.electionTimeout = null;
    }

    // Start new session if we don't have one
    if (!this.tabInfo.sessionId) {
      const sessionId = generateUUID();
      this.tabInfo.sessionId = sessionId;

      const sessionContext: SessionContext = {
        sessionId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        tabCount: 1,
        recoveryAttempts: 0,
      };

      this.storeSessionContext(sessionContext);

      // Notify session start
      if (this.callbacks?.onSessionStart) {
        this.callbacks.onSessionStart(sessionId);
      }

      // Announce new session to other tabs
      this.announceSessionStart(sessionId);
    } else {
      // Update existing session context
      const sessionContext = this.getStoredSessionContext();
      if (sessionContext) {
        sessionContext.lastActivity = Date.now();
        this.storeSessionContext(sessionContext);
      }
    }

    // Store tab info
    this.storeTabInfo();

    // Send immediate leadership announcement to ensure other tabs know
    this.announceLeadership();
  }

  /**
   * Announce session start to other tabs
   */
  private announceSessionStart(sessionId: string): void {
    if (!this.broadcastChannel) return;

    const message: CrossTabMessage = {
      type: 'session_start',
      tabId: this.tabId,
      sessionId,
      timestamp: Date.now(),
    };

    this.broadcastChannel.postMessage(message);
  }

  /**
   * Announce leadership to other tabs
   */
  private announceLeadership(): void {
    if (!this.broadcastChannel || !this.tabInfo.sessionId) return;

    const message: CrossTabMessage = {
      type: 'election_response',
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
      data: { isLeader: true },
    };

    this.broadcastChannel.postMessage(message);
  }

  /**
   * Clean up health check interval to prevent memory leaks
   */
  private cleanupHealthCheckInterval(): void {
    if (this.leaderHealthCheckInterval) {
      clearInterval(this.leaderHealthCheckInterval);
      this.leaderHealthCheckInterval = null;

      debugLog.debug('CrossTabSession', 'Health check interval cleaned up');
    }
  }

  /**
   * Setup fallback mechanism to ensure a leader is always elected
   */
  private setupLeadershipFallback(): void {
    // Shorter fallback delay to ensure it works within test timeouts
    const fallbackDelay = this.config.tabElectionTimeoutMs + 1500; // Election timeout + 1.5s buffer

    this.fallbackLeadershipTimeout = window.setTimeout(() => {
      // Check if we need to force leadership
      if (!this.isTabLeader && !this.leaderTabId) {
        // If we have a session but no leader, become leader
        if (this.tabInfo.sessionId) {
          if (this.config.debugMode) {
            debugLog.warn(
              'CrossTabSession',
              `No leader detected after ${fallbackDelay}ms, forcing leadership for tab ${this.tabId}`,
            );
          }
          this.becomeLeader();
        } else {
          // If we don't even have a session, start a new one
          if (this.config.debugMode) {
            debugLog.warn(
              'CrossTabSession',
              `No session or leader detected after ${fallbackDelay}ms, starting new session for tab ${this.tabId}`,
            );
          }
          this.becomeLeader();
        }
      }
      this.fallbackLeadershipTimeout = null;
    }, fallbackDelay);

    // Additional periodic check for leader health
    this.leaderHealthCheckInterval = window.setInterval(() => {
      if (!this.sessionEnded && this.leaderTabId && !this.isTabLeader) {
        // Check if leader is still responsive by checking last activity
        const sessionContext = this.getStoredSessionContext();
        if (sessionContext) {
          const timeSinceLastActivity = Date.now() - sessionContext.lastActivity;
          const maxInactiveTime = this.config.tabHeartbeatIntervalMs * 3; // 3 heartbeat intervals

          if (timeSinceLastActivity > maxInactiveTime) {
            if (this.config.debugMode) {
              debugLog.warn(
                'CrossTabSession',
                `Leader tab appears inactive (${timeSinceLastActivity}ms), attempting to become leader`,
              );
            }
            this.leaderTabId = null;
            this.startLeaderElection();
          }
        }
      }
    }, this.config.tabHeartbeatIntervalMs * 2); // Check every 2 heartbeat intervals

    // Clean up the health check interval when session ends
    const originalEndSession = this.endSession.bind(this);
    this.endSession = (reason: SessionEndReason): void => {
      // Cleanup robusto de todos los intervals
      this.cleanupHealthCheckInterval();

      if (this.fallbackLeadershipTimeout) {
        clearTimeout(this.fallbackLeadershipTimeout);
        this.fallbackLeadershipTimeout = null;
      }

      originalEndSession(reason);
    };
  }

  /**
   * Setup BroadcastChannel event listeners
   */
  private setupBroadcastListeners(channel: BroadcastChannel): void {
    channel.addEventListener('message', (event: MessageEvent<CrossTabMessage>) => {
      const message = event.data;

      if (message.tabId === this.tabId) {
        return;
      }

      this.handleCrossTabMessage(message);
    });
  }

  /**
   * Handle cross-tab messages
   */
  private handleCrossTabMessage(message: CrossTabMessage): void {
    if (this.config.debugMode) {
      debugLog.debug('CrossTabSession', `Received cross-tab message: ${message.type} from ${message.tabId}`);
    }

    switch (message.type) {
      case 'heartbeat':
        this.handleHeartbeatMessage(message);
        break;

      case 'session_start':
        this.handleSessionStartMessage(message);
        break;

      case 'session_end':
        this.handleSessionEndMessage(message);
        break;

      case 'tab_closing':
        this.handleTabClosingMessage(message);
        break;

      case 'election_request':
        this.handleElectionRequest(message);
        break;

      case 'election_response':
        this.handleElectionResponse(message);
        break;
    }
  }

  /**
   * Handle heartbeat message from another tab
   */
  private handleHeartbeatMessage(message: CrossTabMessage): void {
    // Update session activity if this tab has the same session
    if (message.sessionId === this.tabInfo.sessionId) {
      const sessionContext = this.getStoredSessionContext();
      if (sessionContext) {
        sessionContext.lastActivity = Date.now();
        this.storeSessionContext(sessionContext);

        // Notify activity callback
        if (this.callbacks?.onTabActivity) {
          this.callbacks.onTabActivity();
        }
      }
    }
  }

  /**
   * Handle session start message from another tab
   */
  private handleSessionStartMessage(message: CrossTabMessage): void {
    if (!message.sessionId) return;

    // Join the session if we don't have one
    if (!this.tabInfo.sessionId) {
      this.tabInfo.sessionId = message.sessionId;
      this.storeTabInfo();

      // Update session context
      const sessionContext = this.getStoredSessionContext();
      if (sessionContext) {
        sessionContext.tabCount += 1;
        this.storeSessionContext(sessionContext);
      }
    }
  }

  /**
   * Handle session end message from another tab
   */
  private handleSessionEndMessage(message: CrossTabMessage): void {
    // Ignore if this tab is the leader
    if (this.isTabLeader) {
      if (this.config.debugMode) {
        debugLog.debug('CrossTabSession', `Ignoring session end message from ${message.tabId} (this tab is leader)`);
      }

      return;
    }

    // Verify the message is from the current leader
    if (!this.leaderTabId || message.tabId !== this.leaderTabId) {
      if (this.config.debugMode) {
        const extra = this.leaderTabId ? `; leader is ${this.leaderTabId}` : '';
        debugLog.debug('CrossTabSession', `Ignoring session end message from ${message.tabId}${extra}`);
      }

      return;
    }

    this.tabInfo.sessionId = '';
    this.storeTabInfo();
    this.leaderTabId = null;

    const sessionContext = this.getStoredSessionContext();

    // Start a new session if none exists
    if (!sessionContext) {
      if (this.broadcastChannel) {
        this.startLeaderElection();
      } else {
        this.becomeLeader();
      }
    }
  }

  /**
   * Handle tab closing message from another tab
   */
  private handleTabClosingMessage(message: CrossTabMessage): void {
    const sessionContext = this.getStoredSessionContext();
    if (sessionContext && message.sessionId === sessionContext.sessionId) {
      // Decrease tab count with minimum of 1 (current tab)
      const oldCount = sessionContext.tabCount;
      sessionContext.tabCount = Math.max(1, sessionContext.tabCount - 1);
      sessionContext.lastActivity = Date.now();
      this.storeSessionContext(sessionContext);

      if (this.config.debugMode) {
        debugLog.debug(
          'CrossTabSession',
          `Tab count updated from ${oldCount} to ${sessionContext.tabCount} after tab ${message.tabId} closed`,
        );
      }

      // If the closing tab was the leader, handle leadership transition
      const wasLeader = message.data?.isLeader ?? message.tabId === this.leaderTabId;
      if (wasLeader && !this.isTabLeader) {
        if (this.config.debugMode) {
          debugLog.debug('CrossTabSession', `Leader tab ${message.tabId} closed, starting leader election`);
        }
        this.leaderTabId = null;

        // Add a small delay to ensure other tabs have processed the closing message
        this.electionDelayTimeout = window.setTimeout(() => {
          this.startLeaderElection();
          this.electionDelayTimeout = null;
        }, 200);
      }
    }
  }

  /**
   * Handle election request from another tab
   */
  private handleElectionRequest(_message: CrossTabMessage): void {
    if (this.isTabLeader) {
      // Respond that we're the leader
      const response: CrossTabMessage = {
        type: 'election_response',
        tabId: this.tabId,
        sessionId: this.tabInfo.sessionId,
        timestamp: Date.now(),
        data: { isLeader: true },
      };

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(response);
      }
    }
  }

  /**
   * Handle election response from another tab
   */
  private handleElectionResponse(message: CrossTabMessage): void {
    if (message.data?.isLeader) {
      // Another tab is already the leader - only accept if we're not already a leader
      if (!this.isTabLeader) {
        this.isTabLeader = false;
        this.tabInfo.isLeader = false;
        this.leaderTabId = message.tabId;

        if (this.config.debugMode) {
          debugLog.debug('CrossTabSession', `Acknowledging tab ${message.tabId} as leader`);
        }

        // Clear election timeout
        if (this.electionTimeout) {
          clearTimeout(this.electionTimeout);
          this.electionTimeout = null;
        }

        // Join their session
        if (message.sessionId) {
          this.tabInfo.sessionId = message.sessionId;
          this.storeTabInfo();
        }
      } else if (this.config.debugMode) {
        // We're already a leader, log potential conflict
        debugLog.warn(
          'CrossTabSession',
          `Received leadership claim from ${message.tabId} but this tab is already leader`,
        );

        // Notify conflict callback
        if (this.callbacks?.onCrossTabConflict) {
          this.callbacks.onCrossTabConflict();
        }
      }
    }
  }

  /**
   * Start heartbeat to keep session active
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat();
      this.updateTabInfo();
    }, this.config.tabHeartbeatIntervalMs);
  }

  /**
   * Send heartbeat to other tabs with rate limiting to prevent flooding
   */
  private sendHeartbeat(): void {
    if (!this.broadcastChannel || !this.tabInfo.sessionId) return;

    // Rate limit heartbeats - only send if we're the leader or haven't sent recently
    const now = Date.now();
    const lastHeartbeat = this.lastHeartbeatSent ?? 0;
    const minHeartbeatInterval = this.config.tabHeartbeatIntervalMs * 0.8; // 80% of interval

    if (!this.isTabLeader && now - lastHeartbeat < minHeartbeatInterval) {
      return; // Skip heartbeat to reduce noise
    }

    const message: CrossTabMessage = {
      type: 'heartbeat',
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: now,
    };

    this.broadcastChannel.postMessage(message);
    this.lastHeartbeatSent = now;
  }

  /**
   * Update tab info with current timestamp
   */
  private updateTabInfo(): void {
    this.tabInfo.lastHeartbeat = Date.now();
    this.storeTabInfo();
  }

  /**
   * End session and notify other tabs
   */
  endSession(reason: SessionEndReason): void {
    if (this.sessionEnded) {
      return;
    }

    this.sessionEnded = true;

    if (this.config.debugMode) {
      debugLog.debug(
        'CrossTabSession',
        `Ending cross-tab session: ${reason} (tab: ${this.tabId}, isLeader: ${this.isTabLeader})`,
      );
    }

    // Announce tab closing with current state
    this.announceTabClosing();

    // If this is the leader, announce session end to remaining tabs
    if (this.isTabLeader && reason !== 'manual_stop') {
      this.announceSessionEnd(reason);
    }

    // Give time for messages to be sent before cleanup
    this.tabInfoCleanupTimeout = window.setTimeout(() => {
      this.clearTabInfo();
      this.tabInfoCleanupTimeout = null;
    }, 150);
  }

  /**
   * Announce tab is closing to other tabs
   */
  private announceTabClosing(): void {
    if (!this.broadcastChannel || !this.tabInfo.sessionId) return;

    const message: CrossTabMessage = {
      type: 'tab_closing',
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
      data: { isLeader: this.isTabLeader },
    };

    this.broadcastChannel.postMessage(message);

    // Give other tabs time to process the message before we close
    this.closingAnnouncementTimeout = window.setTimeout(() => {
      if (this.config.debugMode) {
        debugLog.debug('CrossTabSession', `Tab ${this.tabId} closing announcement sent`);
      }
      this.closingAnnouncementTimeout = null;
    }, 100);
  }

  /**
   * Announce session end to other tabs
   */
  private announceSessionEnd(reason: SessionEndReason): void {
    if (!this.broadcastChannel) return;

    const message: CrossTabMessage = {
      type: 'session_end',
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
      data: { reason },
    };

    this.broadcastChannel.postMessage(message);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.tabInfo.sessionId;
  }

  /**
   * Get current tab ID
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * Check if this tab is the session leader
   */
  isLeader(): boolean {
    return this.isTabLeader;
  }

  /**
   * Get current session context from storage
   */
  private getStoredSessionContext(): SessionContext | null {
    try {
      const stored = this.storageManager.getItem(CROSS_TAB_SESSION_KEY(this.projectId));

      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      if (this.config.debugMode) {
        debugLog.warn('CrossTabSession', 'Failed to parse stored session context', { error });
      }

      return null;
    }
  }

  /**
   * Store session context to localStorage
   */
  private storeSessionContext(context: SessionContext): void {
    try {
      this.storageManager.setItem(CROSS_TAB_SESSION_KEY(this.projectId), JSON.stringify(context));
    } catch (error) {
      if (this.config.debugMode) {
        debugLog.warn('CrossTabSession', 'Failed to store session context', { error });
      }
    }
  }

  /**
   * Clear stored session context
   */
  private clearStoredSessionContext(): void {
    this.storageManager.removeItem(CROSS_TAB_SESSION_KEY(this.projectId));
  }

  /**
   * Store tab info to localStorage
   */
  private storeTabInfo(): void {
    try {
      this.storageManager.setItem(TAB_SPECIFIC_INFO_KEY(this.projectId, this.tabId), JSON.stringify(this.tabInfo));
    } catch (error) {
      if (this.config.debugMode) {
        debugLog.warn('CrossTabSession', 'Failed to store tab info', { error });
      }
    }
  }

  /**
   * Clear tab info from localStorage
   */
  private clearTabInfo(): void {
    this.storageManager.removeItem(TAB_SPECIFIC_INFO_KEY(this.projectId, this.tabId));
  }

  /**
   * Check if BroadcastChannel is supported
   */
  private isBroadcastChannelSupported(): boolean {
    return typeof window !== 'undefined' && 'BroadcastChannel' in window;
  }

  /**
   * Get session timeout considering cross-tab activity
   */
  getEffectiveSessionTimeout(): number {
    const sessionContext = this.getStoredSessionContext();
    if (!sessionContext) {
      return this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS;
    }

    const now = Date.now();
    const timeSinceLastActivity = now - sessionContext.lastActivity;
    const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS;

    return Math.max(0, sessionTimeout - timeSinceLastActivity);
  }

  /**
   * Update session activity from any tab
   */
  updateSessionActivity(): void {
    const sessionContext = this.getStoredSessionContext();
    if (sessionContext) {
      sessionContext.lastActivity = Date.now();
      this.storeSessionContext(sessionContext);
    }

    // Send heartbeat to notify other tabs
    this.sendHeartbeat();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cleanupHealthCheckInterval();

    // Clear intervals and timeouts
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
      this.electionTimeout = null;
    }

    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }

    // Clear additional timeouts
    if (this.fallbackLeadershipTimeout) {
      clearTimeout(this.fallbackLeadershipTimeout);
      this.fallbackLeadershipTimeout = null;
    }

    if (this.electionDelayTimeout) {
      clearTimeout(this.electionDelayTimeout);
      this.electionDelayTimeout = null;
    }

    if (this.tabInfoCleanupTimeout) {
      clearTimeout(this.tabInfoCleanupTimeout);
      this.tabInfoCleanupTimeout = null;
    }

    if (this.closingAnnouncementTimeout) {
      clearTimeout(this.closingAnnouncementTimeout);
      this.closingAnnouncementTimeout = null;
    }

    // End session and cleanup
    this.endSession('manual_stop');

    // Close BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    debugLog.debug('CrossTabSession', 'CrossTabSessionManager destroyed');
  }
}
