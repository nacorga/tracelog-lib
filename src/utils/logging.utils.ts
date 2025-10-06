export const formatLogMsg = (msg: string, error?: unknown): string => {
  if (error) {
    return `[TraceLog] ${msg}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  return `[TraceLog] ${msg}`;
};

export const log = (
  type: 'info' | 'warn' | 'error',
  msg: string,
  extra?: { error?: unknown; data?: Record<string, unknown>; showToClient?: boolean },
): void => {
  const { error, data, showToClient } = extra ?? {};
  const formattedMsg = error ? formatLogMsg(msg, error) : `[TraceLog] ${msg}`;
  const method = type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'log';

  if (process.env.NODE_ENV !== 'dev' && !showToClient) {
    return;
  }

  if (data !== undefined) {
    console[method](formattedMsg, data);
  } else {
    console[method](formattedMsg);
  }
};
