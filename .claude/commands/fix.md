---
description: Auto-fix all lint and format issues with verification
allowed-tools: [Bash]
model: claude-sonnet-4-5
---

# Auto-Fix Code Quality Issues

Automatically fix lint and format issues across the codebase.

## Run Auto-Fix

!npm run fix

## Verify Fixes

!npm run check
!npm run type-check
!npm run build:all
!npm run test

## Report Format

```
🔧 Auto-Fix Results

=== FIXES APPLIED ===

Lint Fixes:
- Files modified: X
- Issues fixed: Y
- Auto-fix succeeded: [✅/❌]

Format Fixes:
- Files formatted: X
- Formatting applied: [✅/❌]

=== VERIFICATION ===

Running acceptance criteria checks...

Lint Status: [✅ PASSED | ❌ ERRORS REMAIN]
Format Status: [✅ PASSED | ❌ ERRORS REMAIN]
Type Check Status: [✅ PASSED | ❌ ERRORS REMAIN]
Build Status: [✅ PASSED | ❌ ERRORS REMAIN]
Test Status: [✅ PASSED | ❌ ERRORS REMAIN]

[If all passed:]
✅ All acceptance criteria met
✅ Codebase passes all quality checks

[If errors remain:]
⚠️ Remaining Issues:

Manual fixes required:
- [List issues that couldn't be auto-fixed]

Action Required:
- Review remaining issues
- Apply manual fixes
- Re-run /fix command

=== FILES MODIFIED ===

[List of modified files]

=== NEXT STEPS ===

[If passed:]
✅ Ready to commit changes
Run: git add . && git commit -m "chore: fix lint and format issues"

[If errors:]
⚠️ Manual review needed
Fix remaining issues before committing
```

## What Gets Fixed

**Lint (ESLint)**:
- Unused variables/imports
- Missing semicolons
- Incorrect spacing
- Import order
- Prettier conflicts

**Format (Prettier)**:
- Indentation (2 spaces)
- Line length (100 chars)
- Quote style (single quotes)
- Trailing commas
- Bracket spacing

## Notes

- Auto-fix is safe for most issues
- Some issues require manual intervention
- Always review changes before committing
- Re-run verification after manual fixes

## IMPORTANT RESTRICTIONS

**NEVER modify CHANGELOG.md**:
- CHANGELOG.md is automatically updated via CI/CD workflows
- Any changes to CHANGELOG.md will be overwritten
- Do not include CHANGELOG.md in any auto-fix operations
