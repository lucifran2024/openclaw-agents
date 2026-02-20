# MEMORY — Regras permanentes (VPS OpenClaw)

1) PROIBIDO editar openclaw.json para colocar agents.list[].instructions (quebra schema e derruba gateway/health).
2) Regras dos agentes devem ser salvas somente como .md nos workspaces:
   - /data/.openclaw/workspace-pastor-profetico/
   - /data/.openclaw/workspace-pastor-consolador/
   - /data/.openclaw/workspace-pastor-revisor/
   - /data/.openclaw/workspace-pastor-formatador/
3) O Gateway/UI reconhece apenas estes Core Files:
   AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md BOOTSTRAP.md MEMORY.md
   Se existir INSTRUCTIONS.md, mesclar para USER.md.
4) Depois de editar .md: reload sem restart -> atualizar apenas meta.lastTouchedAt em /data/.openclaw/openclaw.json.
5) Permissões: workspaces e .md devem ser node:node (evitar "Missing" no UI).
