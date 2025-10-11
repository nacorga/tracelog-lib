---
description: Compare current branch with another branch and audit all changes for errors, vulnerabilities, and opportunities
allowed-tools: [Bash, Read, Grep, Glob]
model: claude-sonnet-4-5
---

# Branch Comparison & Audit

Interactive branch comparison tool that analyzes all changes between branches and performs comprehensive quality, security, and performance audits before merging.

## User Interaction

**IMPORTANT**: Always ask the user which branch to compare against:

```
Which branch do you want to compare against?
(Press Enter for 'main', or type branch name)

Available branches:
- main (default)
- develop
- [other recent branches]

Your choice: _
```

Store user's choice in variable `TARGET_BRANCH` (default: `main`)

## Step 1: Branch Information

!git branch --show-current

!git log ${TARGET_BRANCH}..HEAD --oneline --no-decorate | head -10

!git diff ${TARGET_BRANCH}...HEAD --stat

## Step 2: Changed Files Analysis

Get all changed files with categorization:

!git diff ${TARGET_BRANCH}...HEAD --name-status

Categorize files by type:
- **Core Logic**: `src/handlers/`, `src/managers/`, `src/listeners/`
- **Types**: `src/types/`, `*.d.ts`
- **Configuration**: `src/constants/`, `src/config/`
- **Utils**: `src/utils/`
- **Tests**: `src/**/*.test.ts`, `src/**/*.spec.ts`, `tests/`
- **Build**: `package.json`, `tsconfig.json`, `vite.config.ts`
- **Documentation**: `*.md`, `docs/`

## Step 3: Code Diff Review

For each modified file, show the actual changes:

!git diff ${TARGET_BRANCH}...HEAD

**Focus Areas**:
- API signature changes (breaking changes)
- Type modifications
- New dependencies
- Configuration changes
- Security-sensitive code (data capture, sanitization)

## Step 4: Quality Audit

### 4.1 Build Validation

!npm run build:all

**Check**: Does it build successfully with changes?

### 4.2 Type Safety

!npm run type-check

**Check**: Any new type errors introduced?

### 4.3 Lint Validation

!npm run lint

**Check**: Code style compliance?

## Step 5: Security Scan

### 5.1 PII Detection

Search for potential PII capture in changed files:

!git diff ${TARGET_BRANCH}...HEAD | grep -E "(textContent|innerText|\.value|password|email|phone)" || echo "No PII patterns found"

### 5.2 Sensitive Data Patterns

!git diff ${TARGET_BRANCH}...HEAD | grep -E "(localStorage|sessionStorage|cookie|token|apiKey)" || echo "No storage patterns found"

### 5.3 External Dependencies

Check if new dependencies were added:

!git diff ${TARGET_BRANCH}...HEAD package.json | grep "^\+" | grep -v "^+++" || echo "No new dependencies"

### 5.4 Security-Sensitive Files

Check changes in critical security files:

!git diff ${TARGET_BRANCH}...HEAD src/utils/security/ 2>/dev/null || echo "No security utils changes"

!git diff ${TARGET_BRANCH}...HEAD src/constants/config.constants.ts 2>/dev/null || echo "No config changes"

## Step 6: Testing Analysis

### 6.1 Test Files Modified/Added

!git diff ${TARGET_BRANCH}...HEAD --name-only | grep -E "\.test\.|\.spec\.|tests/" || echo "No test files modified"

### 6.2 Coverage Check

Run tests and check coverage:

!npm run test:coverage 2>&1 | tail -20

**Analyze**:
- Are new files tested?
- Coverage >= 90% for core logic?
- Do all tests pass?

### 6.3 Missing Tests

Identify modified code files without corresponding test changes:

!bash -c 'MODIFIED=$(git diff ${TARGET_BRANCH}...HEAD --name-only | grep "src/" | grep -v ".test.ts" | grep -v ".spec.ts"); TEST_MODIFIED=$(git diff ${TARGET_BRANCH}...HEAD --name-only | grep -E "\.test\.|\.spec\."); for file in $MODIFIED; do basename="${file%.ts}"; if ! echo "$TEST_MODIFIED" | grep -q "$basename"; then echo "⚠️  Missing test update: $file"; fi; done'

## Step 7: Performance Impact

### 7.1 Bundle Size Impact

!bash -c 'ls -lh dist/browser/*.js 2>/dev/null | awk "{print \$5, \$9}" || echo "Build dist/ to check size"'

!bash -c 'gzip -c dist/browser/*.js 2>/dev/null | wc -c | awk "{printf \"Gzipped: %.2f KB\\n\", \$1/1024}" || echo "N/A"'

### 7.2 Memory Management Review

Check for event listener additions without cleanup:

!git diff ${TARGET_BRANCH}...HEAD | grep "addEventListener" | wc -l

!git diff ${TARGET_BRANCH}...HEAD | grep "removeEventListener" | wc -l

**Validate**: addEventListener count should match removeEventListener count

### 7.3 New Timers/Intervals

!git diff ${TARGET_BRANCH}...HEAD | grep -E "(setTimeout|setInterval)" || echo "No new timers"

## Step 8: Breaking Changes Detection

### 8.1 Public API Changes

Check for changes in public-facing types and interfaces:

!git diff ${TARGET_BRANCH}...HEAD src/types/ 2>/dev/null || echo "No type changes"

### 8.2 Configuration Changes

!git diff ${TARGET_BRANCH}...HEAD src/constants/config.constants.ts 2>/dev/null || echo "No config changes"

### 8.3 Event Type Changes

!git diff ${TARGET_BRANCH}...HEAD | grep -E "(EventType|EventData)" || echo "No event type changes"

## Step 9: Documentation Review

Check if documentation is updated for changes:

!git diff ${TARGET_BRANCH}...HEAD --name-only | grep "\.md$" || echo "⚠️  No documentation updates"

**Required docs for**:
- New features → Update README.md or docs/
- API changes → Update type docs
- Security changes → Update SECURITY.md
- Breaking changes → Update CHANGELOG.md

## Report Format

```
═══════════════════════════════════════════════════════════
  🔍 BRANCH COMPARISON AUDIT
═══════════════════════════════════════════════════════════

📊 COMPARISON SUMMARY

Current Branch:  ${CURRENT_BRANCH}
Target Branch:   ${TARGET_BRANCH}
Commits Ahead:   X commits
Files Changed:   X files (Y additions, Z deletions)

Recent Commits:
  - commit 1 message
  - commit 2 message
  - [...]

───────────────────────────────────────────────────────────
  📁 FILE CHANGES BREAKDOWN
───────────────────────────────────────────────────────────

🔧 Core Logic (X files):
  M  src/handlers/click.handler.ts        (+45, -12)
  A  src/handlers/viewport.handler.ts     (+230)
  M  src/managers/event.manager.ts        (+8, -3)

📘 Types (X files):
  M  src/types/events.types.ts            (+15, -2)

⚙️  Configuration (X files):
  M  src/constants/config.constants.ts    (+5, -1)

🧪 Tests (X files):
  A  tests/e2e/viewport.spec.ts           (+180)
  M  tests/unit/handlers/click.test.ts    (+12, -5)

📝 Documentation (X files):
  M  README.md                            (+25, -3)

───────────────────────────────────────────────────────────
  ✅ QUALITY AUDIT
───────────────────────────────────────────────────────────

Build Status:     [✅ PASSED | ❌ FAILED]
  ESM Bundle:     ✅ Success
  CJS Bundle:     ✅ Success
  Browser Bundle: ✅ Success

Type Check:       [✅ PASSED | ❌ FAILED]
  Errors:         X (0 expected)
  Warnings:       Y (acceptable)

Lint Check:       [✅ PASSED | ❌ FAILED]
  Errors:         X (0 expected)
  Warnings:       Y (acceptable)

Tests:            [✅ PASSED | ❌ FAILED]
  Unit:           X/Y passed
  Integration:    X/Y passed
  E2E:            X/Y passed
  Coverage:       XX% (threshold: 90%)

───────────────────────────────────────────────────────────
  🔒 SECURITY AUDIT
───────────────────────────────────────────────────────────

PII Detection:    [✅ SAFE | ⚠️ REVIEW | 🔴 ISSUE]
  [If issues found:]
  🔴 Line 45 in click.handler.ts: Uses textContent
     Risk: May capture sensitive user input
     Action: Add sanitization or use data-tlog-ignore

Storage Usage:    [✅ SAFE | ⚠️ REVIEW]
  [If changes found:]
  ⚠️  localStorage usage in session.manager.ts
     Review: Ensure no sensitive data stored

Dependencies:     [✅ NONE | ⚠️ NEW]
  [If new deps:]
  🔴 New dependency: 'package-name@version'
     Review: Only 'web-vitals' allowed as runtime dep
     Action: Remove or move to devDependencies

Sensitive Files:  [✅ UNCHANGED | ⚠️ MODIFIED]
  [If modified:]
  ⚠️  src/utils/security/sanitize.utils.ts modified
     Review: Security-sensitive code changed
     Lines: +15, -3

───────────────────────────────────────────────────────────
  🧪 TESTING AUDIT
───────────────────────────────────────────────────────────

Test Coverage:    [✅ ADEQUATE | ⚠️ GAPS | 🔴 MISSING]

New Files Tested: X/Y files (YY%)
  ✅ viewport.handler.ts → viewport.spec.ts exists
  🔴 new-feature.ts → NO TESTS FOUND

Modified Files:   X/Y with test updates (YY%)
  ✅ click.handler.ts → tests updated
  ⚠️  event.manager.ts → tests NOT updated
     Action: Update tests/unit/managers/event.test.ts

Coverage by Module:
  handlers/:  XX% [✅ >=90% | ⚠️ <90% | 🔴 <80%]
  managers/:  XX% [✅ >=90% | ⚠️ <90% | 🔴 <80%]
  utils/:     XX% [✅ >=90% | ⚠️ <90% | 🔴 <80%]

Missing Tests:
  🔴 src/handlers/new-feature.handler.ts
     Action: Create tests/unit/handlers/new-feature.test.ts
     Required: Unit tests + Integration tests

───────────────────────────────────────────────────────────
  ⚡ PERFORMANCE IMPACT
───────────────────────────────────────────────────────────

Bundle Size:      [✅ WITHIN | ⚠️ NEAR | 🔴 OVER] budget
  Browser:        XX.X KB [budget: 60KB]
  Gzipped:        XX.X KB [budget: 20KB]
  Change:         +X.X KB from ${TARGET_BRANCH}

Memory Patterns:  [✅ SAFE | ⚠️ REVIEW]
  addEventListener:    X additions
  removeEventListener: Y additions
  [✅ Balanced | ⚠️ Unbalanced (potential leak)]

  Timers/Intervals:   X new
  [If found:]
  ⚠️  New setTimeout at line 123
     Review: Ensure cleanup in stopTracking()

───────────────────────────────────────────────────────────
  🚨 BREAKING CHANGES
───────────────────────────────────────────────────────────

API Changes:      [✅ NONE | ⚠️ DETECTED | 🔴 BREAKING]

[If detected:]
⚠️  Public API Modified:
  File: src/types/events.types.ts
  Change: Added required field 'viewport' to ClickEventData
  Impact: BREAKING - Existing integrations may fail
  Migration: Add viewport: null for backwards compatibility

🔴 Configuration Changed:
  File: src/constants/config.constants.ts
  Change: DEFAULT_SESSION_TIMEOUT reduced to 10min
  Impact: BREAKING - User sessions expire faster
  Migration: Document in CHANGELOG.md

✅ Event Types:
  No breaking changes to EventType enum

───────────────────────────────────────────────────────────
  📚 DOCUMENTATION REVIEW
───────────────────────────────────────────────────────────

Documentation:    [✅ UPDATED | ⚠️ PARTIAL | 🔴 MISSING]

[If issues:]
🔴 Missing Documentation:
  - New feature 'viewport tracking' not documented
    Action: Update README.md with usage example

⚠️  Outdated Documentation:
  - CHANGELOG.md not updated with changes
    Action: Add entry for version X.Y.Z

✅ Security Docs:
  SECURITY.md updated appropriately

───────────────────────────────────────────────────────────
  🎯 RISK ASSESSMENT
───────────────────────────────────────────────────────────

Critical Issues (🔴):  X
  [List each critical issue]
  1. New runtime dependency violates guidelines
  2. Missing tests for new handler (90% coverage requirement)
  3. Breaking API change without documentation

High Priority (🟠):    Y
  [List each high priority issue]
  1. Memory leak potential in new event listener
  2. PII capture risk in click handler
  3. Bundle size increased by 8KB (approaching limit)

Medium Priority (🟡):  Z
  [List each medium priority issue]
  1. Outdated CHANGELOG.md
  2. No integration tests for new feature

Low Priority (🟢):     W
  [List each low priority issue]
  1. Minor code style inconsistencies (auto-fixable)

───────────────────────────────────────────────────────────
  📊 MERGE READINESS SCORE
───────────────────────────────────────────────────────────

Overall Score: XX/100 [✅ READY | ⚠️ NEEDS WORK | 🔴 NOT READY]

Quality Gates:
  ✅ Build:           PASSED
  ✅ Types:           PASSED (0 errors)
  ✅ Lint:            PASSED (0 errors)
  ✅ Tests:           PASSED (100% pass rate)
  🔴 Coverage:        FAILED (85% < 90%)
  ✅ Security:        PASSED
  🔴 Breaking:        DETECTED (undocumented)
  ⚠️  Docs:           PARTIAL

Blocking Issues: X (MUST FIX before merge)
Non-Blocking:    Y (Can be addressed post-merge)

───────────────────────────────────────────────────────────
  ✅ ACTIONABLE RECOMMENDATIONS
───────────────────────────────────────────────────────────

🚫 BLOCKERS (Must fix before merge):

  1. Add Tests for New Handler
     File: tests/unit/handlers/new-feature.test.ts
     Action: Create comprehensive test suite
     Coverage Target: 90%+
     Time Estimate: 1-2 hours

  2. Remove Runtime Dependency
     File: package.json
     Action: Remove 'package-name' or move to devDependencies
     Reason: Only 'web-vitals' allowed as runtime dependency
     Time Estimate: 30 minutes

  3. Document Breaking Changes
     File: CHANGELOG.md, README.md
     Action: Add migration guide for API changes
     Time Estimate: 30 minutes

⚠️  RECOMMENDED (Should fix):

  1. Fix Memory Leak Potential
     File: src/handlers/new-feature.handler.ts:123
     Action: Add cleanup in stopTracking() method
     Time Estimate: 15 minutes

  2. Review PII Capture
     File: src/handlers/click.handler.ts:45
     Action: Add sanitization or document why safe
     Time Estimate: 20 minutes

  3. Update Integration Tests
     File: tests/integration/
     Action: Add tests for new feature interactions
     Time Estimate: 45 minutes

💡 OPTIONAL (Nice to have):

  1. Run /fix for Code Style
     Action: npm run fix
     Time Estimate: 2 minutes

  2. Optimize Bundle Size
     File: src/handlers/new-feature.handler.ts
     Action: Review imports and tree-shaking
     Time Estimate: 30 minutes

───────────────────────────────────────────────────────────
  🏁 MERGE DECISION
───────────────────────────────────────────────────────────

[✅ READY TO MERGE | ⚠️ NEEDS WORK | 🔴 DO NOT MERGE]

Status: 🔴 DO NOT MERGE

Reason: X blocking issues must be resolved

Estimated Time to Ready: 2-3 hours

Next Steps:
  1. Fix blocking issue #1 (tests)
  2. Fix blocking issue #2 (dependency)
  3. Fix blocking issue #3 (docs)
  4. Re-run /compare-branch to verify
  5. Run /precommit for final validation
  6. Merge when all checks pass

───────────────────────────────────────────────────────────

Alternative Commands:
  /precommit       - Run full validation
  /security-audit  - Deep security scan
  /coverage        - Detailed coverage analysis
  /fix             - Auto-fix code style issues

═══════════════════════════════════════════════════════════
```

## Merge Decision Criteria

### ✅ READY TO MERGE (Score: 85-100)
- All acceptance criteria met
- 0 blocking issues
- <=2 high priority issues
- All quality gates passed
- Documentation updated

### ⚠️ NEEDS WORK (Score: 60-84)
- 1-2 blocking issues (fixable quickly)
- 3-5 high priority issues
- Some quality gates failed
- Minor documentation gaps

### 🔴 DO NOT MERGE (Score: <60)
- 3+ blocking issues
- Critical security/PII issues
- Breaking changes undocumented
- Test coverage < 80%
- Multiple quality gates failed

## Focus Areas

Prioritize in this order:

1. **Security Issues** - PII leaks, sensitive data exposure
2. **Breaking Changes** - API modifications, type changes
3. **Test Coverage** - New code must be tested (90%+)
4. **Build/Type Errors** - Must pass to merge
5. **Memory Leaks** - Event listeners, timers without cleanup
6. **Bundle Size** - Keep under limits
7. **Documentation** - Keep in sync with code
8. **Code Style** - Auto-fixable, lowest priority

## Summary Output

Always end with clear, actionable summary:

```
═══════════════════════════════════════════════════════════
  📋 AUDIT SUMMARY
═══════════════════════════════════════════════════════════

Comparison: ${CURRENT_BRANCH} → ${TARGET_BRANCH}
Files Changed: X
Commits Ahead: Y

Score: XX/100 - [✅ READY | ⚠️ NEEDS WORK | 🔴 NOT READY]

Blocking Issues:     X (MUST FIX)
High Priority:       Y (SHOULD FIX)
Medium Priority:     Z (NICE TO HAVE)
Low Priority:        W (OPTIONAL)

Time to Ready: X hours (if needs work)

Next Action: [Specific command or fix to run]

═══════════════════════════════════════════════════════════
```
