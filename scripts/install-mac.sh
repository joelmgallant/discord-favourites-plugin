#!/usr/bin/env bash
set -euo pipefail

echo "============================================"
echo " Discord Favourites Plugin - macOS Install"
echo "============================================"
echo

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$BASE_DIR/dist"
INSTALLER_DIR="$BASE_DIR/dist/Installer"
INSTALLER_BIN="$INSTALLER_DIR/VencordInstaller"
INSTALLER_URL="https://github.com/Vencord/Installer/releases/latest/download/VencordInstaller.MacOS.zip"

if [ ! -f "$DIST_DIR/renderer.js" ]; then
    echo "ERROR: dist folder not found. Make sure you extracted the full zip."
    exit 1
fi

if [ ! -f "$INSTALLER_BIN" ]; then
    echo "Downloading Vencord installer..."
    mkdir -p "$INSTALLER_DIR"
    TMPZIP="$INSTALLER_DIR/installer.zip"
    curl -L -o "$TMPZIP" "$INSTALLER_URL"
    unzip -o "$TMPZIP" "VencordInstaller.app/Contents/MacOS/VencordInstaller" -d "$INSTALLER_DIR"
    mv "$INSTALLER_DIR/VencordInstaller.app/Contents/MacOS/VencordInstaller" "$INSTALLER_BIN"
    rm -rf "$INSTALLER_DIR/VencordInstaller.app" "$TMPZIP"
    chmod +x "$INSTALLER_BIN"
    sudo xattr -d com.apple.quarantine "$INSTALLER_BIN" 2>/dev/null || true
    echo "Download complete."
fi

echo
echo "Installing Vencord with Favourites Plugin..."
echo

VENCORD_USER_DATA_DIR="$BASE_DIR" VENCORD_DEV_INSTALL=1 "$INSTALLER_BIN" --install

echo
echo "============================================"
echo " Done! Restart Discord to activate."
echo " Enable \"FavouritesPanel\" in:"
echo " Vencord Settings > Plugins"
echo "============================================"
