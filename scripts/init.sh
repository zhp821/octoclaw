#!/bin/bash

# PicoClaw App Initialization Script (Shell)
# Usage: ./init.sh [force] [skipsync]

set -e

FORCE=""
SKIPSYNC=""

for arg in "$@"; do
    case $arg in
        force|-force|-Force)
            FORCE="1"
            shift
            ;;
        skipsync|-skipsync|-SkipSync)
            SKIPSYNC="1"
            shift
            ;;
    esac
done

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$( dirname "$SCRIPT_DIR" )"
PICOCLAW_DIR="$APP_DIR/picoclaw"
UPSTREAM_URL="https://github.com/sipeed/picoclaw.git"

echo ""
echo "=== PicoClaw App - Code Sync ==="
echo ""

# Check Git
echo "=== Checking Git ==="
if ! command -v git &> /dev/null; then
    echo "[ERROR] Git not found. Download: https://git-scm.com/downloads"
    exit 1
fi
echo "[SUCCESS] Git OK"
echo ""

# Init/Update Submodule
echo "=== Initializing Submodule ==="
cd "$APP_DIR"

if [ -n "$FORCE" ] && [ -d "$PICOCLAW_DIR" ]; then
    echo "[WARNING] Force mode: removing old submodule..."
    rm -rf "$PICOCLAW_DIR"
fi

if [ ! -d "$PICOCLAW_DIR" ]; then
    echo "[INFO] Cloning submodule..."
    git submodule update --init --recursive
else
    echo "[INFO] Submodule exists, updating..."
    git submodule update --recursive --remote
fi
echo "[SUCCESS] Submodule OK"
echo ""

# Configure Upstream
echo "=== Configuring Upstream Remote ==="
cd "$PICOCLAW_DIR"

if ! git remote get-url upstream &> /dev/null; then
    echo "[INFO] Adding upstream remote..."
    git remote add upstream "$UPSTREAM_URL"
else
    echo "[INFO] Upstream remote exists"
fi
echo "[SUCCESS] Upstream configured"
echo ""

# Merge Upstream
if [ -z "$SKIPSYNC" ]; then
    echo "=== Merging Upstream Latest ==="
    git fetch upstream || echo "[WARNING] Failed to fetch upstream"
    
    git checkout main
    if git merge upstream/main --no-edit; then
        echo "[SUCCESS] Merged upstream latest"
    else
        echo "[WARNING] Merge conflicts detected. Please resolve manually."
    fi
    echo ""
fi

echo "=== Initialization Complete ==="
echo ""
if [ -n "$SKIPSYNC" ]; then
    echo "[INFO] Skipped upstream sync (use without -SkipSync to sync)"
else
    echo "[INFO] Run with -SkipSync to skip upstream sync"
fi
echo ""
