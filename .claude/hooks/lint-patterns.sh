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
