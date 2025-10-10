---
description: Run complete acceptance criteria validation (build + types + lint + tests)
allowed-tools: [Bash, Read]
model: sonnet
---

# Pre-Commit Validation

Run comprehensive validation before committing code changes to ensure all acceptance criteria are met.

## Acceptance Criteria (from CLAUDE.md)

1. ✅ No build errors
2. ✅ No type errors
3. ✅ No lint errors
4. ✅ 100% test pass rate

## Validation Process

!npm run check
!npm run type-check
!npm run build:all
!npm run test:unit
!npm run test:integration
!npm run test:e2e

## Summary Report

Provide comprehensive summary:
- Total issues found (errors vs warnings)
- Test results (pass/fail counts)
- Coverage percentage
- Recommendation: SAFE TO COMMIT or FIXES NEEDED

Format output as:
```
🔍 Pre-commit Validation Results:

✅ Lint & Format: [PASSED/FAILED]
✅ TypeScript: [PASSED/FAILED] (X errors)
✅ Build: [PASSED/FAILED] (ESM + CJS + Browser)
✅ Unit Tests: [PASSED/FAILED] (X/Y)
✅ Integration Tests: [PASSED/FAILED] (X/Y)
✅ E2E Tests: [PASSED/FAILED] (X/Y)

📊 Summary:
- X blocking errors
- Y warnings (acceptable)
- Coverage: Z% (threshold: 90%)

[✅ SAFE TO COMMIT | ❌ FIXES REQUIRED]
```
