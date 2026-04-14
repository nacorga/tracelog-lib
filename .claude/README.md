# Claude Code Toolkit — tracelog-lib

Quick reference for skills, commands, agents, and hooks available in this repo.

## Skills

No package-level skills. Uses shared monorepo skills from project root:

| Skill                | When to use                                                                               | Invocation                 |
| -------------------- | ----------------------------------------------------------------------------------------- | -------------------------- |
| **review-staged**    | Pre-commit review of staged changes. Runs `clean-code-architect` + `tracelog-specialist`. | `/review-staged`           |
| **review-fullstack** | Full-stack branch review before merge. Validates cross-package coherence.                 | `/review-fullstack [base]` |
| **sync-types**       | Compare tracelog-api DTOs with tracelog-app interfaces and report mismatches.             | `/sync-types`              |

## Commands

Defined in `.claude/commands/`. Invocable via `/slash-command`.

| Command                     | Purpose                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/precommit`                | Full acceptance criteria validation: lint, type-check, build, unit/integration/E2E tests. All must pass (0 errors).                                                |
| `/coverage`                 | Generate and analyze test coverage report. Target: 90%+ for core modules.                                                                                          |
| `/perf`                     | Analyze bundle size and performance impact. Budget: browser bundle <60KB, gzipped <20KB.                                                                           |
| `/security-audit`           | Scan for PII leaks, sensitive query params, consent management, localStorage security. References `SECURITY.md`.                                                   |
| `/compare-branch [branch]`  | Pre-merge audit: change analysis, quality audit, security scan, testing analysis, performance impact, breaking changes, docs review. Scores merge readiness 0-100. |
| `/fix`                      | Auto-fix all lint and format issues (`npm run fix` + verification).                                                                                                |
| `/research-team <scenario>` | Deep research with 3 agents investigating in parallel.                                                                                                             |

## Agents

No package-level agents in tracelog-lib. Uses shared agents:

| Agent                    | Scope                                     | Role                                                                              |
| ------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------- |
| **tracelog-specialist**  | Project root (`tracelog/.claude/agents/`) | Cross-package expert. Full-stack changes, session system, type sync, AI features. |
| **clean-code-architect** | User-global (`~/.claude/agents/`)         | Universal code quality: KISS, DRY, SOLID, readability, naming, comments policy.   |

## Hooks

Configured in `settings.json` / `settings.local.json`.

| Hook                           | Script               | What it does                                                                                     |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------ |
| `PostToolUse` (Edit/Write)     | `mark-changes.sh`    | Marks that code changes occurred in this session (used by `quality-check.sh`).                   |
| `Stop`                         | `quality-check.sh`   | If changes were made, forces final quality check before stopping (runs `npm run check` + tests). |
| `SessionStart` / `PostCompact` | `compact-context.sh` | Re-injects library context after session start or compaction.                                    |

## Typical Workflow

### Before commit

```bash
/precommit      # Full validation: lint + type-check + build + tests
```

### Test coverage check

```bash
/coverage       # Generate coverage report with per-module breakdown
```

### Performance check

```bash
/perf           # Bundle size + runtime dependencies
```

### Security audit

```bash
/security-audit # PII scan, consent, localStorage security
```

### Pre-merge audit

```bash
/compare-branch [target]   # Defaults to main. Scores merge readiness 0-100.
```

### Investigating an issue

```bash
/research-team <problem>   # 3 agents in parallel
```

## Permissions

Enhanced permissions in `.claude/settings.local.json` allow common operations without prompts:

- `npm run build/test/lint/fix/check`, `npx tsc/eslint/jest/vitest/playwright`
- Read: `coverage/`, `dist/`, `package.json`, `SECURITY.md`
- Requires confirmation: `git commit/push/add/tag`, `npm publish`

## Related Documentation

- `CLAUDE.md` — Library guidelines (root of package)
- `SECURITY.md` — Privacy and PII policy
- `README.md` — Public library documentation
- `tests/TESTING_FUNDAMENTALS.md` — Complete testing guide
