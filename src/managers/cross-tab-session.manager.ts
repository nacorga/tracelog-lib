import { TAB_HEARTBEAT_INTERVAL_MS, TAB_ELECTION_TIMEOUT_MS, DEFAULT_SESSION_TIMEOUT_MS } from '../constants';
import { BROADCAST_CHANNEL_NAME, CROSS_TAB_SESSION_KEY, TAB_INFO_KEY } from '../constants/storage.constants';
import {
  CrossTabSessionConfig,
  TabInfo,
  CrossTabMessage,
  SessionContext,
  SessionEndReason,
} from '../types/session.types';
import { generateUUID, log, logUnknown } from '../utils';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';

export class CrossTabSessionManager extends StateManager {
  private readonly config: CrossTabSessionConfig;
  private readonly storageManager: StorageManager;
  private readonly broadcastChannel: BroadcastChannel | null;
  private readonly tabId: string;
  private readonly projectId: string;

  private isTabLeader = false;
  private readonly tabInfo: TabInfo;
  private heartbeatInterval: number | null = null;
  private electionTimeout: number | null = null;
  private cleanupTimeout: number | null = null;

  // Callbacks
  private readonly onSessionStart: ((sessionId: string) => void) | null = null;
  private readonly onSessionEnd: ((reason: SessionEndReason) => void) | null = null;
  private readonly onTabActivity: (() => void) | null = null;

  constructor(
    storageManager: StorageManager,
    projectId: string,
    config?: Partial<CrossTabSessionConfig>,
    callbacks?: {
      onSessionStart?: (sessionId: string) => void;
      onSessionEnd?: (reason: SessionEndReason) => void;
      onTabActivity?: () => void;
    },
  ) {
    super();

    this.storageManager = storageManager;
    this.projectId = projectId;
    this.tabId = generateUUID();

    this.config = {
      tabHeartbeatIntervalMs: TAB_HEARTBEAT_INTERVAL_MS,
      tabElectionTimeoutMs: TAB_ELECTION_TIMEOUT_MS,
      debugMode: this.get('config')?.qaMode ?? false,
      ...config,
    };

    this.onSessionStart = callbacks?.onSessionStart ?? null;
    this.onSessionEnd = callbacks?.onSessionEnd ?? null;
    this.onTabActivity = callbacks?.onTabActivity ?? null;

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

      // Set up listeners after the channel is created and assigned
      setTimeout(() => this.setupBroadcastListeners(), 0);

      return channel;
    } catch (error) {
      if (this.config.debugMode) {
        logUnknown('warning', 'Failed to initialize BroadcastChannel', error);
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
      this.isTabLeader = true;
      this.tabInfo.isLeader = true;
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
  }

  /**
   * Check if this tab should be the session leader
   */
  private tryJoinExistingSession(sessionContext: SessionContext): void {
    if (this.config.debugMode) {
      log('info', `Attempting to join existing session: ${sessionContext.sessionId}`);
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
    if (this.onTabActivity) {
      this.onTabActivity();
    }
  }

  /**
   * Request leadership status from other tabs
   */
  private requestLeadershipStatus(): void {
    if (!this.broadcastChannel) return;

    const message: CrossTabMessage = {
      type: 'election_request',
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
    };

    this.broadcastChannel.postMessage(message);

    // Set timeout for election
    this.electionTimeout = window.setTimeout(() => {
      // No response means we become the leader
      this.becomeLeader();
    }, this.config.tabElectionTimeoutMs);
  }

  /**
   * Start leader election process
   */
  private startLeaderElection(): void {
    if (this.config.debugMode) {
      log('info', 'Starting leader election');
    }

    // Announce election request
    this.requestLeadershipStatus();
  }

  /**
   * Become the session leader
   */
  private becomeLeader(): void {
    this.isTabLeader = true;
    this.tabInfo.isLeader = true;

    if (this.config.debugMode) {
      log('info', `Tab ${this.tabId} became session leader`);
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
      if (this.onSessionStart) {
        this.onSessionStart(sessionId);
      }

      // Announce new session to other tabs
      this.announceSessionStart(sessionId);
    }

    // Store tab info
    this.storeTabInfo();
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
   * Setup BroadcastChannel event listeners
   */
  private setupBroadcastListeners(): void {
    if (!this.broadcastChannel) return;

    this.broadcastChannel.addEventListener('message', (event: MessageEvent<CrossTabMessage>) => {
      const message = event.data;

      // Ignore messages from this tab
      if (message.tabId === this.tabId) return;

      this.handleCrossTabMessage(message);
    });
  }

  /**
   * Handle cross-tab messages
   */
  private handleCrossTabMessage(message: CrossTabMessage): void {
    if (this.config.debugMode) {
      log('info', `Received cross-tab message: ${message.type} from ${message.tabId}`);
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
        if (this.onTabActivity) {
          this.onTabActivity();
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
  private handleSessionEndMessage(_message: CrossTabMessage): void {
    // Only end session if we're not the leader or if the message is from the leader
    if (!this.isTabLeader) {
      this.tabInfo.sessionId = '';
      this.storeTabInfo();
    }
  }

  /**
   * Handle tab closing message from another tab
   */
  private handleTabClosingMessage(message: CrossTabMessage): void {
    const sessionContext = this.getStoredSessionContext();
    if (sessionContext && message.sessionId === sessionContext.sessionId) {
      // Decrease tab count
      sessionContext.tabCount = Math.max(0, sessionContext.tabCount - 1);
      this.storeSessionContext(sessionContext);

      // If this was the last tab and we're not the leader, become leader
      if (sessionContext.tabCount === 0 && !this.isTabLeader) {
        this.becomeLeader();
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
      // Another tab is already the leader
      this.isTabLeader = false;
      this.tabInfo.isLeader = false;

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
   * Send heartbeat to other tabs
   */
  private sendHeartbeat(): void {
    if (!this.broadcastChannel || !this.tabInfo.sessionId) return;

    const message: CrossTabMessage = {
      type: 'heartbeat',
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
    };

    this.broadcastChannel.postMessage(message);
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
    if (this.config.debugMode) {
      log('info', `Ending cross-tab session: ${reason}`);
    }

    // Announce tab closing
    this.announceTabClosing();

    // Update session context
    const sessionContext = this.getStoredSessionContext();
    if (sessionContext) {
      sessionContext.tabCount = Math.max(0, sessionContext.tabCount - 1);

      // Only end session if this is the last tab or we're the leader
      if (sessionContext.tabCount === 0 || this.isTabLeader) {
        this.clearStoredSessionContext();

        // Notify session end
        if (this.onSessionEnd) {
          this.onSessionEnd(reason);
        }

        // Announce session end to other tabs
        this.announceSessionEnd(reason);
      } else {
        this.storeSessionContext(sessionContext);
      }
    }

    // Clear tab info
    this.clearTabInfo();
  }

  /**
   * Announce tab is closing to other tabs
   */
  private announceTabClosing(): void {
    if (!this.broadcastChannel) return;

    const message: CrossTabMessage = {
      type: 'tab_closing',
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
    };

    this.broadcastChannel.postMessage(message);
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
    } catch {
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
        logUnknown('warning', 'Failed to store session context', error);
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
      this.storageManager.setItem(TAB_INFO_KEY(this.projectId), JSON.stringify(this.tabInfo));
    } catch (error) {
      if (this.config.debugMode) {
        logUnknown('warning', 'Failed to store tab info', error);
      }
    }
  }

  /**
   * Clear tab info from localStorage
   */
  private clearTabInfo(): void {
    this.storageManager.removeItem(TAB_INFO_KEY(this.projectId));
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

    // End session and cleanup
    this.endSession('manual_stop');

    // Close BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }
}
