#!/bin/sh
set -u

# Maison Dune - deployment (Linux/macOS)
# Real target: a Node static server (node server/server.js) on the Docker LXC.
# Deploys the site/ folder and restarts the container.
# Usage: SSHPASS=... bash deploy.sh   (requires a filled deploy/.env)

ENV_FILE="$(dirname "$0")/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing deploy/.env file."
  echo "Copy deploy/.env.example to deploy/.env and fill your private values."
  exit 1
fi

# Load .env (skip blank lines and comments)
while IFS='=' read -r key value; do
  key="$(echo "$key" | tr -d '[:space:]')"
  value="$(echo "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  [ -z "$key" ] && continue
  case "$key" in \#*) continue ;; esac
  export "$key=$value"
done < "$ENV_FILE"

: "${REMOTE_HOST:?Missing REMOTE_HOST in .env}"
: "${REMOTE_DIR:?Missing REMOTE_DIR in .env}"
: "${LOCAL_SITE:?Missing LOCAL_SITE in .env}"
: "${CONTAINER_NAME:=maisondune-web}"

echo
echo "Maison Dune - deployment (Node static server)"
echo "Target: $REMOTE_HOST:$REMOTE_DIR"
echo

echo "[1/3] Preparing remote folders..."
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_DIR/site/assets" || { echo "SSH connection failed. Check REMOTE_HOST and network access."; exit 1; }

echo "[2/3] Uploading site files..."
scp "$LOCAL_SITE/site/index.html"       "$REMOTE_HOST:$REMOTE_DIR/site/" || { echo "File copy failed."; exit 1; }
scp "$LOCAL_SITE/site/styles-v14.css"   "$REMOTE_HOST:$REMOTE_DIR/site/" || { echo "File copy failed."; exit 1; }
scp "$LOCAL_SITE/site/script-v5.js"     "$REMOTE_HOST:$REMOTE_DIR/site/" || { echo "File copy failed."; exit 1; }
scp -r "$LOCAL_SITE/site/assets/."      "$REMOTE_HOST:$REMOTE_DIR/site/assets/" || { echo "File copy failed."; exit 1; }

echo "[3/3] Restarting container ($CONTAINER_NAME)..."
ssh "$REMOTE_HOST" "docker restart $CONTAINER_NAME" || { echo "Docker restart failed."; exit 1; }

echo
echo "Deployment complete."
[ -n "${PUBLIC_URL:-}" ] && echo "URL: $PUBLIC_URL"
echo
