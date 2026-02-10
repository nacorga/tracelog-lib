#!/bin/bash
#
# Stop Hook: Final Quality Check
#
# Only runs if code changes were made during the session (marker from mark-changes.sh).
# Uses a separate marker to run only once per session (no infinite loop).
#

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')

CHANGES_MARKER="/tmp/claude-has-changes-${SESSION_ID}"
RAN_MARKER="/tmp/claude-quality-check-${SESSION_ID}"

# No code changes this session — skip
[[ ! -f "$CHANGES_MARKER" ]] && exit 0

# Already ran this session — allow stop
[[ -f "$RAN_MARKER" ]] && exit 0

touch "$RAN_MARKER"

cat >&2 <<'EOF'
BEFORE finishing, do a final quality check. Review EVERYTHING you changed in this conversation and answer these questions honestly:

1. **Completeness**: Did I implement everything the user asked for? Any missing pieces?
2. **Loose ends**: Are there any TODOs, placeholder values, hardcoded strings, or incomplete logic left behind?
3. **Imports & dependencies**: Are all imports correct? Did I add any new dependencies that need installing?
4. **Consistency**: Does the new code follow existing patterns in the codebase? (naming, structure, error handling)
5. **Side effects**: Could my changes break anything else? Any callers, tests, or downstream consumers affected?
6. **Dead code**: Did I leave any unused imports, variables, or commented-out code?
7. **Production-ready**: Is this code clean and ready to deploy? No debug logs, no console.log, no temporary hacks?

If ALL checks pass, summarize what was done and confirm it's production-ready.
If ANY check fails, fix the issues before stopping — do NOT just list them.
EOF

exit 2
