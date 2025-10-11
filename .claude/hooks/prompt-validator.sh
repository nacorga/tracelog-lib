#!/bin/bash
#
# User Prompt Submit Hook
# Validates user prompts to prevent unnecessary file creation
#

set -e

# Get the user prompt from arguments (passed by Claude)
PROMPT="${1:-}"

# Check if prompt suggests creating unnecessary documentation files
if echo "$PROMPT" | grep -qi "create.*readme\|create.*\.md\|new.*documentation"; then
  echo ""
  echo "⚠️  Warning: CLAUDE.md Guidelines"
  echo ""
  echo "The project guidelines discourage creating documentation files"
  echo "unless explicitly required by the user."
  echo ""
  echo "From CLAUDE.md:"
  echo "  'NEVER proactively create documentation files (*.md)'"
  echo "  'ALWAYS prefer editing existing files to creating new ones'"
  echo ""
  echo "If the user explicitly requested this, proceed."
  echo "Otherwise, consider if this file is truly necessary."
  echo ""
fi

# Check for potential over-engineering
if echo "$PROMPT" | grep -qi "create.*class\|new.*manager\|new.*handler" && echo "$PROMPT" | grep -qvi "test"; then
  echo ""
  echo "💡 Reminder: Prefer editing existing files"
  echo ""
  echo "Consider if you can achieve the goal by:"
  echo "  - Editing an existing handler/manager"
  echo "  - Adding methods to existing classes"
  echo "  - Refactoring current code"
  echo ""
fi

# Always allow the prompt to continue
exit 0
