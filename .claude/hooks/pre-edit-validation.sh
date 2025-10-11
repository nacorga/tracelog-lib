#!/bin/bash
#
# Pre-Edit Validation Hook
# Runs before Edit/Write tool calls to ensure type safety
#

set -e

echo "🔍 Pre-edit validation..."

# Run type check to ensure no existing type errors
if npm run type-check --silent 2>&1 | grep -q "error TS"; then
  echo "❌ Type errors detected. Fix before editing."
  echo "Run: npm run type-check"
  exit 1
fi

echo "✅ Type check passed - safe to proceed with edit"
exit 0
