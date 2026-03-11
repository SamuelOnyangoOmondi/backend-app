#!/bin/bash
# One-time setup: make this backend folder a git repo with remote = backend-app.
# After this, you can push with:  cd backend && git add -A && git commit -m "..." && git push
# Run from: Android/farm-to-palm/backend/
set -e

BACKEND_REPO="https://github.com/SamuelOnyangoOmondi/backend.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$BACKEND_ROOT"

if [ -d .git ]; then
  if git remote get-url origin 2>/dev/null | grep -q backend; then
    echo "Backend repo already set up. Push with: git add -A && git commit -m '...' && git push"
    exit 0
  fi
  echo "Existing .git found; adding backend-app as remote 'backend-app'."
  git remote add backend-app "$BACKEND_REPO" 2>/dev/null || git remote set-url backend-app "$BACKEND_REPO"
  echo "Fetching..."
  git fetch backend-app
  echo "Set upstream: git branch -u backend-app/main main  (or push with: git push backend-app main)"
  exit 0
fi

echo "One-time setup: initializing backend as git repo and linking to backend-app."
echo "This will make this folder match the remote (any uncommitted local changes may be lost)."
read -p "Continue? [y/N] " -n 1 -r; echo
if [[ ! $REPLY =~ ^[yY]$ ]]; then exit 0; fi
git init
git remote add origin "$BACKEND_REPO"
git fetch origin
git branch -M main
git reset --hard origin/main
echo ""
echo "Done. From now on, to push backend changes:"
echo "  cd $(pwd)"
echo "  git add -A && git status"
echo "  git commit -m 'Your message'"
echo "  git push origin main"
echo ""
echo "No more clone/rsync — just commit and push."
