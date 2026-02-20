#!/usr/bin/env bash
set -euo pipefail

# Installs watchdog in user crontab (every 2 minutes).

SCRIPT_PATH="/data/.openclaw/ops/linux/openclaw-watchdog.sh"
ENTRY="*/2 * * * * HOME=/data PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin bash ${SCRIPT_PATH}"
TMP_FILE="$(mktemp)"

if ! crontab -l >"$TMP_FILE" 2>/dev/null; then
  : > "$TMP_FILE"
fi

if grep -Fq "$SCRIPT_PATH" "$TMP_FILE"; then
  echo "[OK] watchdog ja esta no crontab"
  rm -f "$TMP_FILE"
  exit 0
fi

{
  cat "$TMP_FILE"
  echo "$ENTRY"
} | crontab -

echo "[OK] watchdog instalado no crontab"
rm -f "$TMP_FILE"
