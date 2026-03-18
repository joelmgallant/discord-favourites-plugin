#!/usr/bin/env bash
set -euo pipefail

echo "============================================"
echo " Discord Favourites Plugin - Linux Install"
echo "============================================"
echo

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$BASE_DIR/dist"
INSTALLER_DIR="$BASE_DIR/dist/Installer"
INSTALLER_BIN="$INSTALLER_DIR/VencordInstallerCli-linux"
INSTALLER_URL="https://github.com/Vencord/Installer/releases/latest/download/VencordInstallerCli-linux"

if [ ! -f "$DIST_DIR/renderer.js" ]; then
    echo "ERROR: dist folder not found. Make sure you extracted the full zip."
    exit 1
fi

if [ ! -f "$INSTALLER_BIN" ]; then
    echo "Downloading Vencord installer..."
    mkdir -p "$INSTALLER_DIR"
    curl -L -o "$INSTALLER_BIN" "$INSTALLER_URL"
    chmod +x "$INSTALLER_BIN"
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
