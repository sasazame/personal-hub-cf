#!/usr/bin/env bash
set -euo pipefail

# Check for placeholder values in wrangler configurations
command -v rg >/dev/null 2>&1 || {
  echo "ripgrep (rg) is required but not installed." >&2
  exit 1
}

WRANGLER_FILES="apps/backend/wrangler*.toml"
if rg -q "PLACEHOLDER|YOUR_.*_ID" ${WRANGLER_FILES} 2>/dev/null; then
  echo "❌ Unreplaced placeholders found in Wrangler configs:"
  rg -n "PLACEHOLDER|YOUR_.*_ID" ${WRANGLER_FILES}
  exit 1
fi

echo "✅ All configuration placeholders have been replaced"