applyTo:
  - src/utils/**/*.ts
  - src/constants/**/*.ts

# Utility Functions & Constants Review Instructions

## Utility Architecture Pattern

All utility functions must be **pure functions** with no side effects:

```typescript
// ✅ GOOD: Pure function
export const normalizeUrl = (url: string, sensitiveParams: string[]): string => {
  // No side effects, deterministic output
  return cleanedUrl;
};

// ❌ BAD: Side effects
export const normalizeUrl = (url: string): string => {
  localStorage.setItem('lastUrl', url); // Side effect!
  return cleanedUrl;
};
```

## Critical Checks

### 1. Security & PII Protection (BLOCKING)
- ✅ **Sanitization**: All string inputs sanitized against XSS patterns
- ✅ **PII Redaction**: Email, phone, credit cards, API keys automatically redacted
- ✅ **URL Filtering**: Sensitive query params removed (token, auth, key, password)
- ✅ **Input Protection**: NEVER capture values from `<input>`, `<textarea>`, `<select>`
- ❌ **BLOCK**: Missing sanitization on user-provided strings → Security vulnerability

### 2. Validation Functions (BLOCKING)
- ✅ Return structured validation results: `{ valid: boolean; error?: string; }`
- ✅ Provide specific error messages for debugging
- ✅ Validate ALL user inputs (config, metadata, event names)
- ✅ Use TypeScript type guards for runtime type checking
- ❌ **BLOCK**: Boolean-only validation (no error message) → Hard to debug

### 3. Pure Functions (BLOCKING)
- ✅ No side effects (no DOM manipulation, no API calls, no state mutation)
- ✅ Deterministic output for same input
- ✅ No external dependencies (except constants)
- ❌ **BLOCK**: Side effects in utils → Wrong pattern

### 4. Error Handling (HIGH)
- ✅ Try-catch blocks for operations that can throw
- ✅ Return null/undefined/empty for invalid inputs (graceful degradation)
- ✅ Log errors with context via `log()` utility
- ⚠️ **HIGH**: Throwing errors without try-catch in caller → Unhandled exceptions

## Utility Categories

### Security Utilities (`src/utils/security/`)

**Critical patterns:**
- **Sanitization**: Remove XSS patterns, HTML entity encoding
- **PII Redaction**: Auto-detect and redact sensitive patterns
- **Input Validation**: Validate before sanitizing
- **Depth Protection**: Prevent infinite recursion (max depth: 10)

**Constants to enforce:**
- `MAX_STRING_LENGTH` - 1000 chars
- `MAX_ARRAY_LENGTH` - 100 items
- `MAX_OBJECT_DEPTH` - 10 levels
- `MAX_NESTED_OBJECT_KEYS` - 50 keys
- `XSS_PATTERNS` - List of regex patterns for XSS detection
- `PII_PATTERNS` - Email, phone, credit card, API key patterns

**Example validation:**
```typescript
// ✅ GOOD: Proper sanitization flow
export const sanitizeString = (value: string): string => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  let sanitized = value;

  // Limit length
  if (value.length > MAX_STRING_LENGTH) {
    sanitized = value.slice(0, MAX_STRING_LENGTH);
  }

  // Remove XSS patterns
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // HTML entity encoding
  sanitized = sanitized
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  return sanitized.trim();
};
```

### Validation Utilities (`src/utils/validations/`)

**Critical patterns:**
- **Config Validation**: Validate BEFORE using config values
- **Event Validation**: Validate event name, metadata structure, data types
- **Type Guards**: Runtime type checking for TypeScript strict mode
- **Error Messages**: Specific, actionable error messages (not generic "invalid input")

**Validation return structure:**
```typescript
interface ValidationResult<T = unknown> {
  valid: boolean;
  error?: string;
  sanitizedMetadata?: T; // For metadata validation
}
```

**Example validation:**
```typescript
// ✅ GOOD: Structured validation
export const isValidEventName = (name: string): ValidationResult => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Event name must be a non-empty string' };
  }

  if (name.length > MAX_EVENT_NAME_LENGTH) {
    return { valid: false, error: `Event name exceeds ${MAX_EVENT_NAME_LENGTH} characters` };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return { valid: false, error: 'Event name must contain only alphanumeric characters and underscores' };
  }

  return { valid: true };
};

// ❌ BAD: Boolean-only validation
export const isValidEventName = (name: string): boolean => {
  return typeof name === 'string' && name.length > 0;
};
```

### Browser Utilities (`src/utils/browser/`)

**Critical patterns:**
- **Device Detection**: Detect mobile/tablet/desktop based on user agent
- **UTM Parameters**: Extract UTM params from URL for attribution
- **QA Mode Detection**: Detect `?tlog_mode=qa` for verbose logging
- **Browser Compatibility**: Feature detection, not browser detection

**SSR Safety:**
- All browser utilities MUST check for `window` and `document` existence
- Return safe defaults when not in browser environment

```typescript
// ✅ GOOD: SSR-safe utility
export const getDeviceType = (): DeviceType => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return DeviceType.DESKTOP; // Safe default
  }

  const ua = navigator.userAgent.toLowerCase();
  // Device detection logic...
};

// ❌ BAD: Will crash in SSR
export const getDeviceType = (): DeviceType => {
  const ua = navigator.userAgent.toLowerCase(); // ReferenceError in Node.js!
};
```

### Network Utilities (`src/utils/network/`)

**Critical patterns:**
- **URL Normalization**: Remove sensitive query params, normalize format
- **HTTP Protocol Validation**: Enforce HTTPS in production (unless `allowHttp: true`)
- **URL Validation**: Validate URL structure before making requests

**Security checks:**
- Never allow HTTP in production without explicit opt-in
- Validate URL protocol before sending data
- Filter sensitive query params before logging/tracking

```typescript
// ✅ GOOD: URL normalization with security
export const normalizeUrl = (url: string, sensitiveParams: string[] = []): string => {
  try {
    const parsedUrl = new URL(url);

    // Remove sensitive query params
    const allSensitiveParams = [...DEFAULT_SENSITIVE_PARAMS, ...sensitiveParams];
    allSensitiveParams.forEach((param) => {
      parsedUrl.searchParams.delete(param);
    });

    return parsedUrl.toString();
  } catch {
    return url; // Return original if parsing fails
  }
};
```

### Data Utilities (`src/utils/data/`)

**Critical patterns:**
- **UUID Generation**: Use `crypto.randomUUID()` when available, fallback to polyfill
- **Date/Time**: Use ISO 8601 format for timestamps
- **Hashing**: Never implement custom crypto (use Web Crypto API)

### Constants (`src/constants/`)

**Critical patterns:**
- **Naming Convention**: `SCREAMING_SNAKE_CASE` for all constants
- **Grouping**: Related constants in same file (config, error, performance, storage)
- **Documentation**: JSDoc comments for non-obvious constants
- **Type Safety**: Export const objects with `as const` for literal types

**Example constants file:**
```typescript
/**
 * Maximum session timeout in milliseconds (24 hours)
 */
export const MAX_SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/**
 * Minimum session timeout in milliseconds (1 minute)
 */
export const MIN_SESSION_TIMEOUT_MS = 60 * 1000;

/**
 * Default session timeout (15 minutes)
 */
export const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1000;

/**
 * Sensitive query parameters removed from URLs by default
 */
export const DEFAULT_SENSITIVE_QUERY_PARAMS = [
  'token',
  'auth',
  'key',
  'password',
  'api_key',
  // ... more params
] as const;
```

## Testing Requirements

### Unit Tests
- **MUST**: 90%+ coverage for all utility functions
- **MUST**: Test edge cases (null, undefined, empty string, max values)
- **MUST**: Test error handling paths
- **SHOULD**: Test XSS/injection patterns in security utils

### Test Structure
```typescript
describe('sanitizeString', () => {
  it('should remove XSS patterns', () => {
    const result = sanitizeString('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
  });

  it('should handle null input gracefully', () => {
    const result = sanitizeString(null as any);
    expect(result).toBe('');
  });

  it('should truncate long strings', () => {
    const longString = 'a'.repeat(MAX_STRING_LENGTH + 100);
    const result = sanitizeString(longString);
    expect(result.length).toBe(MAX_STRING_LENGTH);
  });
});
```

## Common Issues

### Critical (Must Fix)
- ❌ Missing XSS sanitization on user input strings
- ❌ Missing PII redaction in error messages or click text
- ❌ Missing SSR safety checks (`typeof window === 'undefined'`)
- ❌ Side effects in utility functions (DOM, API, state changes)
- ❌ Missing validation before using config values
- ❌ Boolean-only validation (no error messages)

### High Priority
- ⚠️ Missing error handling in try-catch blocks
- ⚠️ No null checks for optional parameters
- ⚠️ Throwing errors without proper context
- ⚠️ Missing JSDoc comments on public utilities
- ⚠️ Not using constants (magic numbers/strings hardcoded)

### Medium Priority
- 💡 Complex logic not broken into smaller functions
- 💡 Duplicate validation logic across files
- 💡 Missing test coverage for edge cases
- 💡 No TypeScript type guards for runtime checks

## Security Checklist

**Before merging utility changes:**

- [ ] All string inputs sanitized against XSS
- [ ] PII patterns redacted from text/errors
- [ ] Sensitive URL params filtered
- [ ] Input values NEVER captured from form fields
- [ ] SSR-safe (checks for `window`/`document`)
- [ ] Pure functions (no side effects)
- [ ] Validation returns structured results (not just booleans)
- [ ] Error handling with context logging
- [ ] 90%+ test coverage
- [ ] Constants used instead of magic values

## Example Review Comments

**Good**: "HIGH: The `sanitizeString()` function at line 45 is missing XSS pattern removal. Add XSS_PATTERNS iteration before HTML entity encoding to prevent script injection. Example: `for (const pattern of XSS_PATTERNS) { sanitized = sanitized.replace(pattern, ''); }`"

**Good**: "BLOCKING: The `normalizeUrl()` utility at line 78 has side effects (localStorage write). Utilities MUST be pure functions. Remove the side effect and handle storage in the manager layer instead."

**Good**: "MEDIUM: The validation at line 120 returns a boolean. Update to return `ValidationResult` structure: `{ valid: boolean; error?: string; }`. This provides better error context for debugging and QA mode."

**Good**: "The `getDeviceType()` utility looks correct. Consider adding a test case for SSR environments to ensure it returns a safe default when `window` is undefined."
