#!/bin/bash
#
# Session Start Hook
# Displays project status at the beginning of Claude Code session
#

set -e

echo ""
echo "═══════════════════════════════════════════════"
echo "  📊 TraceLog Library - Development Session"
echo "═══════════════════════════════════════════════"
echo ""

# Git information
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "No commits")

echo "📂 Branch: $BRANCH"
echo "📝 Last Commit: $LAST_COMMIT"
echo ""

# Quick health check
echo "🔍 Quick Health Check:"
echo ""

# Type check
if npm run type-check --silent 2>&1 | grep -q "error TS"; then
  echo "  ❌ Types: ERRORS DETECTED"
  TYPE_STATUS=1
else
  echo "  ✅ Types: OK"
  TYPE_STATUS=0
fi

# Lint check
if npm run lint --silent 2>&1 | grep -q "error"; then
  echo "  ❌ Lint: ERRORS DETECTED"
  LINT_STATUS=1
else
  echo "  ✅ Lint: OK"
  LINT_STATUS=0
fi

# Build check (quick check for dist folder)
if [ -d "dist/esm" ] && [ -d "dist/cjs" ] && [ -d "dist/browser" ]; then
  echo "  ✅ Build: Artifacts present"
  BUILD_STATUS=0
else
  echo "  ⚠️  Build: Run 'npm run build:all'"
  BUILD_STATUS=1
fi

echo ""

# Summary
if [ $TYPE_STATUS -eq 0 ] && [ $LINT_STATUS -eq 0 ]; then
  echo "✅ Project is healthy - Ready to code!"
else
  echo "⚠️  Action Required: Fix type/lint errors before proceeding"
  echo "   Run: /fix to auto-fix issues"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  💡 Quick Commands:"
echo "     /precommit     - Run full validation"
echo "     /coverage      - Check test coverage"
echo "     /security-audit - Run security scan"
echo "     /fix           - Auto-fix code issues"
echo "═══════════════════════════════════════════════"
echo ""

exit 0
