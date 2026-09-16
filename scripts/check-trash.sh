#!/usr/bin/env bash
set -euo pipefail
if command -v trash >/dev/null 2>&1; then
  echo "ok: trash CLI found: $(command -v trash)"
else
  echo "warn: no trash CLI; plan AppleScript fallback"
fi
