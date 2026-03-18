#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENCORD_DIR="$PROJECT_ROOT/vendor/Vencord"
RELEASE_DIR="$PROJECT_ROOT/release/discord-favourites-plugin"

# Build first
"$SCRIPT_DIR/build.sh"

echo "==> Packaging release..."

# Clean previous release
rm -rf "$PROJECT_ROOT/release"
mkdir -p "$RELEASE_DIR/dist"

# Copy dist files (no sourcemaps or installer binaries)
cp "$VENCORD_DIR"/dist/patcher.js "$RELEASE_DIR/dist/"
cp "$VENCORD_DIR"/dist/preload.js "$RELEASE_DIR/dist/"
cp "$VENCORD_DIR"/dist/renderer.js "$RELEASE_DIR/dist/"
cp "$VENCORD_DIR"/dist/renderer.css "$RELEASE_DIR/dist/"

# Copy package.json (installer needs it for VENCORD_USER_DATA_DIR)
cp "$VENCORD_DIR/package.json" "$RELEASE_DIR/"

# Copy install scripts
cp "$PROJECT_ROOT/scripts/install-windows.bat" "$RELEASE_DIR/"
cp "$PROJECT_ROOT/scripts/install-mac.sh" "$RELEASE_DIR/"
cp "$PROJECT_ROOT/scripts/install-linux.sh" "$RELEASE_DIR/"
chmod +x "$RELEASE_DIR/install-mac.sh" "$RELEASE_DIR/install-linux.sh"

# Copy README
cp "$PROJECT_ROOT/scripts/INSTALL_README.md" "$RELEASE_DIR/README.md"

# Create zip
cd "$PROJECT_ROOT/release"
zip -r "$PROJECT_ROOT/release/discord-favourites-plugin.zip" discord-favourites-plugin/

echo "==> Release package created at release/discord-favourites-plugin.zip"
