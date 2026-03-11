#!/bin/bash
# Pushes ONLY the backend app to https://github.com/SamuelOnyangoOmondi/backend.git
# Run from: Android/farm-to-palm/backend/
set -e

BACKEND_REPO="https://github.com/SamuelOnyangoOmondi/backend.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$BACKEND_ROOT/.backend-deploy"

cd "$BACKEND_ROOT"
echo "Backend root: $BACKEND_ROOT"

# Clone or update deploy dir (always use backend/.backend-deploy)
if [ -d "$DEPLOY_DIR" ]; then
  echo "Updating existing clone..."
  cd "$DEPLOY_DIR"
  git fetch origin
  git reset --hard origin/main
else
  echo "Cloning backend repo..."
  git clone "$BACKEND_REPO" "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
fi

# Remove everything except .git
echo "Replacing with backend-only code..."
find . -maxdepth 1 ! -name '.git' ! -name '.' ! -name '..' -exec rm -rf {} + 2>/dev/null || true

# Copy backend files (exclude .env, node_modules, dist)
rsync -a --exclude='.env' --exclude='node_modules' --exclude='dist' --exclude='.backend-deploy' \
  "$BACKEND_ROOT/" ./

# Ensure .env.example is present (safe to commit)
[ -f .env.example ] || true

git add -A
git status

if git diff --staged --quiet; then
  echo "No changes to push."
  exit 0
fi

git commit -m "Backend: meal_type (breakfast/lunch/supper/snack), CSV export mealType column, Supabase meal type"
git push origin main

echo "Done. Backend pushed to $BACKEND_REPO"
