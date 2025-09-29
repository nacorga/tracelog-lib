import { vi, beforeEach, afterEach } from 'vitest';

// Mock headers for integration tests
const mockHeaders = new Map([
  ['accept', 'application/json'],
  ['content-type', 'application/json'],
  ['user-agent', 'Mozilla/5.0 (compatible; Test)'],
  ['referer', 'https://test.localhost'],
]);

// Global test setup for integration tests
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Mock console methods to reduce noise
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});

  // Mock the headers object for ConfigManager
  global.Headers = vi.fn().mockImplementation(() => ({
    get: vi.fn((key: string) => mockHeaders.get(key.toLowerCase()) || null),
    set: vi.fn((key: string, value: string) => mockHeaders.set(key.toLowerCase(), value)),
    has: vi.fn((key: string) => mockHeaders.has(key.toLowerCase())),
    delete: vi.fn((key: string) => mockHeaders.delete(key.toLowerCase())),
    entries: vi.fn(() => mockHeaders.entries()),
    keys: vi.fn(() => mockHeaders.keys()),
    values: vi.fn(() => mockHeaders.values()),
    forEach: vi.fn((callback: (value: string, key: string, headers: Map<string, string>) => void) =>
      mockHeaders.forEach(callback),
    ),
  }));

  // Mock Request constructor for configuration loading
  global.Request = vi.fn().mockImplementation((url, options = {}) => ({
    url,
    method: options.method || 'GET',
    headers: new global.Headers(options.headers || {}),
    body: options.body || null,
  }));

  // Mock Response constructor with proper headers
  (global as any).Response = vi.fn().mockImplementation((body, options = {}) => {
    const responseHeaders = new global.Headers({
      'content-type': 'application/json',
      ...options.headers,
    });

    return {
      ok: options.status ? options.status >= 200 && options.status < 300 : true,
      status: options.status || 200,
      statusText: options.statusText || 'OK',
      headers: responseHeaders,
      json: vi.fn().mockResolvedValue(typeof body === 'string' ? JSON.parse(body) : body),
      text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
      blob: vi.fn().mockResolvedValue(new Blob([body || ''])),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    };
  }) as any;

  // Reset window properties
  delete window.__traceLogBridge;

  // Reset global variables
  if (typeof window !== 'undefined') {
    // Reset any global TraceLog instances
    (window as any).TraceLog = undefined;
  }
});

afterEach(() => {
  // Restore console methods
  vi.restoreAllMocks();

  // Clean up any remaining DOM modifications
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Clean up global variables
  delete window.__traceLogBridge;
  (window as any).TraceLog = undefined;
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock requestAnimationFrame for tests
global.requestAnimationFrame = vi.fn().mockImplementation((cb: FrameRequestCallback) => {
  return setTimeout(cb, 16);
});

global.cancelAnimationFrame = vi.fn().mockImplementation((id: number) => {
  clearTimeout(id);
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([]),
}));

export {};
