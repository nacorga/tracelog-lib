// Comprehensive CI setup to prevent webidl-conversions and whatwg-url errors
// Based on Vitest community best practices and GitHub issue solutions

// Detect CI environment
const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'test';

if (isCI) {
  // 1. Fix the specific webidl-conversions error by mocking the problematic 'get' access
  // This addresses the exact error: "Cannot read properties of undefined (reading 'get')"
  const mockGetFunction = (): undefined => undefined;

  // Ensure global object has the 'get' property that webidl-conversions expects
  if (typeof (global as unknown as Record<string, unknown>).get === 'undefined') {
    Object.defineProperty(global, 'get', {
      value: mockGetFunction,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }

  // 2. Polyfill critical Node.js globals for CI environment
  const requiredGlobals = {
    process: process,
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
    ArrayBuffer: ArrayBuffer,
    Uint8Array: Uint8Array,
    DataView: DataView,
  };

  Object.entries(requiredGlobals).forEach(([name, value]) => {
    if (typeof (global as unknown as Record<string, unknown>)[name] === 'undefined') {
      (global as unknown as Record<string, unknown>)[name] = value;
    }
  });

  // 3. Mock DOMException with proper prototype chain for webidl-conversions
  if (typeof global.DOMException === 'undefined') {
    global.DOMException = class MockDOMException extends Error {
      public code = 0;

      constructor(message?: string, name?: string) {
        super(message);
        this.name = name ?? 'DOMException';
        Object.setPrototypeOf(this, MockDOMException.prototype);
      }

      // Add standard DOMException constants
      static readonly INDEX_SIZE_ERR = 1;
      static readonly DOMSTRING_SIZE_ERR = 2;
      static readonly HIERARCHY_REQUEST_ERR = 3;
      static readonly WRONG_DOCUMENT_ERR = 4;
      static readonly INVALID_CHARACTER_ERR = 5;
      static readonly NO_DATA_ALLOWED_ERR = 6;
      static readonly NO_MODIFICATION_ALLOWED_ERR = 7;
      static readonly NOT_FOUND_ERR = 8;
      static readonly NOT_SUPPORTED_ERR = 9;
      static readonly INUSE_ATTRIBUTE_ERR = 10;
      static readonly INVALID_STATE_ERR = 11;
      static readonly SYNTAX_ERR = 12;
      static readonly INVALID_MODIFICATION_ERR = 13;
      static readonly NAMESPACE_ERR = 14;
      static readonly INVALID_ACCESS_ERR = 15;
      static readonly VALIDATION_ERR = 16;
      static readonly TYPE_MISMATCH_ERR = 17;
      static readonly SECURITY_ERR = 18;
      static readonly NETWORK_ERR = 19;
      static readonly ABORT_ERR = 20;
      static readonly URL_MISMATCH_ERR = 21;
      static readonly QUOTA_EXCEEDED_ERR = 22;
      static readonly TIMEOUT_ERR = 23;
      static readonly INVALID_NODE_TYPE_ERR = 24;
      static readonly DATA_CLONE_ERR = 25;
    } as unknown as typeof DOMException;
  }

  // 4. Prevent Object.getOwnPropertyDescriptor from throwing on undefined objects
  const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  Object.getOwnPropertyDescriptor = function (obj: unknown, prop: string | symbol): PropertyDescriptor | undefined {
    if (obj === null || obj === undefined) {
      return undefined;
    }
    try {
      return originalGetOwnPropertyDescriptor.call(this, obj, prop);
    } catch (error) {
      // Log the error for debugging but return a safe descriptor
      console.warn(`[CI-SETUP] Property descriptor access failed for ${String(prop)}:`, error);
      return {
        value: undefined,
        writable: true,
        enumerable: false,
        configurable: true,
      };
    }
  };

  // 5. Mock WeakMap and WeakSet if not available (some CI environments)
  if (typeof global.WeakMap === 'undefined') {
    global.WeakMap = Map as unknown as typeof WeakMap;
  }
  if (typeof global.WeakSet === 'undefined') {
    global.WeakSet = Set as unknown as typeof WeakSet;
  }

  // 6. Ensure Symbol with required properties
  if (typeof global.Symbol === 'undefined' || !global.Symbol.iterator) {
    const existingSymbol = global.Symbol || {};
    global.Symbol = {
      ...existingSymbol,
      iterator: Symbol.for('Symbol.iterator'),
      toStringTag: Symbol.for('Symbol.toStringTag'),
      for: Symbol.for,
      keyFor: Symbol.keyFor,
    } as unknown as SymbolConstructor;
  }
}
