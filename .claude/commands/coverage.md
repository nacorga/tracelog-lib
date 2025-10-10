---
description: Generate comprehensive test coverage report and analyze against 90% threshold
allowed-tools: [Bash, Read, Glob]
model: sonnet
---

# Test Coverage Analysis

Generate comprehensive coverage report and analyze results against quality thresholds.

## Generate Coverage

!npm run test:coverage

## Analyze Results

Read coverage summary and provide detailed analysis:

@coverage/coverage-summary.json

## Report Format

Provide analysis in this format:

```
📊 Test Coverage Report - TraceLog Library

=== OVERALL COVERAGE ===

Lines: X.X% [✅ PASS | ⚠️ WARNING | ❌ FAIL]
Statements: X.X%
Branches: X.X%
Functions: X.X%

=== CORE MODULES ===

handlers/: X.X% [✅/⚠️/❌]
managers/: X.X% [✅/⚠️/❌]
utils/: X.X% [✅/⚠️/❌]
listeners/: X.X% [✅/⚠️/❌]

=== FILES BELOW THRESHOLD (<90%) ===

1. src/path/to/file.ts: XX.X%
   Missing Coverage:
   - Lines 45-52: Error handling path
   - Lines 103-110: Edge case validation

   Recommendation: Add tests in tests/unit/path/file-name.test.ts

[If all pass:]
✅ All core modules meet 90% coverage threshold

[If issues:]
⚠️ Action Required:
- X files below 90% threshold
- Estimated Y tests needed
- Priority: [HIGH/MEDIUM/LOW]

=== DETAILED REPORT ===

View full HTML report: coverage/lcov-report/index.html
```

## Thresholds

- **Core files** (handlers/, managers/, utils/): 90%+ required
- **Integration files** (listeners/): 85%+ acceptable
- **Overall project**: 90%+ target

## Additional Analysis

Check for:
- Uncovered error handling paths
- Missing edge case tests
- Untested public API methods
- Missing integration test coverage
