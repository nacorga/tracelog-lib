import { SessionId, Timestamp, URL as URLType, UserId } from '../types';

export const createUserId = (id: string): UserId => {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Invalid user ID');
  }

  return id as UserId;
};

export const createSessionId = (id: string): SessionId => {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Invalid session ID');
  }

  return id as SessionId;
};

export const createTimestamp = (timestamp?: number): Timestamp => {
  const ts = timestamp ?? Date.now();

  if (typeof ts !== 'number' || ts <= 0) {
    throw new Error('Invalid timestamp');
  }

  return ts as Timestamp;
};

export const createURL = (url: string): URLType => {
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('Invalid URL');
  }

  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  return url as URLType;
};
