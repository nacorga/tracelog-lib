---
description: Start interactive feature development with requirements gathering, architecture planning, and automated implementation
argument-hint: [brief feature description]
allowed-tools: [Task, Read]
model: claude-sonnet-4-5
---

# New Feature Development

Start interactive feature development workflow using the **feature-orchestrator** agent.

This command launches an intelligent project manager that will:
1. Ask clarifying questions about your feature
2. Plan the architecture
3. Break down implementation into tasks
4. Coordinate development with specialized agents
5. Validate quality automatically
6. Prepare commit message

## Usage

```bash
/new-feature viewport visibility tracking
/new-feature custom event metadata validation
/new-feature session replay integration
/new-feature consent management system
```

## Process Overview

The feature-orchestrator agent will guide you through:

### 1. Requirements Gathering (Interactive)
- Scope & boundaries questions
- Configuration & API design
- Events & data capture requirements
- Integration approach
- Testing strategy
- Performance & memory considerations

### 2. Architecture Planning
- Proposes file structure (new files + updates)
- Explains technical decisions
- References similar existing code
- Identifies privacy/security concerns
- Plans memory management strategy

### 3. Task Breakdown
- Creates detailed task list (8-12 tasks typically)
- Uses TodoWrite for progress tracking
- Estimates time required

### 4. Automated Implementation
- Implements each task sequentially
- **ALWAYS updates documentation** (CLAUDE.md requirement)
  - README.md (config, events, examples)
  - CHANGELOG.md (release notes)
  - docs/ (architecture details)
- Uses specialized agents:
  - test-guardian (coverage validation)
  - type-safety-enforcer (type checking)
  - memory-leak-detector (leak prevention)
  - security-privacy-advisor (privacy review)
- Runs commands automatically:
  - /coverage (after tests)
  - /precommit (final validation)
  - /perf (bundle check)

### 5. Quality Validation
- Enforces ALL acceptance criteria:
  - ✅ Build succeeds (all bundles)
  - ✅ 0 type errors
  - ✅ 0 lint errors
  - ✅ All tests pass
  - ✅ 90%+ coverage for new code
  - ✅ No memory leaks
  - ✅ No security/privacy issues

### 6. Completion Summary
- Statistics (files created/updated, tests added)
- Quality gates report
- Suggested conventional commit message
- Usage example for the new feature
- Next steps (commit, release, etc.)

## Example Session

```
You: /new-feature viewport visibility tracking

Agent: 📋 Feature Orchestrator - Gathering Requirements

I'll help you implement viewport visibility tracking.
Let me gather some details:

1. **Feature Scope Questions**:
   ❓ How should elements be selected for tracking?
      a) CSS selectors from config
      b) Data attributes (e.g., data-track-viewport)
      c) Both options

   ❓ When should visibility be tracked?
      a) When element enters viewport (any amount)
      b) When element is X% visible (configurable threshold)
      c) Both enter and exit events

[... more questions ...]

You: a, b with 75% threshold, first time only, selectors + data attrs

Agent: ✅ Requirements Confirmed!

📐 ARCHITECTURE PLAN

**Feature Summary**:
Implement viewport visibility tracking using IntersectionObserver API
with configurable CSS selectors and visibility threshold.

**Files to CREATE**:
- src/handlers/viewport.handler.ts
- src/types/viewport.types.ts
- tests/unit/handlers/viewport-handler.test.ts
- tests/integration/viewport-tracking.integration.test.ts
- tests/e2e/viewport.spec.ts

**Files to UPDATE**:
- src/types/config.types.ts (add viewportSelectors, viewportThreshold)
- src/types/event.types.ts (add VIEWPORT_VISIBLE)
- src/app.ts (register ViewportHandler)

[... detailed plan ...]

Proceed with this architecture? (yes/no)

You: yes

Agent: 🚀 IMPLEMENTATION PLAN

Total Tasks: 10
Estimated Time: 45-60 minutes

Tasks:
1. ⏳ Create viewport.types.ts
2. ⏳ Update config.types.ts
3. ⏳ Update event.types.ts
4. ⏳ Implement ViewportHandler
5. ⏳ Integrate with App
6. ⏳ Write unit tests (target: 90%+)
7. ⏳ Write integration tests
8. ⏳ Write E2E tests
9. ⏳ Update documentation
10. ⏳ Quality validation

Ready to start? (yes/no)

You: yes

Agent: [Implements feature with progress updates]

▶️  Task 1/10: Create viewport.types.ts
✅ Task 1 complete!

▶️  Task 2/10: Update config.types.ts
✅ Task 2 complete!

[... continues through all tasks ...]

Agent: ═══════════════════════════════════════════════

✅ FEATURE IMPLEMENTATION COMPLETE!

📊 Statistics:
- Files Created: 5
- Files Updated: 3
- Tests Added: 24
- Coverage: 96.1% (viewport.handler.ts)

✅ Quality Gates (All Passed):
- Build: ✅
- Types: ✅ (0 errors)
- Lint: ✅ (0 errors)
- Tests: ✅ (192/192)
- Coverage: ✅ (94.3%)
- Memory: ✅ (no leaks)
- Security: ✅ (no PII risks)

📝 Suggested Commit Message:
---
feat: add viewport visibility tracking

- Implement ViewportHandler with IntersectionObserver
- Support configurable selectors and threshold
- Deduplicate visibility events
- Comprehensive test coverage (96.1%)
- Proper cleanup to prevent memory leaks
---

🎯 Next Steps:
1. Review: git diff
2. Commit: git commit -m "[message above]"
3. Optional: /release for new version

═══════════════════════════════════════════════
```

## When to Use

Use `/new-feature` when:
- Starting any new feature development
- Implementing new handlers or managers
- Adding new configuration options
- Creating new event types
- Building integrations

Don't use for:
- Bug fixes (just implement directly)
- Documentation-only changes
- Dependency updates
- Configuration tweaks

## Benefits

Compared to manual development:

| Manual | With /new-feature |
|--------|-------------------|
| Forget requirements | ✅ Comprehensive Q&A |
| Ad-hoc architecture | ✅ Planned structure |
| Manually track progress | ✅ TodoWrite tracking |
| Run checks manually | ✅ Automated validation |
| Coordinate agents yourself | ✅ Auto-coordination |
| Write commit message | ✅ Generated message |
| **Time: 1.5-2 hours** | **Time: 45-60 min** |

## Tips

1. **Be Specific**: More detail in initial description = fewer clarifying questions

   Good: `/new-feature viewport tracking with IntersectionObserver for engagement metrics`
   Basic: `/new-feature viewport tracking`

2. **Answer Thoroughly**: Complete answers to questions save back-and-forth

3. **Review Architecture**: Check the plan before saying "yes" - easier to adjust early

4. **Trust the Process**: The orchestrator follows proven patterns and quality gates

5. **Review Output**: Always review generated code and tests before committing

## Advanced Usage

### Custom Requirements
```
/new-feature [description]

[When asked questions, provide detailed requirements]

[If architecture needs adjustment, say "modify" and explain]
```

### Large Features
For complex features (10+ tasks), the orchestrator will offer phased approach:
- Phase 1: Core implementation
- Phase 2: Testing
- Phase 3: Documentation

### Breaking Changes
If feature requires breaking changes, orchestrator will:
- Warn about impact
- Ensure MAJOR version bump
- Include migration guide
- Update changelog appropriately

## Troubleshooting

### "Agent not responding"
- Ensure you're using Claude Code with agents enabled
- Check `.claude/agents/feature-orchestrator.md` exists

### "Validation fails repeatedly"
- Review specific errors in validation output
- May need manual intervention for complex issues
- Can continue with `/fix` then retry `/precommit`

### "Wrong architecture proposed"
- Answer "modify" when asked to proceed
- Explain specific concerns
- Orchestrator will revise plan

## Related Commands

After feature complete:
- `/precommit` - Revalidate before commit (orchestrator already runs this)
- `/release` - Prepare new release version
- `/coverage` - Deep-dive into coverage details
- `/perf` - Detailed bundle analysis

## Related Agents

The orchestrator uses these agents (no need to call directly):
- **test-guardian** - Coverage enforcement
- **type-safety-enforcer** - Type validation
- **memory-leak-detector** - Leak prevention
- **security-privacy-advisor** - Privacy review
- **release-orchestrator** - (Post-commit) Versioning

---

**Pro tip**: Start every significant feature with `/new-feature` to maintain consistent quality and save development time!
