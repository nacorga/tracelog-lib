# Claude Code Toolkit — tracelog-lib

Quick reference for skills, commands, agents, and hooks available in this repo.

## Skills

No package-level skills. Uses shared monorepo skills from project root:

| Skill                | When to use                                                                                                | Invocation                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------- |
| **review-staged**    | Pre-commit review of staged changes against the shared check-catalog (runs **as** `clean-code-architect`). | `/review-staged`           |
| **review-fullstack** | Full-stack branch review before merge. Validates cross-package coherence.                                  | `/review-fullstack [base]` |
| **sync-types**       | Compare tracelog-api DTOs with tracelog-app interfaces and report mismatches.                              | `/sync-types`              |

## Commands

_(Package-specific commands were removed in cleanup — there is no `.claude/commands/` directory. Use root skills like `/review-staged`, `/review-fullstack`, and `/sync-types`, plus `npm run` scripts for build/test/lint.)_

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
npm run check && npm test   # Lint + format + type-check + tests
git add . && /review-staged # Final quality gate
```

### Test coverage

```bash
npm run test:coverage       # Generate coverage report (target: 90%+ core)
```

### Performance / bundle size

```bash
npm run build:all           # Inspect dist/browser/* sizes (<60KB raw, <20KB gz)
```

### Investigating an issue

Spawn parallel Explore agents via the `Agent` tool, or use `tracelog-specialist` for cross-package synthesis.

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
