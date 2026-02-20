# 🚀 Protocolo Oficial de Deploy e Sincronização (OpenClaw)

> **ATENÇÃO AO AGENTE IA (Antigravity):** 
> Toda vez que o usuário (Lucifran) pedir para "subir uma alteração", "atualizar a VPS", "fazer deploy" ou mudar a inteligência dos Pastores, você DEVE LER e SEGUIR OBRIGATORIAMENTE este protocolo antes de dar o trabalho como finalizado. Não pule nenhuma etapa para evitar que a Mesa Pastoral quebre em produção.

## 📋 Checklist de Sincronização

### ETAPA 1: Preparação e Segurança (Local)
- [ ] Garantir que o código no PC (`vps-openclaw`) está limpo e sem erros de sintaxe (especialmente em arquivos `.json` e `.md`).
- [ ] Fazer o commit das alterações locais.
- [ ] Enviar (Push) as alterações para o repositório central no GitHub (`origin master`).

### ETAPA 2: Deploy na VPS (Produção)
- [ ] Conectar via terminal/SSH na VPS (`root@187.77.42.107`).
- [ ] Navegar até a pasta raiz do OpenClaw: `cd /docker/openclaw-dr21/data/.openclaw`
- [ ] Puxar as atualizações da nuvem: `git pull origin master`

### ETAPA 3: Validação Rigorosa (Obrigatório)
Logo após o `git pull` na VPS, executar imediatamente o comando de saúde do sistema:
```bash
openclaw status
```
- Se o status retornar VERDE (Gateway e serviços rodando normalmente), o deploy foi um sucesso!
- Se o status retornar VERMELHO ou mostrar falhas de porta/serviço, **PARE TUDO**. A última alteração inseriu um bug crítico (provavelmente num arquivo `.json`).
  - *Plano de Reversão:* Execute `git reset --hard HEAD~1` na VPS, reinicie o gateway (`openclaw gateway restart`) e avise o usuário imediatamente sobre o que causou a falha.

---
*Este documento garante que o OpenClaw sempre continuará funcionando 24h sem interrupções após qualquer atualização.*
