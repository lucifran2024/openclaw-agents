#!/usr/bin/env bash
set -euo pipefail

# OpenClaw 24/7 setup for runtime environments where gateway is started
# by /data/start.sh (without systemd --user).
# Usage: bash ops/linux/setup-openclaw-24x7.sh

if ! command -v openclaw >/dev/null 2>&1; then
  echo "[ERRO] comando 'openclaw' nao encontrado no PATH"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
START_SCRIPT="${START_SCRIPT:-/data/start.sh}"
GATEWAY_PORT="${GATEWAY_PORT:-18789}"
GATEWAY_LOG="${GATEWAY_LOG:-/data/gateway.log}"

echo "[1/4] Validando saude do gateway/cron..."
if openclaw cron status --json >/dev/null 2>&1; then
  echo "[OK] Gateway e cron respondendo"
else
  echo "[WARN] Gateway/cron indisponiveis. Iniciando runtime..."
  if [ -x "$START_SCRIPT" ]; then
    nohup "$START_SCRIPT" >> "$GATEWAY_LOG" 2>&1 &
  else
    nohup openclaw gateway run --bind loopback --port "$GATEWAY_PORT" --verbose >> "$GATEWAY_LOG" 2>&1 &
  fi
  sleep 6
fi

echo "[2/4] Conferindo status do cron interno..."
openclaw cron status --json

echo "[3/4] Instalando watchdog no crontab..."
bash "${SCRIPT_DIR}/install-watchdog-cron.sh"

echo "[4/4] Validando jobs..."
openclaw cron list --json >/dev/null

echo "[OK] OpenClaw configurado para operacao continua 24/7 (runtime/start.sh)"
