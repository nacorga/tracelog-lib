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
# Rules (deterministic):
#   1. No console.* — the library is silent in production; use the emitter/log()
#   2. No backend dependency import (@nestjs / mongoose / openai) — lib is standalone
#   3. No PII identifier — the pixel must forward only non-PII analytics fields;
#      a checkout carries email/phone/addresses but the payload must never copy them
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

ERRORS=""

# 1. console.* (library must be silent in production — use the emitter / log())
if grep -qE "console\.(log|warn|error|info|debug)\(" "$FILE_PATH" 2>/dev/null; then
  ERRORS="${ERRORS}\n  - CONSOLE.* in pixel. The library is silent in production — use the emitter / log() with a visibility level."
fi

# 2. Backend dependency import (lib is standalone)
if grep -qE "from[[:space:]]+['\"](@nestjs|mongoose|openai)" "$FILE_PATH" 2>/dev/null; then
  ERRORS="${ERRORS}\n  - BACKEND DEPENDENCY import in pixel. @tracelog/lib must work standalone — no NestJS/Mongoose/OpenAI."
fi

# 3. PII identifier — the pixel must never forward customer PII to ingest.
PII=$(grep -nE "\.email\b|\.phone\b|billingAddress|shippingAddress|\bcustomer\.(email|phone|firstName|lastName|first_name|last_name)|firstName|lastName" "$FILE_PATH" 2>/dev/null)
if [[ -n "$PII" ]]; then
  LINES=$(echo "$PII" | cut -d: -f1 | tr '\n' ' ')
  ERRORS="${ERRORS}\n  - POSSIBLE PII in pixel payload (line(s): ${LINES}). The Shopify pixel must forward only non-PII analytics fields (value, currency, items, counts) — never email/phone/addresses/customer names."
fi

if [[ -n "$ERRORS" ]]; then
  {
    echo ""
    echo "PIXEL INTEGRITY VIOLATION in $(basename "$FILE_PATH"):"
    echo -e "$ERRORS"
    echo "   Fix these before continuing."
    echo ""
  } >&2
  exit 2
fi

exit 0
