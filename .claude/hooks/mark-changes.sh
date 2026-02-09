#!/bin/bash
#
# PostToolUse Hook: Mark that code changes were made
#
# Creates a session-scoped marker file whenever Write/Edit is used.
# Other hooks (e.g. Stop) can check this marker to decide whether to run.
#

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')

touch "/tmp/claude-has-changes-${SESSION_ID}"

exit 0
