#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENCORD_DIR="$PROJECT_ROOT/vendor/Vencord"

# Build first
"$SCRIPT_DIR/build.sh"

echo "==> Injecting Vencord into Discord..."
cd "$VENCORD_DIR"
COREPACK_INTEGRITY_KEYS=0 pnpm inject

echo "==> Done! Restart Discord to see changes."
