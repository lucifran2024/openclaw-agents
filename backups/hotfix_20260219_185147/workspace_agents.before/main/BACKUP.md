# BACKUP.md - Sistema de Backup

Este documento descreve o sistema de backup da Mesa Pastoral Digital.

---

## 📁 O QUE É BACKUPADO

### 1. Workspace Principal
- PASTOR_CHEFE.md
- AGENTS.md
- MEMORY.md
- PLANO_LEITURA_BIBLICA.md
- PROGRAMACAO_SEMANAL.md
- ESTILO_DEVOCIONAL.md
- FEEDBACK.md
- MENSAGENS.md
- Outros arquivos .md principais

### 2. Workspaces dos Pastores
- workspace-pastor-profetico/
- workspace-pastor-consolador/
- workspace-pastor-revisor/
- workspace-pastor-formatador/

### 3. Histórico de Devocionais
- devocionais/historico/

---

## 🔄 COMO USAR O BACKUP

### Execução Manual

```bash
./backup.sh
```

### Execução Automática (Cron Job)

Para executar automaticamente todo dia às 04:00:

```bash
0 4 * * * /data/.openclaw/workspace/backup.sh >> /data/.openclaw/backups/backup.log 2>&1
```

---

## 📊 LOCAL DOS BACKUPS

**Diretório:** `/data/.openclaw/backups/`

**Formato do arquivo:** `backup-[nome]-YYYY-MM-DD-HH-MM-SS.tar.gz`

**Exemplos:**
- `backup-mesa-pastoral-2026-02-18-04-00-00.tar.gz`
- `workspace-main-2026-02-18-04-00-00.tar.gz`
- `workspace-pastor-profetico-2026-02-18-04-00-00.tar.gz`

---

## 🗑️ LIMPEZA AUTOMÁTICA

O sistema **remove automaticamente** backups com mais de **30 dias**.

**Configuração:**
```bash
find /data/.openclaw/backups/ -name "*.tar.gz" -mtime +30 -delete
```

---

## 🔧 RESTAURAÇÃO

### Para restaurar tudo:

```bash
cd /data/.openclaw/
tar -xzf backups/workspace-main-YYYY-MM-DD-HH-MM-SS.tar.gz -C workspace/
tar -xzf backups/workspace-pastor-profetico-YYYY-MM-DD-HH-MM-SS.tar.gz
tar -xzf backups/workspace-pastor-consolador-YYYY-MM-DD-HH-MM-SS.tar.gz
tar -xzf backups/workspace-pastor-revisor-YYYY-MM-DD-HH-MM-SS.tar.gz
tar -xzf backups/workspace-pastor-formatador-YYYY-MM-DD-HH-MM-SS.tar.gz
```

### Para restaurar apenas um workspace específico:

```bash
cd /data/.openclaw/
tar -xzf backups/workspace-pastor-profetico-YYYY-MM-DD-HH-MM-SS.tar.gz
```

---

## 📈 MÉTRICAS DE BACKUP

### Frequência Recomendada:
- **Diário** para produção
- **Semanal** para desenvolvimento

### Retenção:
- **30 dias** de histórico
- **Após 30 dias:** exclusão automática

### Espaço Estimado:
- Cada backup completo: ~50-100 KB
- 30 dias de backups: ~3-5 MB

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Antes de confiar no backup, verificar:

- [ ] Script `backup.sh` existe e é executável
- [ ] Diretório `/data/.openclaw/backups/` existe
- [ ] Permissões corretas (node:node)
- [ ] Backup manual funciona sem erros
- [ ] Restauração funciona corretamente

---

## 🚨 EM CASO DE PROBLEMAS

### Erro: "Permission denied"
```bash
chmod +x /data/.openclaw/workspace/backup.sh
```

### Erro: "No such file or directory"
```bash
mkdir -p /data/.openclaw/backups
```

### Erro: "Disk full"
- Limpar backups antigos manualmente
- Aumentar o limite de retenção de 30 dias

---

## 📝 LOG

O log do backup fica em: `/data/.openclaw/backups/backup.log`

**Ver últimos 10 backups:**
```bash
tail -n 10 /data/.openclaw/backups/backup.log
```

**Ver todos os backups:**
```bash
ls -lh /data/.openclaw/backups/
```

---

## 🎯 PRÓXIMOS PASSOS

- [ ] Adicionar cron job para backup automático
- [ ] Testar restauração completa
- [ ] Configurar notificação de sucesso/erro
- [ ] Considerar backup externo (nuvem)

---

*Última atualização: 18/02/2026*
*Status: Sistema de backup configurado*
