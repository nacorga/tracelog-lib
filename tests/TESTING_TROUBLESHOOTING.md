# Testing Troubleshooting Guide

**TraceLog Library** - Common test failures, diagnostic techniques, and solutions

---

## Table of Contents

1. [Quick Diagnostic Checklist](#quick-diagnostic-checklist)
2. [Common Test Failures](#common-test-failures)
3. [Diagnostic Techniques](#diagnostic-techniques)
4. [Real-World Examples](#real-world-examples)
5. [When to Suspect Library vs Test Issues](#when-to-suspect-library-vs-test-issues)

---

## Quick Diagnostic Checklist

When a test fails unexpectedly, check these first:

### ✅ Event Type Case Sensitivity
```typescript
// ❌ Common mistake - uppercase event types
events.filter(e => e.type === 'SESSION_START')  // Returns []

// ✅ Correct - lowercase matches enum
events.filter(e => e.type === 'session_start')  // Works!
```

### ✅ ProjectId Validation
```typescript
// ❌ Common mistake - wrong projectId
onMessageHandler!({ data: { projectId: 'test-project' } })  // Rejected

// ✅ Correct - use 'custom' for standalone mode
onMessageHandler!({ data: { projectId: 'custom' } })  // Works!
```

### ✅ Queue Inspection
```typescript
// Always check queue contents when debugging
const queueState = getQueueState(bridge);
console.log('[DEBUG] Queue length:', queueState.length);
console.log('[DEBUG] Event types:', queueState.events.map(e => e.type));
```

### ✅ Test Isolation
```typescript
// Ensure proper cleanup between tests
beforeEach(() => {
  setupTestEnvironment();  // ✅ Always use
  localStorage.clear();    // ✅ Clear storage
});

afterEach(() => {
  destroyTestBridge();       // ✅ Cleanup bridge
  cleanupTestEnvironment();  // ✅ Cleanup globals
});
```

---

## Common Test Failures

### 1. Event Count is Always 0

**Symptom**: `expect(count).toBe(1)` fails with actual value of 0

**Common Causes**:

#### A. Event Type Case Sensitivity (Most Common)

```typescript
// ❌ PROBLEM
const sessionStartCount = events.filter(e => e.type === 'SESSION_START').length;
expect(sessionStartCount).toBe(1);  // ❌ Fails: actual = 0

// ✅ SOLUTION
const sessionStartCount = events.filter(e => e.type === 'session_start').length;
expect(sessionStartCount).toBe(1);  // ✅ Passes
```

**Why**: EventType enum values are lowercase (`'session_start'`), not uppercase (`'SESSION_START'`).

**Reference**: `src/types/event.types.ts:29-41`

#### B. Events in Consent Buffer (Not Main Queue)

```typescript
// ❌ PROBLEM - Looking in wrong place
const queueState = getQueueState(bridge);
const events = queueState.events;  // Empty if buffered!

// ✅ SOLUTION - Check consent buffers too
import { getConsentBufferState } from '../helpers/bridge.helper';

const customBuffer = getConsentBufferState(bridge, 'custom');
const tracelogBuffer = getConsentBufferState(bridge, 'tracelog');

console.log('[DEBUG] Queue:', getQueueState(bridge).length);
console.log('[DEBUG] Custom buffer:', customBuffer.length);
console.log('[DEBUG] Tracelog buffer:', tracelogBuffer.length);
```

**When to check**: Tests with `waitForConsent: true` configuration

#### C. Events Filtered by Rate Limiting or Sampling

```typescript
// Events might be filtered before reaching queue
// Check configuration:
const config = bridge.getFullState().config;
console.log('[DEBUG] samplingRate:', config?.samplingRate);
console.log('[DEBUG] errorSampling:', config?.errorSampling);
```

**Solution**: Mock `Math.random()` for deterministic sampling tests

---

### 2. BroadcastChannel Messages Not Processing

**Symptom**: Session state doesn't update after simulating broadcast message

**Common Causes**:

#### A. ProjectId Mismatch (Most Common)

```typescript
// ❌ PROBLEM - Wrong projectId
onMessageHandler!({
  data: {
    action: 'session_start',
    sessionId: externalSessionId,
    projectId: 'test-project',  // ← REJECTED by library!
  }
});

// Session doesn't update because message was rejected

// ✅ SOLUTION - Use correct default projectId
onMessageHandler!({
  data: {
    action: 'session_start',
    sessionId: externalSessionId,
    projectId: 'custom',  // ← Matches library default
  }
});
```

**Why**: SessionManager validates projectId for security (src/managers/session.manager.ts:110-115). Mismatched projectId causes silent rejection.

**Default projectId**: `'custom'` for standalone mode (no integrations configured)

#### B. Handler Not Set

```typescript
// ❌ PROBLEM - Handler not captured
let onMessageHandler: ((event: any) => void) | null = null;

(global as any).BroadcastChannel = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  close: vi.fn(),
  onmessage: null,  // ← Handler never captured!
}));

// ✅ SOLUTION - Use property descriptor
(global as any).BroadcastChannel = vi.fn().mockImplementation(() => {
  const channel = {
    postMessage: vi.fn(),
    close: vi.fn(),
    onmessage: null as any,
  };

  Object.defineProperty(channel, 'onmessage', {
    get: () => onMessageHandler,
    set: (handler) => {
      onMessageHandler = handler;  // ← Captured!
    },
  });

  return channel;
});

// Wait for handler to be set
await waitForCondition(() => onMessageHandler !== null, 1000);
```

---

### 3. Queue Appears Empty But Events Were Tracked

**Symptom**: Events tracked via `bridge.event()` but queue is empty

**Diagnostic Steps**:

#### Step 1: Verify Initialization
```typescript
console.log('[DEBUG] Bridge initialized?', bridge.initialized);
console.log('[DEBUG] Session ID:', bridge.getSessionData().id);
```

#### Step 2: Check All Storage Locations
```typescript
// Main queue
const queue = getQueueState(bridge);
console.log('[DEBUG] Main queue:', queue.length);

// Consent buffers
const customBuffer = getConsentBufferState(bridge, 'custom');
const tracelogBuffer = getConsentBufferState(bridge, 'tracelog');
console.log('[DEBUG] Custom buffer:', customBuffer.length);
console.log('[DEBUG] Tracelog buffer:', tracelogBuffer.length);
```

#### Step 3: Check localStorage Recovery
```typescript
// Events might be persisted for next-page recovery
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key?.startsWith('tlog:queue:')) {
    const value = localStorage.getItem(key);
    console.log(`[DEBUG] localStorage["${key}"] =`, value);
  }
}
```

#### Step 4: Verify Event Configuration
```typescript
const config = bridge.getFullState().config;
console.log('[DEBUG] disabledEvents:', config?.disabledEvents);
console.log('[DEBUG] waitForConsent:', config?.waitForConsent);
```

---

### 4. Session State Not Clearing

**Symptom**: `expect(sessionId).toBeNull()` fails, sessionId still has value

**Common Causes**:

#### A. ProjectId Mismatch in session_end
```typescript
// ❌ PROBLEM
onMessageHandler!({
  data: {
    action: 'session_end',
    sessionId: sessionId,
    projectId: 'wrong-project',  // ← Rejected!
  }
});

// Session NOT cleared because message rejected

// ✅ SOLUTION
onMessageHandler!({
  data: {
    action: 'session_end',
    sessionId: sessionId,
    projectId: 'custom',  // ← Correct!
  }
});
```

#### B. Not Waiting for Async Operations
```typescript
// ❌ PROBLEM - Check too early
onMessageHandler!({ data: { action: 'session_end', ... } });
const sessionId = bridge.getSessionData().id;  // Still set!

// ✅ SOLUTION - Wait for processing
onMessageHandler!({ data: { action: 'session_end', ... } });
await new Promise(resolve => setTimeout(resolve, 100));
const sessionId = bridge.getSessionData().id;  // Now null
```

---

## Diagnostic Techniques

### 1. Force-Fail with Diagnostic Output

**Pattern**: Intentionally fail test to inspect actual values

```typescript
it('diagnostic test', async () => {
  const bridge = await initTestBridge();
  const events = getQueueState(bridge).events;

  // Create diagnostic object
  const diagnostic = {
    queueLength: events.length,
    eventTypes: events.map(e => e.type),
    sessionId: bridge.getSessionData().id,
    config: bridge.getFullState().config,
  };

  // Force failure to see diagnostic output
  expect(events.length, `DIAGNOSTIC:\n${JSON.stringify(diagnostic, null, 2)}`).toBe(-999);
});
```

**Output**:
```
AssertionError: DIAGNOSTIC:
{
  "queueLength": 2,
  "eventTypes": ["session_start", "page_view"],
  "sessionId": "1738163170000-abc123",
  "config": { ... }
}
Expected: -999
Received: 2
```

---

### 2. Queue Inspection Pattern

**Pattern**: Log queue contents at key points

```typescript
it('should track events', async () => {
  const bridge = await initTestBridge();

  // Checkpoint 1: After init
  console.log('[CHECKPOINT 1] Queue:', getQueueState(bridge).events.map(e => e.type));

  // Track custom event
  bridge.event('test_event', { value: 123 });

  // Checkpoint 2: After tracking
  console.log('[CHECKPOINT 2] Queue:', getQueueState(bridge).events.map(e => e.type));

  // Verify
  const events = getQueueState(bridge).events;
  const customEvent = events.find(e => e.type === 'custom');
  expect(customEvent).toBeTruthy();
});
```

---

### 3. BroadcastChannel Message Tracing

**Pattern**: Log all broadcast messages

```typescript
it('should trace broadcast messages', async () => {
  let capturedMessages: any[] = [];
  let onMessageHandler: ((event: any) => void) | null = null;

  (global as any).BroadcastChannel = vi.fn().mockImplementation(() => {
    const channel = {
      postMessage: vi.fn((message) => {
        console.log('[BROADCAST SENT]', JSON.stringify(message, null, 2));
        capturedMessages.push(message);
      }),
      close: vi.fn(),
      onmessage: null as any,
    };

    Object.defineProperty(channel, 'onmessage', {
      get: () => onMessageHandler,
      set: (handler) => {
        console.log('[BROADCAST HANDLER SET]');
        onMessageHandler = handler;
      },
    });

    return channel;
  });

  const bridge = await initTestBridge();

  // Wait for broadcast
  await waitForCondition(() => capturedMessages.length > 0, 1000);

  console.log('[BROADCAST MESSAGES]', capturedMessages);
});
```

---

### 4. Create Isolated Diagnostic Tests

**Pattern**: Create minimal test file to isolate issue

**Example Pattern**: Create temporary diagnostic files like `tests/integration/flows/diagnostic-<issue-name>.test.ts`

**Note**: Delete diagnostic files after investigation (they're temporary debugging tools)

**Example File**: `tests/integration/flows/diagnostic-event-types.test.ts`
```typescript
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getQueueState } from '../../helpers/bridge.helper';

describe('Diagnostic: Event Type Case', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should show actual event type values', async () => {
    const bridge = await initTestBridge();
    const events = getQueueState(bridge).events;

    // Force display of actual values
    const diagnostic = {
      eventTypes: events.map(e => ({ type: e.type, id: e.id })),
      uppercaseMatch: events.filter(e => e.type === 'SESSION_START').length,
      lowercaseMatch: events.filter(e => e.type === 'session_start').length,
    };

    console.log('[DIAGNOSTIC]', JSON.stringify(diagnostic, null, 2));

    // This test documents behavior, always passes
    expect(true).toBe(true);
  });
});
```

**Run** (if file created): `npm run test:integration -- diagnostic-event-types`

---

## Real-World Examples

### Example 1: Multi-Tab Sync Investigation (January 2024)

**Initial Problem**: 6 out of 9 tests failing in multi-tab-sync.test.ts

**Investigation Process**:
1. Created diagnostic tests to isolate issues
2. Discovered events ARE in queue but filtered incorrectly
3. Found two root causes:
   - Event type case sensitivity (4 failures)
   - ProjectId mismatch (3 failures)

**Root Cause #1: Event Type Case**
```typescript
// ❌ FAILING TEST
const sessionStartCount = events.filter(e => e.type === 'SESSION_START').length;
expect(sessionStartCount).toBe(1);  // ❌ Actual: 0

// Diagnostic revealed:
{
  "events": [
    { "type": "session_start" },  // ← lowercase!
    { "type": "page_view" }
  ],
  "uppercaseFilter": 0,  // ← No matches
  "lowercaseFilter": 1   // ← Correct!
}

// ✅ FIXED
const sessionStartCount = events.filter(e => e.type === 'session_start').length;
expect(sessionStartCount).toBe(1);  // ✅ Actual: 1
```

**Root Cause #2: ProjectId Mismatch**
```typescript
// ❌ FAILING TEST
onMessageHandler!({
  data: {
    action: 'session_start',
    projectId: 'test-project',  // ← Wrong!
  }
});

// Session not updated because message rejected

// Diagnostic test with correct projectId:
onMessageHandler!({
  data: {
    action: 'session_start',
    projectId: 'custom',  // ← Correct!
  }
});

// ✅ All tests passed after fixes
```

**Lesson**: Both issues were test configuration problems, NOT library bugs. Diagnostic tests proved library correctness.

**Reference**: `TEST_INVESTIGATION_REPORT.md` for full investigation details

---

## When to Suspect Library vs Test Issues

### 🔍 Suspect Test Issue When:

1. **Event count is 0**
   - Check: Event type case sensitivity
   - Check: Consent buffer vs main queue
   - Check: Event configuration (disabledEvents)

2. **BroadcastChannel not working**
   - Check: ProjectId value
   - Check: Handler properly captured
   - Check: Async timing

3. **Flaky tests (sometimes pass)**
   - Check: Math.random() mocking
   - Check: Race conditions
   - Check: Test isolation

4. **Worked before, fails now**
   - Check: Recent refactoring
   - Check: Test dependencies updated
   - Check: Shared state between tests

### 🐛 Suspect Library Bug When:

1. **Diagnostic tests also fail**
   - Create minimal reproduction
   - Test with real library (not mocks)
   - Check library source code

2. **Behavior differs from documentation**
   - Check CLAUDE.md expectations
   - Check source code comments
   - Verify intended design

3. **Multiple unrelated tests fail**
   - Core manager broken
   - State management issue
   - Integration problem

4. **E2E tests fail but unit tests pass**
   - Browser-specific issue
   - TestBridge vs real library divergence
   - Timing or async issue

### 🧪 Diagnostic Test Approach

**Always create diagnostic tests before filing bug reports**:

1. **Minimal reproduction**
   ```typescript
   it('minimal reproduction of issue', async () => {
     const bridge = await initTestBridge();
     // Absolute minimum code to reproduce
     bridge.event('test', {});
     const events = getQueueState(bridge).events;
     console.log('[DIAGNOSTIC]', events);
   });
   ```

2. **Isolate from main test file**
   - Create separate diagnostic file
   - Remove all non-essential code
   - Test one thing at a time

3. **Compare with working example**
   - Find similar test that passes
   - Identify differences
   - Narrow down cause

4. **Check library internals**
   - Read source code
   - Understand expected behavior
   - Verify test assumptions

---

## Quick Reference

### Event Type Values (Always Lowercase)
```typescript
'session_start'  // NOT 'SESSION_START'
'session_end'    // NOT 'SESSION_END'
'custom'         // NOT 'CUSTOM'
'page_view'      // NOT 'PAGE_VIEW'
'click'          // NOT 'CLICK'
'scroll'         // NOT 'SCROLL'
'web_vitals'     // NOT 'WEB_VITALS'
'error'          // NOT 'ERROR'
```

### Default ProjectId Values
```typescript
// Standalone mode (no integrations)
'custom'

// With TraceLog SaaS integration
config.integrations.tracelog.projectId  // From config

// In tests, always use:
projectId: 'custom'  // Unless testing specific integration
```

### Diagnostic Commands
```bash
# Run single test file (replace <filename> with actual test file)
npm run test:integration -- <filename>.test.ts

# Example: Run multi-tab-sync tests
npm run test:integration -- multi-tab-sync.test.ts

# Run with verbose output
npm run test:integration -- <filename>.test.ts --reporter=verbose

# Watch mode for rapid iteration
npm run test:unit:watch
```

---

## Additional Resources

- **TESTING_FUNDAMENTALS.md** - Complete testing guide
- **CLAUDE.md** - Critical testing patterns
- **TEST_INVESTIGATION_REPORT.md** - Real investigation example
- **tests/helpers/** - All test helpers with examples

---

**Last Updated**: January 2025
**Based on**: Multi-tab sync test investigation findings
