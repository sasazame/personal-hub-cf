#!/bin/bash

# Check for placeholder values in wrangler configurations
if rg -q "PLACEHOLDER|YOUR_.*_ID" apps/backend/wrangler*.toml; then
  echo "Error: Found unreplaced placeholder in Wrangler configs:"
  rg "PLACEHOLDER|YOUR_.*_ID" apps/backend/wrangler*.toml
  exit 1
fi

echo "✅ All configuration placeholders have been replaced"