#!/bin/bash
# Quick push to backend-app. Use after setup-backend-repo.sh (one-time).
# Run from: Android/farm-to-palm/backend/
# Usage: ./scripts/push-backend.sh [commit message]
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_ROOT"

if [ ! -d .git ]; then
  echo "Run one-time setup first: ./scripts/setup-backend-repo.sh"
  exit 1
fi

# Use backend-app remote if present, else origin
REMOTE="origin"
if git remote get-url backend-app 2>/dev/null; then
  REMOTE="backend-app"
fi

git add -A
git add -u
if git diff --staged --quiet; then
  echo "No changes to push."
  exit 0
fi

MSG="${1:-Backend update}"
git commit -m "$MSG"
git push "$REMOTE" main
echo "Pushed to backend-app."
