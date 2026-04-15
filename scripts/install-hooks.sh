#!/bin/bash
# install-hooks.sh
# Copies git hooks from scripts/hooks/ into .git/hooks/ and makes them executable.
# Run once after cloning: bash scripts/install-hooks.sh

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_SRC="$REPO_ROOT/scripts/hooks"
HOOKS_DEST="$REPO_ROOT/.git/hooks"

if [ ! -d "$HOOKS_SRC" ]; then
  echo "❌ No hooks directory found at scripts/hooks/ — nothing to install."
  exit 1
fi

INSTALLED=0

for HOOK in "$HOOKS_SRC"/*; do
  [ -f "$HOOK" ] || continue
  HOOK_NAME="$(basename "$HOOK")"
  DEST="$HOOKS_DEST/$HOOK_NAME"

  if [ -f "$DEST" ] && ! diff -q "$HOOK" "$DEST" > /dev/null 2>&1; then
    echo "  ⚠️  $HOOK_NAME already exists and differs — backing up to $HOOK_NAME.bak"
    cp "$DEST" "$DEST.bak"
  fi

  cp "$HOOK" "$DEST"
  chmod +x "$DEST"
  echo "  installed: $HOOK_NAME"
  INSTALLED=$((INSTALLED + 1))
done

echo "✅ install-hooks.sh: installed $INSTALLED hook(s) into .git/hooks/"
