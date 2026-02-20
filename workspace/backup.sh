#!/usr/bin/env bash
set -euo pipefail

# Backup automatico do OpenClaw (estrutura atual workspace/agents)
ROOT_DIR="/data/.openclaw"
BACKUP_DIR="${ROOT_DIR}/backups"
STAMP="$(date +%Y-%m-%d-%H-%M-%S)"
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "${BACKUP_DIR}"

log() {
  echo "$1" | tee -a "${LOG_FILE}"
}

archive() {
  local name="$1"
  shift
  tar -czf "${BACKUP_DIR}/${name}-${STAMP}.tar.gz" -C "${ROOT_DIR}" "$@" 2>>"${LOG_FILE}"
}

log "=== BACKUP INICIADO ==="
log "Data/Hora: ${STAMP}"
log ""

log "[1/5] Backup do contexto principal..."
archive "workspace-main" \
  workspace/agents/main \
  workspace/ESTILO_DEVOCIONAL.md \
  workspace/BASE_CONHECIMENTO.md \
  workspace/MENSAGENS.md \
  workspace/devocionais \
  workspace/auditoria

log "[2/5] Backup do pastor-profetico..."
archive "workspace-pastor-profetico" workspace/agents/pastor-profetico

log "[3/5] Backup do pastor-consolador..."
archive "workspace-pastor-consolador" workspace/agents/pastor-consolador

log "[4/5] Backup do pastor-revisor..."
archive "workspace-pastor-revisor" workspace/agents/pastor-revisor

log "[5/5] Backup do pastor-formatador..."
archive "workspace-pastor-formatador" workspace/agents/pastor-formatador

log ""
log "Limpando backups antigos (30+ dias)..."
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +30 -delete 2>>"${LOG_FILE}"

log ""
log "=== BACKUP CONCLUIDO ==="
log "Arquivos criados em: ${BACKUP_DIR}"
log ""

echo "=========================================="
echo "  BACKUP CONCLUIDO"
echo "=========================================="
echo "Data/Hora: ${STAMP}"
echo "Local: ${BACKUP_DIR}"
echo "=========================================="