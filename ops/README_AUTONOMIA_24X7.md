# OpenClaw Autonomia 24/7

## Objetivo
- manter daemon e cron internos sempre ativos
- reduzir intervencao manual diaria
- recuperar automaticamente quedas simples

## Scripts
- `ops/linux/setup-openclaw-24x7.sh`: instala/reinicia daemon e valida status
- `ops/linux/openclaw-watchdog.sh`: watchdog leve com restart automatico
- `ops/linux/install-watchdog-cron.sh`: registra watchdog no crontab do host

## Uso recomendado no VPS
1. `bash /data/.openclaw/ops/linux/setup-openclaw-24x7.sh`
2. `bash /data/.openclaw/ops/linux/install-watchdog-cron.sh`
3. `openclaw cron status`