#!/bin/bash
# setup.sh – Environment bootstrap for Codex and human contributors

set -e

echo "🔧 Running setup.sh..."

# ---------------------------
# Python dependencies
# ---------------------------
if [ -f requirements.txt ]; then
  echo "📦 Installing Python packages from requirements.txt..."
  pip install --upgrade pip
  pip install -r requirements.txt
else
  echo "⚠️  No requirements.txt found, skipping Python deps."
fi

# ---------------------------
# Pre-commit hooks
# ---------------------------
if [ -f .pre-commit-config.yaml ]; then
  echo "🔐 Installing pre-commit and enabling hooks..."
  pip install pre-commit
  pre-commit install
else
  echo "ℹ️  No .pre-commit-config.yaml found, skipping pre-commit setup."
fi

# ---------------------------
# JavaScript/TypeScript dependencies
# ---------------------------
if [ -f package.json ]; then
  echo "🧰 Installing Node.js packages..."

  if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install
  else
    echo "Using npm..."
    npm install
  fi
else
  echo "⚠️  No package.json found, skipping JS/TS deps."
fi

echo "✅ setup.sh complete."
