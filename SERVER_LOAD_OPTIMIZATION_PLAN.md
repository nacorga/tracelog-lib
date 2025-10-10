# TraceLog Server Load Optimization Plan

## Executive Summary

This document outlines a phased implementation plan to address server load concerns identified in the comprehensive event type audit. The proposed changes will reduce server load by **75-80%** while maintaining data quality and accuracy.

**Current State**: Potential for 10-15M events/month (100K users)
**Target State**: 2-3M events/month with same user base
**Estimated Impact**: 75-80% reduction in server load

---

## Audit Findings Summary

| Event Type | Risk Level | Primary Issue | Estimated Reduction |
|------------|-----------|---------------|---------------------|
| **WEB_VITALS** | 🔴 CRITICAL | Missing `reportAllChanges: false` | 70-90% |
| **CUSTOM** | 🔴 CRITICAL | No infinite loop protection | Unlimited → Controlled |
| **VIEWPORT** | 🟡 MEDIUM-HIGH | No cooldown between re-triggers | 75% |
| **PAGE_VIEW** | 🟡 MEDIUM | No throttling on rapid navigation | 50-60% |
| **CLICK** | 🟡 MEDIUM | Weak deduplication | 30-40% |
| **SCROLL** | ✅ LOW | Already excellent protection | N/A |
| **SESSION** | ✅ LOW | Very robust | N/A |
| **ERROR** | ✅ LOW-MEDIUM | Good with minor gaps | 10-20% |
| **Queue/Batch** | 🟡 MEDIUM | No dynamic flush | Prevents data loss |

---

## Phase 1: Critical Fixes (Immediate - 1 Day)

**Goal**: Address the highest-impact issues with minimal code changes
**Timeline**: 1 working day
**Effort**: ~4-6 hours
**Expected Impact**: 60-70% server load reduction

### 1.1 Fix WEB_VITALS `reportAllChanges`

**Priority**: 🔴 CRITICAL
**File**: `src/handlers/performance.handler.ts`
**Lines**: 132-136
**Effort**: 5 minutes
**Impact**: 70-90% reduction in WEB_VITALS events

#### Current Code
```typescript
onLCP(report('LCP'));
onCLS(report('CLS'));
onFCP(report('FCP'));
onTTFB(report('TTFB'));
onINP(report('INP'));
```

#### Updated Code
```typescript
onLCP(report('LCP'), { reportAllChanges: false });
onCLS(report('CLS'), { reportAllChanges: false });
onFCP(report('FCP'), { reportAllChanges: false });
onTTFB(report('TTFB'), { reportAllChanges: false });
onINP(report('INP'), { reportAllChanges: false });
```

#### Testing Requirements
- ✅ Verify CLS sends only once per navigation (not on every layout shift)
- ✅ Verify INP sends only final worst interaction
- ✅ Verify LCP sends only final largest contentful paint
- ✅ Add E2E test: `web-vitals-report-final-only.spec.ts`

#### Success Metrics
- CLS events: ~50 per page → **1-2 per page**
- INP events: ~10-20 per page → **1 per page**
- Total WEB_VITALS: **70-90% reduction**

---

### 1.2 Enable Dynamic Queue Flush

**Priority**: 🔴 HIGH
**File**: `src/managers/event.manager.ts`
**Lines**: 374-402
**Effort**: 15 minutes
**Impact**: Prevents data loss during high-activity periods

#### Current Behavior
- Events only sent every 10 seconds (timer-based)
- Queue maxes at 100 events → overflow drops oldest events
- `BATCH_SIZE_THRESHOLD = 50` exists but **unused**

#### Implementation
```typescript
private addToQueue(event: EventData): void {
  this.eventsQueue.push(event);
  this.emitEvent(event);

  // Handle overflow
  if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
    const nonCriticalIndex = this.eventsQueue.findIndex(
      (e) => e.type !== EventType.SESSION_START && e.type !== EventType.SESSION_END,
    );
    const removedEvent = nonCriticalIndex >= 0
      ? this.eventsQueue.splice(nonCriticalIndex, 1)[0]
      : this.eventsQueue.shift();

    log('warn', 'Event queue overflow, oldest non-critical event removed', {
      data: {
        maxLength: MAX_EVENTS_QUEUE_LENGTH,
        currentLength: this.eventsQueue.length,
        removedEventType: removedEvent?.type,
      },
    });
  }

  // ✅ NEW: Dynamic flush when batch threshold reached
  if (this.eventsQueue.length >= BATCH_SIZE_THRESHOLD) {
    void this.sendEventsQueue();
  }

  // Start interval if not already running
  if (!this.sendIntervalId) {
    this.startSendInterval();
  }

  this.handleGoogleAnalyticsIntegration(event);
}
```

#### Testing Requirements
- ✅ Add unit test: Queue flushes at 50 events (not waiting for 10s timer)
- ✅ Verify no data loss during rapid event generation (100 events in 2s)

#### Success Metrics
- Zero event loss during high activity
- Reduced latency: Events sent within 5s instead of up to 10s

---

### 1.3 Add PAGE_VIEW Throttling

**Priority**: 🔴 HIGH
**File**: `src/handlers/page-view.handler.ts`
**Lines**: 58-79
**Effort**: 30 minutes
**Impact**: 50-60% reduction in PAGE_VIEW spam (SPAs)

#### Current Behavior
- PAGE_VIEW fires immediately on every navigation (pushState, popstate, hashchange)
- No throttling → rapid navigation sends all events
- Example: User navigates 20 times in 5 seconds → 20 events

#### Implementation
```typescript
export class PageViewHandler extends StateManager {
  private lastPageViewTime = 0;
  private readonly PAGE_VIEW_THROTTLE_MS = 1000; // 1 second

  private readonly trackCurrentPage = (): void => {
    const now = Date.now();
    const rawUrl = window.location.href;
    const normalizedUrl = normalizeUrl(rawUrl, this.get('config').sensitiveQueryParams);

    // Existing: URL-based deduplication
    if (this.get('pageUrl') === normalizedUrl) {
      return;
    }

    // ✅ NEW: Throttle rapid navigation
    if (now - this.lastPageViewTime < this.PAGE_VIEW_THROTTLE_MS) {
      log('debug', 'PAGE_VIEW throttled - navigation too rapid', {
        data: {
          timeSinceLastView: now - this.lastPageViewTime,
          throttleMs: this.PAGE_VIEW_THROTTLE_MS
        }
      });
      return;
    }

    this.lastPageViewTime = now;

    // ... existing implementation
    this.set('pageUrl', normalizedUrl);
    const pageViewData = this.getPageViewData(normalizedUrl);
    this.eventManager.track({ type: EventType.PAGE_VIEW, page_view: pageViewData });
  };
}
```

#### Configuration Option (Optional)
```typescript
// In src/types/config.types.ts
export interface Config {
  // ... existing fields
  pageViewThrottleMs?: number; // Default: 1000ms
}
```

#### Testing Requirements
- ✅ Add E2E test: Rapid navigation (10 routes in 5s) → Max 5 events
- ✅ Verify normal navigation still works (1 event per route after 1s delay)
- ✅ Test hash navigation throttling

#### Success Metrics
- Rapid SPA navigation: 20 events → **5-10 events**
- Zero impact on normal browsing patterns

---

### Phase 1 Summary

**Total Effort**: 4-6 hours
**Files Changed**: 3
**New Tests Required**: 3 E2E tests
**Expected Server Load Reduction**: **60-70%**

**Deployment Checklist**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] New E2E tests added and passing
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Documentation updated (CHANGELOG.md)
- [ ] Version bump (0.4.1 → 0.4.2)

---

## Phase 2: High Priority Fixes (Short-term - 1 Week)

**Goal**: Add protection against infinite loops and repeated triggers
**Timeline**: 1 week (1-2 days active work)
**Effort**: ~10-15 hours
**Expected Impact**: Additional 10-15% server load reduction + robustness

### 2.1 Implement Per-Event-Name Rate Limiting (CUSTOM)

**Priority**: 🔴 CRITICAL
**File**: `src/managers/event.manager.ts`
**Lines**: Add after line 27 (class properties)
**Effort**: 2-3 hours
**Impact**: Prevents infinite loops in user code

#### Problem
```javascript
// User code bug - infinite loop
function trackAction() {
  tracelog.event('action', { timestamp: Date.now() });
  trackAction(); // ❌ Sends 200 events/sec indefinitely
}
trackAction();
```

#### Implementation
```typescript
export class EventManager extends StateManager {
  // ... existing properties

  // ✅ NEW: Per-event-name rate limiting
  private eventRateLimits = new Map<string, { count: number; windowStart: number }>();
  private readonly MAX_SAME_EVENT_PER_MINUTE = 60; // Configurable

  private checkEventSpecificRateLimit(eventName: string): boolean {
    const now = Date.now();
    const key = eventName;
    const limit = this.eventRateLimits.get(key);

    // Reset window if expired
    if (!limit || now - limit.windowStart > 60000) { // 60 seconds
      this.eventRateLimits.set(key, { count: 1, windowStart: now });
      return true;
    }

    // Check limit
    if (limit.count >= this.MAX_SAME_EVENT_PER_MINUTE) {
      log('warn', 'Per-event rate limit exceeded', {
        data: {
          eventName,
          limit: this.MAX_SAME_EVENT_PER_MINUTE,
          window: '60s'
        }
      });
      return false;
    }

    // Increment counter
    limit.count++;
    return true;
  }

  // Update track() method (line 59)
  track({ type, custom_event, ... }: Partial<EventData>): void {
    // ... existing validation

    // ✅ NEW: Check per-event-name limit for CUSTOM events
    if (type === EventType.CUSTOM && custom_event?.name) {
      if (!this.checkEventSpecificRateLimit(custom_event.name)) {
        return; // Drop event
      }
    }

    // ... rest of existing logic
  }

  // Cleanup old entries periodically
  private pruneEventRateLimits(): void {
    const now = Date.now();
    for (const [key, limit] of this.eventRateLimits.entries()) {
      if (now - limit.windowStart > 60000) {
        this.eventRateLimits.delete(key);
      }
    }
  }
}
```

#### Configuration Option
```typescript
// In src/types/config.types.ts
export interface Config {
  // ... existing fields
  maxSameEventPerMinute?: number; // Default: 60
}
```

#### Constants
```typescript
// In src/constants/config.constants.ts
export const MAX_SAME_EVENT_PER_MINUTE = 60;
```

#### Testing Requirements
- ✅ Unit test: Same event name 100 times → Only 60 tracked
- ✅ E2E test: Infinite loop detection (setTimeout recursive call)
- ✅ Verify different event names not affected

#### Success Metrics
- Infinite loops: Unlimited → **Max 60/minute per event**
- No impact on legitimate diverse custom events

---

### 2.2 Add VIEWPORT Cooldown Period

**Priority**: 🔴 HIGH
**File**: `src/handlers/viewport.handler.ts`
**Lines**: 10-12 (interface), 214-247 (fireViewportEvent)
**Effort**: 1-2 hours
**Impact**: 75% reduction in carousel/sticky element re-triggers

#### Problem
```javascript
// Carousel auto-plays every 2 seconds
viewport: { selectors: ['.carousel-slide'], minDwellTime: 500 }
// Each of 10 slides fires event every time it appears
// Result: 30 events in 1 minute (same content)
```

#### Implementation

**Step 1: Update TrackedElement interface**
```typescript
interface TrackedElement {
  element: Element;
  selector: string;
  id?: string;
  name?: string;
  startTime: number | null;
  timeoutId: number | null;
  lastFiredTimestamp: number | null; // ✅ NEW
  triggerCount: number;                // ✅ NEW (for future max triggers)
}
```

**Step 2: Add cooldown check in fireViewportEvent()**
```typescript
private fireViewportEvent(tracked: TrackedElement, visibilityRatio: number): void {
  if (tracked.startTime === null) {
    return;
  }

  const now = performance.now();
  const dwellTime = now - tracked.startTime;
  const minDwellTime = this.config?.minDwellTime ?? DEFAULT_VIEWPORT_MIN_DWELL_TIME;

  if (dwellTime < minDwellTime) {
    return;
  }

  const element = tracked.element as HTMLElement;

  if (element.hasAttribute('data-tlog-ignore')) {
    tracked.startTime = null;
    tracked.timeoutId = null;
    return;
  }

  // ✅ NEW: Cooldown check
  const cooldownPeriod = this.config?.cooldownPeriod ?? 60000; // 60 seconds default
  if (tracked.lastFiredTimestamp !== null) {
    const timeSinceLastFire = now - tracked.lastFiredTimestamp;
    if (timeSinceLastFire < cooldownPeriod) {
      log('debug', 'VIEWPORT event suppressed - cooldown active', {
        data: {
          selector: tracked.selector,
          id: tracked.id,
          timeSinceLastFire: Math.round(timeSinceLastFire),
          cooldownPeriod
        }
      });
      tracked.startTime = null;
      tracked.timeoutId = null;
      return;
    }
  }

  // Fire event
  this.eventManager.track({
    type: EventType.VIEWPORT_VISIBLE,
    viewport_data: {
      selector: tracked.selector,
      id: tracked.id,
      name: tracked.name,
      visibilityRatio: Number(visibilityRatio.toFixed(2)),
      dwellTime: Math.round(dwellTime),
    },
  });

  // ✅ UPDATE: Track last fired timestamp
  tracked.lastFiredTimestamp = now;
  tracked.triggerCount = (tracked.triggerCount || 0) + 1;

  // Reset tracking state
  tracked.startTime = null;
  tracked.timeoutId = null;
}
```

**Step 3: Initialize new fields**
```typescript
private observeElements(): void {
  // ...
  this.trackedElements.set(element, {
    element,
    selector: elementConfig.selector,
    id: elementConfig.id,
    name: elementConfig.name,
    startTime: null,
    timeoutId: null,
    lastFiredTimestamp: null, // ✅ NEW
    triggerCount: 0,           // ✅ NEW
  });
  // ...
}
```

#### Configuration Options
```typescript
// In src/types/viewport.types.ts
export interface ViewportConfig {
  selectors?: string[];
  elements?: ViewportElement[];
  threshold?: number;
  minDwellTime?: number;
  cooldownPeriod?: number;      // ✅ NEW: Default 60000ms
  maxTriggersPerElement?: number; // ✅ NEW: Default unlimited (future use)
}
```

#### Constants
```typescript
// In src/constants/config.constants.ts
export const DEFAULT_VIEWPORT_COOLDOWN_PERIOD = 60000; // 60 seconds
export const DEFAULT_VIEWPORT_MAX_TRIGGERS = 0; // 0 = unlimited
```

#### Testing Requirements
- ✅ Unit test: Element re-enters viewport within 60s → No event
- ✅ Unit test: Element re-enters after 60s → Event fires
- ✅ E2E test: Carousel scenario (10 slides, 2 cycles) → Max 10 unique events
- ✅ E2E test: Sticky header scroll bounce → Max 1 event per 60s

#### Success Metrics
- Carousel events: 30 per minute → **10 per minute** (1 per unique slide)
- Sticky elements: 20 per session → **5 per session**

---

### 2.3 Add CLICK Throttling Per Element

**Priority**: 🟡 HIGH
**File**: `src/handlers/click.handler.ts`
**Lines**: Add after line 36 (class properties)
**Effort**: 1-2 hours
**Impact**: 30-40% reduction in click spam

#### Problem
- Double-clicks send 2 events (if coordinates differ >10px)
- Rapid clicking on same button sends multiple events
- Current deduplication only checks coordinates (10px tolerance)

#### Implementation
```typescript
export class ClickHandler extends StateManager {
  // ... existing properties

  // ✅ NEW: Per-element throttling
  private lastClickMap = new Map<string, number>();
  private readonly CLICK_THROTTLE_MS = 300; // 300ms per element

  private getElementSignature(element: HTMLElement): string {
    // Use ID, data-testid, or DOM path
    return (
      element.id ||
      element.getAttribute('data-testid') ||
      element.getAttribute('data-tlog-name') ||
      `${element.tagName}_${this.getElementPath(element)}`
    );
  }

  private getElementPath(element: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      const siblings = current.parentElement?.children || [];
      const index = Array.from(siblings).indexOf(current);
      path.unshift(`${current.tagName}[${index}]`);
      current = current.parentElement;
    }

    return path.join('>');
  }

  private shouldThrottleClick(element: HTMLElement): boolean {
    const signature = this.getElementSignature(element);
    const now = Date.now();
    const lastClick = this.lastClickMap.get(signature);

    if (lastClick && now - lastClick < this.CLICK_THROTTLE_MS) {
      log('debug', 'CLICK throttled - too soon after last click', {
        data: {
          element: signature,
          timeSinceLastClick: now - lastClick,
          throttleMs: this.CLICK_THROTTLE_MS
        }
      });
      return true;
    }

    this.lastClickMap.set(signature, now);
    return false;
  }

  private readonly clickHandler = (event: MouseEvent): void => {
    // ... existing code to find clicked element

    // ✅ NEW: Check throttle before processing
    if (this.shouldThrottleClick(clickedElement)) {
      return;
    }

    // ... rest of existing logic
  };

  stopTracking(): void {
    // ... existing cleanup
    this.lastClickMap.clear(); // ✅ NEW
  }
}
```

#### Configuration Option
```typescript
// In src/types/config.types.ts
export interface Config {
  // ... existing fields
  clickThrottleMs?: number; // Default: 300ms
}
```

#### Testing Requirements
- ✅ Unit test: Double-click on button → Only 1 event
- ✅ Unit test: Click same button after 300ms → 2 events
- ✅ Unit test: Click different buttons rapidly → All tracked
- ✅ E2E test: Rapid form submission clicks → Only 1 event

#### Success Metrics
- Double-clicks: 2 events → **1 event**
- Rapid same-button clicks: Reduced by **60-80%**

---

### Phase 2 Summary

**Total Effort**: 10-15 hours
**Files Changed**: 3
**New Tests Required**: 8 tests (3 unit, 5 E2E)
**Expected Additional Reduction**: **10-15%**

**Deployment Checklist**:
- [ ] All tests pass (unit + integration + E2E)
- [ ] TypeScript strict mode: 0 errors
- [ ] Lint: 0 errors (warnings OK)
- [ ] Documentation updated
- [ ] Version bump (0.4.2 → 0.5.0 - minor version due to new config options)

---

## Phase 3: Medium Priority Improvements (Medium-term - Sprint)

**Goal**: Add session limits, improve deduplication, add safeguards
**Timeline**: 2-3 weeks (5-8 days active work)
**Effort**: ~20-30 hours
**Expected Impact**: Additional 5-10% reduction + robustness

### 3.1 Implement Per-Session Event Caps

**Priority**: 🟡 MEDIUM
**File**: `src/managers/event.manager.ts`
**Effort**: 2-3 hours
**Impact**: Prevents runaway event generation in long sessions

#### Constants
```typescript
// In src/constants/config.constants.ts
export const MAX_EVENTS_PER_SESSION = 1000;
export const MAX_CLICKS_PER_SESSION = 500;
export const MAX_PAGE_VIEWS_PER_SESSION = 100;
export const MAX_CUSTOM_EVENTS_PER_SESSION = 500;
export const MAX_VIEWPORT_EVENTS_PER_SESSION = 200;
// MAX_SCROLL_EVENTS_PER_SESSION = 120 (already exists)
```

#### Implementation
```typescript
export class EventManager extends StateManager {
  private sessionEventCounts = {
    total: 0,
    [EventType.CLICK]: 0,
    [EventType.PAGE_VIEW]: 0,
    [EventType.CUSTOM]: 0,
    [EventType.VIEWPORT_VISIBLE]: 0,
    [EventType.SCROLL]: 0,
  };

  track({ type, ... }: Partial<EventData>): void {
    // ... existing validation

    // ✅ NEW: Check session limits
    const isCritical = type === EventType.SESSION_START || type === EventType.SESSION_END;

    if (!isCritical) {
      // Check total limit
      if (this.sessionEventCounts.total >= MAX_EVENTS_PER_SESSION) {
        log('warn', 'Session event limit reached', {
          data: {
            type,
            total: this.sessionEventCounts.total,
            limit: MAX_EVENTS_PER_SESSION
          }
        });
        return;
      }

      // Check type-specific limits
      const typeLimit = this.getTypeLimitForEvent(type);
      if (typeLimit && this.sessionEventCounts[type] >= typeLimit) {
        log('warn', 'Session event type limit reached', {
          data: {
            type,
            count: this.sessionEventCounts[type],
            limit: typeLimit
          }
        });
        return;
      }
    }

    // ... existing processing

    // ✅ Increment counters
    if (!isCritical) {
      this.sessionEventCounts.total++;
      if (this.sessionEventCounts[type] !== undefined) {
        this.sessionEventCounts[type]++;
      }
    }

    // ... rest of logic
  }

  private getTypeLimitForEvent(type: EventType): number | null {
    const limits = {
      [EventType.CLICK]: MAX_CLICKS_PER_SESSION,
      [EventType.PAGE_VIEW]: MAX_PAGE_VIEWS_PER_SESSION,
      [EventType.CUSTOM]: MAX_CUSTOM_EVENTS_PER_SESSION,
      [EventType.VIEWPORT_VISIBLE]: MAX_VIEWPORT_EVENTS_PER_SESSION,
      [EventType.SCROLL]: MAX_SCROLL_EVENTS_PER_SESSION,
    };
    return limits[type] || null;
  }

  flushPendingEvents(): void {
    // ✅ Reset counters on new session
    this.sessionEventCounts = {
      total: 0,
      [EventType.CLICK]: 0,
      [EventType.PAGE_VIEW]: 0,
      [EventType.CUSTOM]: 0,
      [EventType.VIEWPORT_VISIBLE]: 0,
      [EventType.SCROLL]: 0,
    };

    // ... existing logic
  }
}
```

#### Testing Requirements
- ✅ Unit test: 1001 events in session → 1000 tracked, 1 dropped
- ✅ Unit test: 501 clicks in session → 500 tracked, rest dropped
- ✅ Unit test: SESSION_START/END not counted toward limits

---

### 3.2 Improve Global Deduplication (LRU Cache)

**Priority**: 🟡 MEDIUM
**File**: `src/managers/event.manager.ts`
**Lines**: 329-368
**Effort**: 3-4 hours
**Impact**: Better duplicate detection for interleaved events

#### Current Issue
```javascript
// Current: Only tracks LAST event fingerprint
tracelog.event('buttonA'); // Tracked
tracelog.event('buttonB'); // Tracked (overwrites last fingerprint)
tracelog.event('buttonA'); // ❌ Tracked again (last fingerprint was buttonB)
```

#### Implementation
```typescript
export class EventManager extends StateManager {
  // Replace single fingerprint tracking
  // OLD: private lastEventFingerprint: string | null = null;
  // OLD: private lastEventTime = 0;

  // ✅ NEW: LRU cache for multiple recent events
  private recentEventFingerprints = new Map<string, number>(); // fingerprint → timestamp
  private readonly MAX_FINGERPRINTS = 1000;
  private readonly FINGERPRINT_CLEANUP_MULTIPLIER = 10; // 10x threshold = 5 seconds

  private isDuplicateEvent(event: EventData): boolean {
    const now = Date.now();
    const fingerprint = this.createEventFingerprint(event);

    const lastSeen = this.recentEventFingerprints.get(fingerprint);

    // Check if seen recently
    if (lastSeen && now - lastSeen < DUPLICATE_EVENT_THRESHOLD_MS) {
      this.recentEventFingerprints.set(fingerprint, now); // Update timestamp
      return true; // Duplicate
    }

    // Add to cache
    this.recentEventFingerprints.set(fingerprint, now);

    // Cleanup if cache too large
    if (this.recentEventFingerprints.size > this.MAX_FINGERPRINTS) {
      this.pruneOldFingerprints();
    }

    return false;
  }

  private pruneOldFingerprints(): void {
    const now = Date.now();
    const cutoff = DUPLICATE_EVENT_THRESHOLD_MS * this.FINGERPRINT_CLEANUP_MULTIPLIER; // 5 seconds

    for (const [fingerprint, timestamp] of this.recentEventFingerprints.entries()) {
      if (now - timestamp > cutoff) {
        this.recentEventFingerprints.delete(fingerprint);
      }
    }

    log('debug', 'Pruned old event fingerprints', {
      data: {
        remaining: this.recentEventFingerprints.size,
        cutoffMs: cutoff
      }
    });
  }
}
```

#### Testing Requirements
- ✅ Unit test: A → B → A pattern within 500ms → 2 events (A deduplicated)
- ✅ Unit test: 1000+ unique events → cache doesn't grow unbounded
- ✅ Performance test: Deduplication check stays <1ms with 1000 cached

---

### 3.3 Add VIEWPORT Max Tracked Elements Limit

**Priority**: 🟡 MEDIUM
**File**: `src/handlers/viewport.handler.ts`
**Lines**: 140-173
**Effort**: 1-2 hours
**Impact**: Prevents memory/server issues with broad selectors

#### Problem
```javascript
// Developer uses broad selector
viewport: { selectors: ['div', '.card', 'section'] }
// Could match 500+ elements on page → all tracked
```

#### Implementation
```typescript
export class ViewportHandler extends StateManager {
  private readonly maxTrackedElements: number;

  constructor(eventManager: EventManager, config?: ViewportConfig) {
    super();
    this.eventManager = eventManager;
    this.config = config;
    this.maxTrackedElements = config?.maxTrackedElements ?? 100; // Default: 100
    // ...
  }

  private observeElements(): void {
    if (!this.config || !this.observer) {
      return;
    }

    let totalTracked = 0;

    for (const elementConfig of this.normalizedElements) {
      const elements = document.querySelectorAll(elementConfig.selector);

      for (const element of Array.from(elements)) {
        // ✅ Check max limit
        if (totalTracked >= this.maxTrackedElements) {
          log('warn', 'VIEWPORT: Maximum tracked elements reached', {
            data: {
              limit: this.maxTrackedElements,
              selector: elementConfig.selector,
              message: 'Some elements will not be tracked. Consider more specific selectors.'
            }
          });
          return; // Stop tracking more elements
        }

        // Skip if already tracked
        if (this.trackedElements.has(element)) {
          continue;
        }

        // Track element
        this.trackedElements.set(element, {
          element,
          selector: elementConfig.selector,
          id: elementConfig.id,
          name: elementConfig.name,
          startTime: null,
          timeoutId: null,
          lastFiredTimestamp: null,
          triggerCount: 0,
        });

        this.observer.observe(element);
        totalTracked++;
      }
    }

    log('debug', 'VIEWPORT: Elements tracked', {
      data: { count: totalTracked, limit: this.maxTrackedElements }
    });
  }
}
```

#### Configuration
```typescript
export interface ViewportConfig {
  // ... existing fields
  maxTrackedElements?: number; // Default: 100
}
```

#### Testing Requirements
- ✅ Unit test: 150 elements matching selector → Only 100 tracked
- ✅ E2E test: Warning logged when limit reached

---

### 3.4 Add ERROR Burst Detection

**Priority**: 🟡 MEDIUM
**File**: `src/handlers/error.handler.ts`
**Effort**: 2 hours
**Impact**: Prevents error floods from overwhelming server

#### Implementation
```typescript
export class ErrorHandler extends StateManager {
  // ... existing properties

  // ✅ NEW: Burst detection
  private errorBurstCounter = 0;
  private burstWindowStart = 0;
  private burstBackoffUntil = 0;
  private readonly BURST_WINDOW_MS = 1000; // 1 second
  private readonly BURST_THRESHOLD = 10; // 10 unique errors
  private readonly BURST_BACKOFF_MS = 5000; // 5 seconds cooldown

  private shouldSample(): boolean {
    const now = Date.now();

    // ✅ Check if in backoff period
    if (now < this.burstBackoffUntil) {
      return false;
    }

    // Reset burst counter if window expired
    if (now - this.burstWindowStart > this.BURST_WINDOW_MS) {
      this.errorBurstCounter = 0;
      this.burstWindowStart = now;
    }

    // Increment burst counter
    this.errorBurstCounter++;

    // Trigger backoff if burst threshold exceeded
    if (this.errorBurstCounter > this.BURST_THRESHOLD) {
      this.burstBackoffUntil = now + this.BURST_BACKOFF_MS;
      log('warn', 'Error burst detected - entering cooldown', {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: this.BURST_BACKOFF_MS,
        },
      });
      return false;
    }

    // Normal sampling logic
    const config = this.get('config');
    const samplingRate = config?.errorSampling ?? DEFAULT_ERROR_SAMPLING_RATE;
    return Math.random() < samplingRate;
  }
}
```

#### Testing Requirements
- ✅ Unit test: 11 errors in 1 second → Cooldown triggered
- ✅ Unit test: After 5s cooldown → Errors tracked again

---

### 3.5 Reduce Global Rate Limit

**Priority**: 🟢 LOW
**File**: `src/constants/config.constants.ts`
**Line**: 42
**Effort**: 5 minutes
**Impact**: More conservative default (200 → 50 events/sec)

#### Change
```typescript
// OLD
export const MAX_EVENTS_PER_SECOND = 200;

// NEW
export const MAX_EVENTS_PER_SECOND = 50;
```

#### Rationale
- 200 events/sec = 12,000 events/min (unrealistic for human)
- 50 events/sec = 3,000 events/min (still very generous)
- Scroll already limited to ~2-4 events/sec max
- More conservative default prevents abuse

#### Testing Requirements
- ✅ Update tests that rely on 200/sec limit
- ✅ Verify scroll/click still work normally

---

### 3.6 Validate sendBeacon() Payload Size

**Priority**: 🟢 LOW
**File**: `src/managers/sender.manager.ts`
**Lines**: 175-196
**Effort**: 30 minutes
**Impact**: Prevents silent failures at page unload

#### Implementation
```typescript
private sendQueueSyncInternal(body: BaseEventsQueueDto): boolean {
  const { url, payload } = this.prepareRequest(body);

  // ✅ NEW: Check payload size (64KB browser limit)
  const MAX_BEACON_SIZE = 64 * 1024; // 64KB

  if (payload.length > MAX_BEACON_SIZE) {
    log('warn', 'Payload exceeds sendBeacon limit, persisting for recovery', {
      data: {
        size: payload.length,
        limit: MAX_BEACON_SIZE,
        events: body.events.length,
      },
    });
    this.persistEvents(body);
    return false;
  }

  const blob = new Blob([payload], { type: 'application/json' });

  if (!this.isSendBeaconAvailable()) {
    log('warn', 'sendBeacon not available, persisting events for recovery');
    this.persistEvents(body);
    return false;
  }

  const accepted = navigator.sendBeacon(url, blob);

  if (!accepted) {
    log('warn', 'sendBeacon rejected request, persisting events for recovery');
    this.persistEvents(body);
  }

  return accepted;
}
```

#### Testing Requirements
- ✅ Unit test: Payload >64KB → Persisted instead of sent

---

### Phase 3 Summary

**Total Effort**: 20-30 hours
**Files Changed**: 5
**New Tests Required**: 10 tests
**Expected Additional Reduction**: **5-10%**

---

## Testing Strategy

### Unit Tests (Vitest)
- **Location**: `tests/unit/`
- **Coverage Target**: 90%+ for modified files
- **Focus**: Business logic, edge cases, limits enforcement

### Integration Tests (Vitest)
- **Location**: `tests/integration/`
- **Coverage Target**: All cross-component interactions
- **Focus**: EventManager ↔ Handlers, config propagation

### E2E Tests (Playwright)
- **Location**: `tests/e2e/`
- **Coverage Target**: Real-world scenarios
- **Focus**: Browser behavior, network requests, user flows

### Performance Tests
- **New**: Add performance benchmarks for:
  - Deduplication check speed (<1ms)
  - Queue operations (<1ms)
  - Rate limit checks (<0.1ms)

---

## Monitoring & Validation

### Client-Side Metrics
Add metrics collection for:
```typescript
interface EventMetrics {
  eventsGenerated: number;
  eventsDropped: number;
  dropReasons: {
    rateLimit: number;
    duplicate: number;
    sessionLimit: number;
    throttle: number;
    cooldown: number;
  };
}
```

### Server-Side Validation
- Monitor event volume before/after deployment
- Track event type distribution
- Alert on anomalies (sudden spikes)

### Rollback Plan
- Keep feature flags for each optimization
- Monitor error rates for 48h after deployment
- Rollback triggers:
  - >5% increase in client errors
  - >10% decrease in event volume (over-aggressive filtering)

---

## Documentation Updates

### User-Facing Documentation
- [ ] README.md: Add rate limiting section
- [ ] CHANGELOG.md: Document all changes
- [ ] Migration guide (0.4.x → 0.5.x)

### Developer Documentation
- [ ] Update `src/handlers/README.md` with new constants
- [ ] Add inline JSDoc comments for new methods
- [ ] Update TypeScript types with new config options

### Configuration Examples
```typescript
// Conservative config (low-traffic sites)
tracelog.init({
  samplingRate: 1.0,
  errorSampling: 1.0,
  pageViewThrottleMs: 1000,
  clickThrottleMs: 300,
  maxSameEventPerMinute: 60,
  viewport: {
    cooldownPeriod: 60000,
    maxTrackedElements: 100,
  },
});

// Aggressive config (high-traffic sites)
tracelog.init({
  samplingRate: 0.1, // 10% sampling
  errorSampling: 0.5, // 50% error sampling
  pageViewThrottleMs: 2000,
  clickThrottleMs: 500,
  maxSameEventPerMinute: 30,
  viewport: {
    cooldownPeriod: 120000, // 2 minutes
    maxTrackedElements: 50,
  },
});
```

---

## Version Release Plan

### Phase 1 → v0.4.2 (Patch)
- Bug fixes only (WEB_VITALS, queue flush, PAGE_VIEW throttle)
- No breaking changes
- Release: ASAP

### Phase 2 → v0.5.0 (Minor)
- New config options (backward compatible)
- Feature additions (per-event rate limit, VIEWPORT cooldown, CLICK throttle)
- Release: 1 week after 0.4.2

### Phase 3 → v0.5.1 (Patch)
- Additional safeguards (session limits, improved deduplication)
- No new config options
- Release: 2-3 weeks after 0.5.0

---

## Success Criteria

### Phase 1
- ✅ WEB_VITALS events reduced by 70-90%
- ✅ Zero event loss during high activity
- ✅ PAGE_VIEW spam reduced by 50-60%
- ✅ All tests pass (0 errors)
- ✅ No performance regression (<5ms overhead)

### Phase 2
- ✅ CUSTOM event loops controlled (max 60/min)
- ✅ VIEWPORT re-triggers reduced by 75%
- ✅ CLICK double-clicks eliminated
- ✅ No breaking changes for existing users

### Phase 3
- ✅ Session event limits enforced
- ✅ Deduplication catches interleaved events
- ✅ sendBeacon failures prevented
- ✅ Overall server load: **75-80% reduction**

---

## Risk Assessment

| Phase | Risk Level | Mitigation |
|-------|-----------|------------|
| **Phase 1** | 🟢 LOW | Simple changes, well-tested |
| **Phase 2** | 🟡 MEDIUM | More complex logic, thorough E2E tests required |
| **Phase 3** | 🟡 MEDIUM | Session state management, feature flags for rollback |

---

## Team Effort Estimate

| Role | Phase 1 | Phase 2 | Phase 3 | Total |
|------|---------|---------|---------|-------|
| **Developer** | 4-6h | 10-15h | 20-30h | 34-51h |
| **QA/Testing** | 2h | 4h | 6h | 12h |
| **Code Review** | 1h | 2h | 3h | 6h |
| **Documentation** | 1h | 2h | 2h | 5h |
| **Total** | 8-10h | 18-23h | 31-41h | **57-74h** |

**Timeline**:
- Phase 1: 1-2 days
- Phase 2: 1 week
- Phase 3: 2-3 weeks

**Total Project Duration**: ~4-5 weeks

---

## Appendix: Related Files

### Core Files Modified
- `src/handlers/performance.handler.ts` (Phase 1.1)
- `src/managers/event.manager.ts` (Phase 1.2, 2.1, 3.1, 3.2)
- `src/handlers/page-view.handler.ts` (Phase 1.3)
- `src/handlers/viewport.handler.ts` (Phase 2.2, 3.3)
- `src/handlers/click.handler.ts` (Phase 2.3)
- `src/handlers/error.handler.ts` (Phase 3.4)
- `src/managers/sender.manager.ts` (Phase 3.6)
- `src/constants/config.constants.ts` (All phases)

### Type Definitions Modified
- `src/types/config.types.ts` (All phases)
- `src/types/viewport.types.ts` (Phase 2.2, 3.3)

### Test Files Added/Modified
- `tests/e2e/web-vitals-report-final-only.spec.ts` (new)
- `tests/unit/managers/event-manager-rate-limiting.test.ts` (modified)
- `tests/e2e/viewport-cooldown.spec.ts` (new)
- `tests/e2e/click-throttling.spec.ts` (new)
- Plus 10+ additional test files

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Author**: TraceLog Development Team
**Status**: Ready for Implementation
