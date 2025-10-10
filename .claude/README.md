# TraceLog Library - Claude Development Pipeline

Comprehensive development automation pipeline for the TraceLog analytics library using Claude Code agents, commands, and hooks.

## 📁 Directory Structure

```
.claude/
├── agents/                           # Custom subagents (5 total)
│   ├── feature-orchestrator.md       # 🎯 Interactive feature development manager
│   ├── test-guardian.md              # Test coverage enforcer (90%+ requirement)
│   ├── type-safety-enforcer.md       # TypeScript strict mode guardian
│   ├── memory-leak-detector.md       # Browser memory leak analyzer
│   └── security-privacy-advisor.md   # GDPR/privacy compliance checker
├── commands/                         # Custom slash commands (6 total)
│   ├── new-feature.md                # 🎯 Start interactive feature development
│   ├── precommit.md                  # Full acceptance criteria validation
│   ├── coverage.md                   # Test coverage analysis
│   ├── perf.md                       # Bundle size & performance check
│   ├── security-audit.md             # Security & privacy audit
│   └── fix.md                        # Auto-fix lint/format issues
├── hooks/                            # Development lifecycle hooks (4 total)
│   ├── pre-edit-validation.sh        # Validate types before editing
│   ├── post-edit-tests.sh            # Run related tests after edits
│   ├── session-start.sh              # Display project status on start
│   └── prompt-validator.sh           # Prevent unnecessary file creation
├── settings.json                     # Hooks configuration
├── settings.local.json               # Enhanced permissions
└── README.md                         # This file
```

---

## 🤖 Custom Subagents

Specialized AI assistants for different development tasks.

### 🎯 **feature-orchestrator** ⭐ NEW!

**Purpose**: Interactive project manager for complete feature development from idea to production-ready code

**When to use**: Starting ANY new feature implementation

**Invocation**:
```bash
/new-feature [brief description]
```

**OR**:
```
Claude, use the feature-orchestrator agent to implement [feature]
```

**What it does**:
1. **Requirements Gathering** - Asks 15-20 clarifying questions about:
   - Feature scope & boundaries
   - Configuration & API design
   - Events & data capture
   - Integration approach
   - Testing strategy
   - Performance & memory considerations

2. **Architecture Planning** - Proposes:
   - File structure (new files + updates)
   - Technical decisions with rationale
   - Similar existing code to reference
   - Privacy/security considerations
   - Memory management strategy

3. **Task Breakdown** - Creates detailed plan with TodoWrite:
   - 8-12 tasks typically
   - Progress tracking throughout
   - Time estimates

4. **Automated Implementation** - Coordinates:
   - Uses all specialized agents (test, type, memory, security)
   - Runs commands automatically (/coverage, /precommit, /perf)
   - Updates todos in real-time

5. **Quality Validation** - Enforces:
   - ✅ Build succeeds (all bundles)
   - ✅ 0 type errors
   - ✅ 0 lint errors
   - ✅ All tests pass
   - ✅ 90%+ coverage for new code
   - ✅ No memory leaks
   - ✅ No security/privacy issues

6. **Completion Summary** - Provides:
   - Statistics (files created/updated, tests added)
   - Quality gates report
   - Suggested conventional commit message
   - Usage example
   - Next steps

**Example Session**:
```
You: /new-feature viewport visibility tracking

Agent: 📋 Feature Orchestrator - Gathering Requirements

❓ How should elements be selected for tracking?
   a) CSS selectors from config
   b) Data attributes
   c) Both

❓ When should visibility be tracked?
   a) Any part visible
   b) X% visible (configurable)
   [... more questions ...]

You: [answer questions]

Agent: ✅ Architecture Plan
       Files to create: 5
       Files to update: 3
       [detailed plan]
       Proceed? (yes/no)

You: yes

Agent: 🚀 Implementation [10 tasks]
       ▶️  Task 1/10: Create types
       ✅ Task 1 complete!
       [... continues ...]

       ✅ COMPLETE! Coverage: 96%, 0 errors
       Commit message: "feat: add viewport tracking..."
```

**Time Savings**: 40-50% faster than manual workflow (1.5-2hrs → 45-60min)

**Quality Improvement**:
- Fewer missed edge cases
- Better test coverage
- Consistent architecture
- No manual validation needed

---

### 1. **test-guardian**

**Purpose**: Enforce 90%+ test coverage for core logic

**When to use**: After adding new features or modifying core code

**Invocation**:
```
Claude, use the test-guardian agent to analyze test coverage
```

**What it does**:
- Runs `npm run test:coverage`
- Analyzes coverage against 90% threshold
- Identifies uncovered code paths
- Suggests specific test files to create
- Validates E2E tests use `__traceLogBridge`

**Quality Gates**:
- ✅ handlers/: 95%+ coverage required
- ✅ managers/: 95%+ coverage required
- ✅ utils/: 90%+ coverage required
- ✅ All tests passing (unit + integration + E2E)

---

### 2. **type-safety-enforcer**

**Purpose**: Maintain zero TypeScript errors with strict mode

**When to use**: Before committing code changes

**Invocation**:
```
Claude, use the type-safety-enforcer agent to check types
```

**What it does**:
- Runs `npm run type-check`
- Validates all 15 strict TypeScript flags
- Provides specific fixes for type errors
- Ensures declaration files build correctly

**Strict Flags Enforced**:
- `strict`, `noImplicitAny`, `strictNullChecks`
- `noUncheckedIndexedAccess`, `noUnusedLocals`
- `noImplicitReturns`, and 9 more

**Acceptance**: **Zero type errors** (warnings OK)

---

### 3. **memory-leak-detector**

**Purpose**: Detect memory leaks in browser environment

**When to use**: When creating/modifying event handlers or managers

**Invocation**:
```
Claude, use the memory-leak-detector agent to check for leaks
```

**What it does**:
- Analyzes event listener cleanup
- Verifies `stopTracking()` implementations
- Checks for orphaned timers/intervals
- Validates circular reference handling
- Ensures cleanup tests exist

**Critical Checks**:
- ✅ Every `addEventListener` has matching `removeEventListener`
- ✅ All timers (`setTimeout`/`setInterval`) are cleared
- ✅ Handlers implement proper `stopTracking()` method
- ✅ No anonymous event listeners (can't be removed)

---

### 4. **security-privacy-advisor**

**Purpose**: GDPR/privacy compliance based on `SECURITY.md`

**When to use**: Before releasing to production, especially e-commerce

**Invocation**:
```
Claude, use the security-privacy-advisor agent to run audit
```

**What it does**:
- Scans for PII leaks in click tracking
- Validates sensitive query parameter filtering
- Checks consent management implementation
- Verifies Google Analytics conditional loading
- Provides compliance status against GDPR requirements

**References**: `SECURITY.md` for security and privacy guidelines

**Phase 1 (Critical - Before E-commerce)**:
1. ❌ Consent Management (#1)
2. ❌ Click Data Protection (#2)
3. ⚠️  URL Params Default (#3)
4. ❌ GA Conditional Loading (#5)

---

## 🔧 Custom Slash Commands

Quick commands for common development tasks.

### 🎯 **/new-feature [description]** ⭐ NEW!

**Start interactive feature development workflow**

```bash
/new-feature viewport visibility tracking
/new-feature consent management system
/new-feature custom event metadata validation
```

**What it does**:
Launches the **feature-orchestrator** agent which guides you through:

1. **Requirements Gathering** (Interactive Q&A)
   - Scope & boundaries
   - Configuration design
   - Events & data capture
   - Integration approach
   - Testing strategy
   - Performance considerations

2. **Architecture Planning**
   - Proposes file structure
   - Explains technical decisions
   - Identifies concerns

3. **Automated Implementation**
   - Creates 8-12 tasks with TodoWrite
   - Implements each task sequentially
   - Coordinates all specialized agents
   - Runs validation commands automatically

4. **Quality Validation**
   - Enforces ALL acceptance criteria
   - 90%+ coverage, 0 errors, all tests pass
   - No memory leaks, no security issues

5. **Completion Summary**
   - Statistics & quality report
   - Generated conventional commit message
   - Usage example
   - Next steps

**Benefits**:
- 40-50% faster than manual workflow
- No missed requirements or edge cases
- Automated quality enforcement
- Consistent architecture patterns

**Example Output**:
```
✅ FEATURE COMPLETE!

Files Created: 5
Tests Added: 24
Coverage: 96.1%
Quality Gates: All Passed ✅

Commit message: "feat: add viewport tracking..."
```

**When to use**: Starting ANY new feature (handlers, managers, integrations, etc.)

---

### 1. **/precommit**

**Full acceptance criteria validation before commit**

```bash
/precommit
```

**Runs**:
1. `npm run check` (lint + format)
2. `npm run type-check` (TypeScript)
3. `npm run build:all` (all bundles)
4. `npm run test:unit` (unit tests)
5. `npm run test:integration` (integration tests)
6. `npm run test:e2e` (E2E tests)

**Output**: Summary report with pass/fail status for each check

**Acceptance**: ✅ All checks must pass (zero errors)

---

### 2. **/coverage**

**Generate and analyze test coverage report**

```bash
/coverage
```

**Runs**: `npm run test:coverage`

**Provides**:
- Overall coverage percentage
- Per-module breakdown (handlers, managers, utils)
- Files below 90% threshold
- Specific uncovered lines
- Recommendations for missing tests

**Target**: 90%+ for core modules

---

### 3. **/perf**

**Analyze bundle size and performance impact**

```bash
/perf
```

**Analyzes**:
- ESM bundle size (target: <50KB)
- CJS bundle size
- Browser bundle size (target: <60KB)
- Gzipped size (target: <20KB)
- Runtime dependencies (only `web-vitals` allowed)

**Performance Budget**:
- ✅ Browser bundle: <60KB uncompressed
- ✅ Gzipped: <20KB (target: ~15KB)
- ✅ Single runtime dependency

---

### 4. **/security-audit**

**Comprehensive security and privacy audit**

```bash
/security-audit
```

**Scans**:
- PII patterns in click tracking
- Sensitive query parameter handling
- Consent management implementation
- localStorage security
- Google Analytics loading

**References**: `SECURITY.md` priorities

**Output**:
- Critical issues (🔴)
- High priority (🟠)
- Compliance status (Phase 1/2/3)
- Recommendations with time estimates

---

### 5. **/fix**

**Auto-fix all lint and format issues**

```bash
/fix
```

**Runs**:
1. `npm run fix` (lint + format auto-fix)
2. `npm run check` (verification)

**Fixes**:
- Unused imports/variables
- Incorrect spacing/indentation
- Quote style
- Missing semicolons
- Import order

---

## 🪝 Development Hooks

Automated validations and checks during development.

### 1. **PreToolUse** (Edit/Write)

**Trigger**: Before any file edit or write

**Hook**: `.claude/hooks/pre-edit-validation.sh`

**What it does**:
- Runs `npm run type-check`
- Blocks edits if type errors exist
- Ensures clean baseline before changes

**Why**: Prevents introducing type errors on top of existing errors

---

### 2. **PostToolUse** (Edit)

**Trigger**: After file edits

**Hook**: `.claude/hooks/post-edit-tests.sh`

**What it does**:
- Determines affected module (handlers/managers/utils)
- Runs related test suite automatically
- Provides immediate feedback

**Why**: Catch regressions early

---

### 3. **SessionStart**

**Trigger**: When Claude Code session starts

**Hook**: `.claude/hooks/session-start.sh`

**What it does**:
- Displays git branch and last commit
- Runs quick health check (types, lint, build)
- Shows available quick commands
- Sets development context

**Output Example**:
```
═══════════════════════════════════════════════
  📊 TraceLog Library - Development Session
═══════════════════════════════════════════════

📂 Branch: main
📝 Last Commit: feat: add scroll retry mechanism

🔍 Quick Health Check:

  ✅ Types: OK
  ✅ Lint: OK
  ✅ Build: Artifacts present

✅ Project is healthy - Ready to code!

═══════════════════════════════════════════════
  💡 Quick Commands:
     /precommit     - Run full validation
     /coverage      - Check test coverage
     /security-audit - Run security scan
     /fix           - Auto-fix code issues
═══════════════════════════════════════════════
```

---

### 4. **UserPromptSubmit**

**Trigger**: When user submits a prompt

**Hook**: `.claude/hooks/prompt-validator.sh`

**What it does**:
- Checks for potential unnecessary file creation
- Warns about CLAUDE.md guidelines
- Reminds to prefer editing over creating

**Example Warning**:
```
⚠️  Warning: CLAUDE.md Guidelines

The project guidelines discourage creating documentation files
unless explicitly required by the user.

From CLAUDE.md:
  'NEVER proactively create documentation files (*.md)'
  'ALWAYS prefer editing existing files to creating new ones'
```

---

## 📋 Permissions Configuration

Enhanced permissions in `.claude/settings.local.json` allow automated operations.

### Allowed Without Prompts

**Build & Quality**:
- `npm run build:*`
- `npm run type-check:*`
- `npm run lint:*`
- `npm run fix:*`
- `npm run check:*`

**Testing**:
- `npm run test:*`
- `npm run test:coverage:*`
- `npx vitest run:*`
- `npx playwright:*`

**Git (Read-only)**:
- `git status`
- `git log:*`
- `git diff:*`
- `git branch:*`
- `git describe:*`

**File Access**:
- `Read(./coverage/**)`
- `Read(./dist/**)`
- `Read(./package.json)`
- `Read(./SECURITY.md)`

### Requires Confirmation

**Destructive Git Operations**:
- `git commit:*`
- `git push:*`
- `git add:*`
- `git tag:*`

**Publishing**:
- `npm publish:*`

---

## 🚀 Development Workflow

### Starting a Session

1. **Session Start Hook** automatically runs:
   - Shows git status
   - Runs health check
   - Displays quick commands

2. **Review Status**:
   - Check for type/lint errors
   - Note recent commits

### Making Changes

1. **Before Edit**:
   - Pre-edit validation hook runs
   - Type check ensures clean baseline

2. **After Edit**:
   - Post-edit hook runs related tests
   - Immediate feedback on changes

### Before Committing

```bash
/precommit
```

**Validates**:
- ✅ Build succeeds
- ✅ Types pass (0 errors)
- ✅ Lint passes (0 errors)
- ✅ All tests pass

### Running Security Audit

```bash
/security-audit
```

**OR**:
```
Claude, use the security-privacy-advisor agent to audit security
```

**Reviews**:
- GDPR compliance status
- PII leak risks
- Consent management
- Phase 1 readiness for e-commerce

---

## 🎯 Acceptance Criteria

From `CLAUDE.md`, all code changes MUST meet:

1. ✅ **No build errors** (`npm run build:all`)
2. ✅ **No type errors** (`npm run type-check`)
3. ✅ **No lint errors** (`npm run lint`)
4. ✅ **100% test pass rate** (unit + integration + E2E)
5. ✅ **90%+ coverage** for core logic (handlers, managers, utils)

**Use `/precommit` to validate all criteria**

---

## 📚 Examples

### Example 1: Adding a New Feature

```bash
# 1. Start session (hook shows status automatically)

# 2. Make changes to handler
# Pre-edit hook validates types ✅
# Post-edit hook runs handler tests ✅

# 3. Check coverage
/coverage

# Output: "scroll.handler.ts: 87% ❌ (below 90%)"
# Add missing tests...

# 4. Validate before commit
/precommit

# Output: ✅ All checks pass

# 5. Commit changes
git add .
git commit -m "feat: add scroll retry mechanism"
```

### Example 2: Security Audit

```bash
# Run security audit
/security-audit

# Output:
# 🔴 CRITICAL - Issue #1: Consent Management
#    Status: ❌ Not Implemented
#    Legal Risk: Critical (€20M fines)
#
# 🔴 CRITICAL - Issue #2: Click Data Protection
#    Status: ⚠️ Partial
#    Risk: High (PII exposure)
#
# Compliance: ❌ Not ready for e-commerce
# Blocker Count: 4
```

---

## 🛠️ Troubleshooting

### Hook Not Running

1. **Check permissions**:
   ```bash
   ls -l .claude/hooks/*.sh
   # Should show -rwxr-xr-x (executable)
   ```

2. **Make executable**:
   ```bash
   chmod +x .claude/hooks/*.sh
   ```

3. **Verify hook config** in `.claude/settings.json`

### Type Check Failing in Hook

If pre-edit hook blocks with type errors:

```bash
npm run type-check
```

Fix errors, then retry edit.

### Tests Slow After Edits

Post-edit hook runs tests automatically. To disable temporarily:

1. Comment out `PostToolUse` section in `.claude/settings.json`
2. Re-enable after intensive editing session

---

## 📖 Related Documentation

- **Project Guidelines**: `CLAUDE.md` (project root)
- **Security Priorities**: `SECURITY.md`
- **Handler Documentation**: `src/handlers/README.md`
- **Manager Documentation**: `src/managers/README.md`
- **Listener Documentation**: `src/listeners/README.md`

---

## 🎉 Benefits

This Claude pipeline provides:

1. **Automated Quality Enforcement**: No manual validation needed
2. **Specialized Expertise**: Dedicated agents for testing, security, types
3. **Fast Feedback**: Hooks catch issues immediately
4. **Security Focus**: GDPR compliance built into workflow
5. **Memory Safety**: Browser leak detection for long-running code

**Result**: Ship faster with higher confidence 🚀

---

**Last Updated**: 2025-10-09
**Version**: 1.0.0
**Maintained By**: TraceLog Development Team
