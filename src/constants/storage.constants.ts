export const STORAGE_BASE_KEY = 'tl';
export const USER_ID_KEY = (id: string): string => (id ? `${STORAGE_BASE_KEY}:${id}:uid` : `${STORAGE_BASE_KEY}:uid`);
export const QUEUE_KEY = (id: string): string => (id ? `${STORAGE_BASE_KEY}:${id}:queue` : `${STORAGE_BASE_KEY}:queue`);
export const SESSION_STORAGE_KEY = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:session` : `${STORAGE_BASE_KEY}:session`;
