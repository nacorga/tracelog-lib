export interface AdminError {
  message: string;
  timestamp: number;
  userAgent: string;
  url: string;
  api_key?: string;
  stack?: string;
  severity?: 'low' | 'medium' | 'high';
  context?: string;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
