#!/bin/bash
#
# Post-Edit Test Hook
# Runs related tests after code changes
#

set -e

# Get the edited file path from arguments
FILE="${1:-}"

if [ -z "$FILE" ]; then
  echo "⚠️  No file specified, skipping tests"
  exit 0
fi

echo "🧪 Running tests for $FILE..."

# Determine which tests to run based on file path
if [[ $FILE == *"handlers"* ]]; then
  echo "Running handler tests..."
  npm run test:unit -- handlers --run 2>/dev/null || true
elif [[ $FILE == *"managers"* ]]; then
  echo "Running manager tests..."
  npm run test:unit -- managers --run 2>/dev/null || true
elif [[ $FILE == *"utils"* ]]; then
  echo "Running utils tests..."
  npm run test:unit -- utils --run 2>/dev/null || true
else
  echo "Running all unit tests..."
  npm run test:unit --silent 2>/dev/null || true
fi

echo "✅ Tests completed"
exit 0
