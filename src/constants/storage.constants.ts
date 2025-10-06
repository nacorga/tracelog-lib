export const STORAGE_BASE_KEY = 'tlog';
export const QA_MODE_KEY = `${STORAGE_BASE_KEY}:qa_mode`;
export const USER_ID_KEY = `${STORAGE_BASE_KEY}:uid`;

export const QUEUE_KEY = (id: string): string => (id ? `${STORAGE_BASE_KEY}:${id}:queue` : `${STORAGE_BASE_KEY}:queue`);
export const SESSION_STORAGE_KEY = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:session` : `${STORAGE_BASE_KEY}:session`;

// Cross-tab session management storage keys
export const CROSS_TAB_SESSION_KEY = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:cross_tab_session` : `${STORAGE_BASE_KEY}:cross_tab_session`;
export const TAB_INFO_KEY = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:tab_info` : `${STORAGE_BASE_KEY}:tab_info`;

export const TAB_SPECIFIC_INFO_KEY = (projectId: string, tabId: string): string =>
  `${STORAGE_BASE_KEY}:${projectId}:tab:${tabId}:info`;
export const SESSION_RECOVERY_KEY = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:recovery` : `${STORAGE_BASE_KEY}:recovery`;

// BroadcastChannel name for cross-tab communication
export const BROADCAST_CHANNEL_NAME = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:broadcast` : `${STORAGE_BASE_KEY}:broadcast`;
