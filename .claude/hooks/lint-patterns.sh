#!/bin/bash
#
# PostToolUse Hook: Pixel Integrity Enforcement (tracelog-lib / Shopify Web Pixel)
#
# Scoped to src/pixel/** ONLY. This is where the Shopify pixel maps merchant
# checkout/cart data into the forwarded analytics payload (event-mapper.ts) —
# the real PII/revenue surface that the thin tracelog-shopify-app wrapper
# delegates to. The substantive integrity rules therefore live here, not in the
# shopify-app repo.
#
# Rules live in .claude/rules/check-rules.json at the monorepo root — the
# machine-readable half of .claude/rules/check-catalog.md (no console.*, no
# backend dependency import, no PII identifier in the payload). This script does
# not restate them; it loads the tracelog-lib rules and executes them. Add or
# change a rule THERE, never here.
#
# Intentionally NOT enforced (review-only): "value/cart_total set without a
# currency" — value and currency are set on separate lines (buildMetadata), so a
# per-line grep can't correlate them without false positives. Stays a WARN row in
# the tracelog-lib section of check-catalog.md.
#

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

# Exit if no file path
[[ -z "$FILE_PATH" ]] && exit 0

# ─── Internal task/audit reference guard (cross-package; see .claude/rules/check-catalog.md) ───
# Code comments/test-names AND technical docs describe BEHAVIOR — never the task/audit that
# produced it. Ephemeral IDs (WP3, P0-1, audit Finding 6, task 12, §N, ui-big-bang, DA-5,
# D-PA2, TS-7, parenthesized short codes (A4)/(D1/D2)) leak internal process and rot.
# Docs use the full pattern; code drops standalone "task N"/"Finding N" (they collide with
# test data and the product's own "finding" term).
# Cite external RFCs as "section N", not "§N". See memory no-task-refs-in-page-docs.
# (Runs for ALL lib src/tests/docs; the pixel-specific checks below stay scoped to src/pixel.)
_IREFS_DOCS='WP[0-9]|WP-[A-Z]|(^|[^A-Za-z0-9])P[0-9]-[0-9]|A-P[0-9]-[0-9]|DA-[0-9]|D-PA[0-9]|TS-[0-9]|§[0-9]|ui-big-bang|[Tt]asks?[[:space:]]+[0-9]|Finding[[:space:]]+[0-9]|enmienda|injerto|[Aa]udit[[:space:]]+(Finding|backlog|flagged)|\([A-Z]{1,3}[0-9]{1,2}(/[A-Z]{1,3}[0-9]{1,2})*\)'
_IREFS_CODE='WP[0-9]|WP-[A-Z]|(^|[^A-Za-z0-9])P[0-9]-[0-9]|A-P[0-9]-[0-9]|DA-[0-9]|D-PA[0-9]|TS-[0-9]|§[0-9]|ui-big-bang|enmienda|injerto|[Aa]udit[[:space:]]+(Finding|backlog|flagged)|\([A-Z]{1,3}[0-9]{1,2}(/[A-Z]{1,3}[0-9]{1,2})*\)|(^|[^A-Za-z0-9])TRA-[0-9]'
_iref_report() {
  {
    echo ""
    echo "INTERNAL TASK/AUDIT REFERENCE in $(basename "$FILE_PATH"):"
    echo "$1" | sed 's/^/  /'
    echo ""
    echo "  Describe behavior, not the task/audit that produced it. Remove ephemeral IDs"
    echo "  (WP3, P0-1, audit Finding N, task 12, §N, ui-big-bang, D-PA*, DA-*, TS-*,"
    echo "  short codes like (A4)/(D1/D2)). Cite RFCs as 'section N'."
    echo "  See .claude/rules/check-catalog.md + memory no-task-refs-in-page-docs."
    echo ""
  } >&2
}
if [[ "$FILE_PATH" == */docs/*.md ]]; then
  _IREF_HITS=$(grep -nE "$_IREFS_DOCS" "$FILE_PATH" 2>/dev/null | head -10)
  [[ -n "$_IREF_HITS" ]] && { _iref_report "$_IREF_HITS"; exit 2; }
fi
if [[ ( "$FILE_PATH" == */src/* || "$FILE_PATH" == */test/* || "$FILE_PATH" == */tests/* ) && "$FILE_PATH" == *.ts ]]; then
  _IREF_HITS=$(grep -nE "$_IREFS_CODE" "$FILE_PATH" 2>/dev/null | head -10)
  [[ -n "$_IREF_HITS" ]] && { _iref_report "$_IREF_HITS"; exit 2; }
fi

# Scope: pixel TypeScript only (this is the redirect target).
[[ "$FILE_PATH" != *.ts ]] && exit 0
[[ "$FILE_PATH" != *src/pixel/* ]] && exit 0

# Skip test and spec files
[[ "$FILE_PATH" == *".spec.ts" ]] && exit 0
[[ "$FILE_PATH" == *".test.ts" ]] && exit 0

# ─── Rule runner ───
# Patterns live in .claude/rules/check-rules.json at the monorepo root. See the
# tracelog-api hook for the resolution contract and the base64 field transport.

ERRORS=""

RULES_FILE="$CLAUDE_PROJECT_DIR/../.claude/rules/check-rules.json"
[[ -f "$RULES_FILE" ]] || RULES_FILE="$CLAUDE_PROJECT_DIR/.claude/rules/check-rules.json"
RULE_RUNNER="${RULES_FILE%/rules/check-rules.json}/hooks/lib/rule-runner.sh"

if [[ -f "$RULES_FILE" && -f "$RULE_RUNNER" ]]; then
  PKG="tracelog-lib"
  # shellcheck source=/dev/null
  . "$RULE_RUNNER"
  run_rules_for_package
else
  # Announce the gap instead of staying silent: no enforcement must not read
  # like clean enforcement. Expected in a standalone package clone.
  echo "lint-patterns: shared rules/runner unreachable — pattern enforcement is OFF for this edit." >&2
fi

if [[ -n "$ERRORS" ]]; then
  {
    echo ""
    echo "PIXEL INTEGRITY VIOLATION in $(basename "$FILE_PATH"):"
    echo -e "$ERRORS"
    echo "   Fix these before continuing. Rules: .claude/rules/check-rules.json"
    echo ""
  } >&2
  exit 2
fi

exit 0
