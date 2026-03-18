#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENCORD_DIR="$PROJECT_ROOT/vendor/Vencord"
PLUGIN_DEST="$VENCORD_DIR/src/userplugins/favouritesPanel"

# Plugin source files (exclude non-plugin directories)
PLUGIN_FILES=(
    index.tsx
    store.ts
    state.ts
    utils.ts
    style.css
    components
)

echo "==> Initializing submodule..."
cd "$PROJECT_ROOT"
git submodule update --init --recursive

echo "==> Installing Vencord dependencies..."
cd "$VENCORD_DIR"
COREPACK_INTEGRITY_KEYS=0 pnpm install

echo "==> Copying plugin into Vencord userplugins..."
mkdir -p "$PLUGIN_DEST"
rm -rf "$PLUGIN_DEST"/*

for file in "${PLUGIN_FILES[@]}"; do
    cp -r "$PROJECT_ROOT/$file" "$PLUGIN_DEST/$file"
done

echo "==> Building Vencord..."
COREPACK_INTEGRITY_KEYS=0 pnpm build

echo "==> Build complete!"
