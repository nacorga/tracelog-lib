export interface WindowWithBroadcast extends Window {
  broadcastChannelMessages: Array<{
    type: string;
    tabId: string;
    timestamp: number;
    sessionId: string;
  }>;
  broadcastChannelName: string;
}
