#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "============================================="
echo "   PostgreSQL Database Initialization        "
echo "============================================="

# Ensure tsx is available to run typescript files
if ! npx -y tsx --version >/dev/null 2>&1; then
  echo "Installing tsx globally/locally for execution..."
  npm install -D tsx
fi

# Run the typescript database initialization script
npx tsx scripts/init-postgres.ts

echo "============================================="
echo "   Database setup completed!                 "
echo "============================================="
