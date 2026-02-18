#!/usr/bin/env bash

set -euo pipefail

echo "Starting project update..."

# Validate required environment variables
: "${TRAFFIC_SYNC_BASE_URL:?Missing TRAFFIC_SYNC_BASE_URL}"
: "${TRAFFIC_SYNC_USERNAME:?Missing TRAFFIC_SYNC_USERNAME}"
: "${TRAFFIC_SYNC_PASSWORD:?Missing TRAFFIC_SYNC_PASSWORD}"

# Ensure we are inside a git repository
if [ ! -d ".git" ]; then
  echo "Error: Current directory is not a git repository."
  exit 1
fi

echo "Pulling latest changes..."
git pull

# Ensure .env.example exists
if [ ! -f ".env.example" ]; then
  echo "Error: .env.example not found after git pull."
  exit 1
fi

# Backup existing .env if it exists
if [ -f ".env" ]; then
  echo "Backing up existing .env to .env.backup"
  cp .env .env.backup
fi

echo "Creating fresh .env from .env.example..."
cp .env.example .env

# Escape values safely for sed
escape() {
  printf '%s\n' "$1" | sed 's/[&/\]/\\&/g'
}

BASE_URL_ESCAPED=$(escape "$TRAFFIC_SYNC_BASE_URL")
USERNAME_ESCAPED=$(escape "$TRAFFIC_SYNC_USERNAME")
PASSWORD_ESCAPED=$(escape "$TRAFFIC_SYNC_PASSWORD")

echo "Updating environment variables..."

sed -i "s|^TRAFFIC_SYNC_BASE_URL=.*|TRAFFIC_SYNC_BASE_URL=${BASE_URL_ESCAPED}|" .env
sed -i "s|^TRAFFIC_SYNC_USERNAME=.*|TRAFFIC_SYNC_USERNAME=${USERNAME_ESCAPED}|" .env
sed -i "s|^TRAFFIC_SYNC_PASSWORD=.*|TRAFFIC_SYNC_PASSWORD=${PASSWORD_ESCAPED}|" .env

# Ensure pm2 exists
if ! command -v pm2 >/dev/null 2>&1; then
  echo "Error: pm2 is not installed."
  exit 1
fi

echo "Restarting PM2..."
pm2 restart all
pm2 restart all --update-env
pm2 list

echo ""
echo "================================="
echo "Updated .env contents:"
echo "================================="
cat .env
echo "================================="
echo ""
echo "Update completed successfully."
