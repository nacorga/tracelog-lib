#!/bin/bash
# Re-inject critical tracelog-lib context after compaction
# Fired by both SessionStart(compact) and PostCompact events

cat <<'CONTEXT'
## Post-Compaction Context Recovery — @tracelog/lib

### Core Principle
Client-first analytics library. Works standalone without backend. Network requests are opt-in.

### Architecture
App (orchestrator) → Managers (StateManager, EventManager, SessionManager, SenderManager, StorageManager, UserManager, TimeManager) → Handlers (Session, PageView, Click, Scroll, Performance, Error, Viewport)

### Critical Rules
- **Session Inference**: Client sends SESSION_START only. NO SESSION_END. Server infers end.
- **Optimistic Removal**: Queue cleared if ANY integration succeeds. NEVER change to pessimistic.
- **No runtime deps**: Only `web-vitals` allowed.
- **No console.log in production**: Use emitter for debugging. Visibility levels: critical, qa, undefined.
- **State access**: Always use StateManager.set()/get(), never mutate globalState directly.

### Testing
- Unit: Vitest, `tests/unit/`, 90%+ core coverage
- Integration: Vitest, `tests/integration/`, use `bridge.helper.ts`
- E2E: Playwright, `tests/e2e/`, use `page.evaluate()` (never `page.waitForFunction`)
- NEVER use `vi.runAllTimersAsync()` — use `vi.advanceTimersByTimeAsync()`

### Quality Gates (REQUIRED before finishing)
```
npm run fix          # Auto-fix lint/format
npm run type-check   # 0 errors
npm test             # 100% pass rate
```

### Build
- tsup: ESM + CJS bundles
- Vite: Browser bundles (IIFE + ESM)
- `npm run build:all` for complete build
CONTEXT

# Dynamic: show recent activity
if command -v git &>/dev/null && git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  echo ""
  echo "### Recent Activity"
  git log --oneline -5 2>/dev/null | sed 's/^/- /'
  BRANCH=$(git branch --show-current 2>/dev/null)
  [ -n "$BRANCH" ] && echo "Branch: $BRANCH"
  MODIFIED=$(git diff --name-only 2>/dev/null | head -5)
  [ -n "$MODIFIED" ] && echo "Modified:" && echo "$MODIFIED" | sed 's/^/  - /'
fi

exit 0
