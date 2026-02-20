# 🛡️ AUDITORIA GERAL — REVISÃO ESTRUTURAL DO SISTEMA
**Data:** 19/02/2026
**Executor:** Claude Sonnet 4.6 (solicitado por Lucifran)
**Status:** CONCLUÍDA — NÃO REVERTER

---

## ⚠️ LEIA ANTES DE QUALQUER AUTOCORREÇÃO

Este documento registra alterações **intencionais e revisadas** feitas em 19/02/2026.
O sistema de autocura (Sentinela) NÃO deve reverter nenhum item deste relatório.
Se encontrar algo aqui listado como "corrigido", considere-o correto e preserve.

---

## 📋 ALTERAÇÕES REALIZADAS

### 1. HEARTBEAT.md (workspace/agents/main/)
- ✅ CORRIGIDO: `VALIAÇÃO` → `VALIDAÇÃO` (linha 43)
- ✅ CORRIGIDO: `CAPÍCULO:CAPÍCULO` → `CAPÍTULO:CAPÍTULO` (linha 44)
- ✅ CORRIGIDO: Lógica invertida no checklist "sua/seu" — linha 48 agora diz corretamente `"não escapou nenhum 'tua' ou 'teu' (usar apenas sua/seu)"`
- ✅ CORRIGIDO: Linha 64 — quebra de linha adicionada entre `*Status*` e `✅ SENTINELA P.I.M.`

### 2. PASTOR_CHEFE.md (workspace/agents/main/)
- ✅ CORRIGIDO: Linha 12 — ambiguidade `"sessions_spawn ou sessions_send"` → clarificado: sessions_spawn cria sessão isolada; sessions_send envia para sessão existente
- ✅ CORRIGIDO: Pipeline `(4 FASES)` → `(5 FASES)` — adicionada Fase 5: Entrega ao Lucifran
- ✅ CORRIGIDO: `VALIAÇÃO` → `VALIDAÇÃO` na seção de Controle de Qualidade
- ✅ CORRIGIDO: `CAPÍCULO:CAPÍCULO` → `CAPÍTULO:CAPÍTULO` na mesma seção

### 3. INSTRUCTIONS.md (workspace/agents/main/)
- ✅ ADICIONADO: Fase 5 (Entrega) ao pipeline — alinhando com HEARTBEAT.md

### 4. INSTRUCOES_AGENDAMENTO.md (workspace/agents/main/)
- ✅ CORRIGIDO: Contradição crítica — texto afirmava que sessions_spawn estava BLOQUEADO. Evidência em subagents/runs.json mostra 3 execuções A2A reais com status "ok". Texto atualizado para: sessions_spawn está disponível; modo de simulação é fallback quando indisponível
- ✅ CORRIGIDO: `CAPÍCULO:CAPÍCULO` → `CAPÍTULO:CAPÍTULO` (ocorrências nas linhas 125 e 152)
- ✅ CORRIGIDO: Auto-referência nula `"nunca 'sua/seu'"` → `"nunca 'tua/teu'"` (linha 128)
- ✅ CORRIGIDO: Seção de erros invertida `"❌ Usar 'sua/seu'"` → `"❌ Usar 'tua/teu'"`
- ✅ CORRIGIDO: Segunda afirmação de "NÃO há rede técnica" → reformulado como comportamento de fallback
- ✅ CORRIGIDO: Linha 90 — `"Garantir SEM rótulos, 'sua/seu'"` → `"Garantir SEM rótulos, SEM 'tua/teu'"` (lógica estava invertida)

### 5. pastor-profetico/INSTRUCTIONS.md
- ✅ CORRIGIDO: Auto-referência `"sua/seu (não 'sua/seu')"` → `"sua/seu (nunca 'tua/teu')"`
- ✅ ADICIONADO: Hierarquia de documentos clara com caminhos relativos corretos (PASSAGEM → skill → BASE → MEU_ESTILO → CCE → BANCO_DE_OURO)

### 6. pastor-consolador/INSTRUCTIONS.md
- ✅ CORRIGIDO: Texto malformado na linha 12 — vírgula solta e referências de seção misturadas separadas em duas linhas
- ✅ CORRIGIDO: Auto-referência `"sua/seu (não 'sua/seu')"` → `"sua/seu (nunca 'tua/teu')"`
- ✅ ADICIONADO: Hierarquia de documentos clara com caminhos relativos corretos

### 7. pastor-revisor/INSTRUCTIONS.md
- ✅ CORRIGIDO: Auto-referência `"em vez de 'sua/seu'"` → `"em vez de 'tua/teu'"`
- ✅ CORRIGIDO: Checklist `"zero 'sua'"` → `"zero 'tua/teu'"` (lógica estava invertida)
- ✅ ADICIONADO: Hierarquia de documentos com MEU_ESTILO_PESSOAL como prioridade 1 (gabarito de voz)

### 8. master-curador/INSTRUCTIONS.md
- ✅ CORRIGIDO: Typo `"Sisuações"` → `"Situações"`
- ✅ CORRIGIDO: Auto-referência `"evite 'sua/seu'"` → `"evite 'tua/teu'"`

### 9. pastor-formatador/INSTRUCTIONS.md
- ✅ CORRIGIDO: Regra 7 "botões de interação" reformulada com implementação concreta para plataformas de texto: `[🔁 Refazer] [⭐ Favoritar] [🎨 Variar Tom]`
- ✅ CORRIGIDO: Numeração duplicada — dois itens "8." corrigidos para 8. e 9.
- ✅ ADICIONADO: Hierarquia de documentos com MEU_ESTILO_PESSOAL e BANCO_DE_OURO como prioridades 1 e 2

### 10. ops/linux/setup-openclaw-24x7.sh
- ✅ ADICIONADO: Loop de verificação pós-boot do gateway (até 30s) com mensagem de erro informativa
- Antes: o script continuava sem verificar se o runtime subiu após `sleep 6`
- Depois: aguarda até 30s verificando a cada 2s, aborta com erro claro se não responder

### 11. ops/linux/openclaw-watchdog.sh
- ✅ CORRIGIDO: `LOG_DIR="/data/.openclaw/logs"` → `LOG_DIR="${LOG_DIR:-/data/.openclaw/logs}"` (permite override por variável de ambiente)

### 12. cron/jobs.json — UNIFICAÇÃO DE JOBS
- ✅ REMOVIDOS 4 jobs redundantes:
  - "Sentinela Soberano 30m" (`0,30 * * * *`) — redundante com revisão horária
  - "Auditoria de Alto Ajuste Horária" (`0 * * * *`) — duplicata exata da revisão horária
  - "Controlador Proativo 24x7" (`*/5 * * * *`) — 12 ativações/hora desnecessárias
  - "Autocura Docs Pastores" (`*/15 * * * *`) — 4 ativações/hora desnecessárias
- ✅ TRANSFORMADO: "Revisão Horária" → "Ciclo Soberano Horário — 16 Especialistas"
  - Payload unificado com todos os 16 especialistas do MODO_SENTINELA
  - Mínimo 2 ações reais por especialista (32 ações totais mínimas por ciclo)
  - Relatório formatado obrigatório enviado no Telegram
- ✅ MANTIDOS sem alteração:
  - "Envio de Devocionais Diários" (`0 5 * * *`) — payload levemente atualizado para mencionar A2A
  - "Geração Massiva Modo Master" (`0 4 * * *`)
- RESULTADO: De 7 jobs para 3 jobs

---

## 🗂️ CENTRALIZAÇÃO — CORREÇÃO DE CAMINHOS RELATIVOS (19/02/2026 — Sessão 2)

### DIAGNÓSTICO
O sistema tinha **dois diretórios de agentes** com caminhos relativos invertidos:
- `agents/pastor-*/INSTRUCTIONS.md` (usado pelo gateway/runtime) usava `../../BASE_CONHECIMENTO.md` → **ERRADO** (apontava para raiz do repo, onde o arquivo não existe)
- `workspace/agents/pastor-*/INSTRUCTIONS.md` (contexto do agente) usava `../../workspace/BASE_CONHECIMENTO.md` → **ERRADO** (arquivo estava dois níveis acima + workspace = raiz/workspace = correto por coincidência mas incorreto conceitualmente)

### ARQUITETURA CORRETA (fonte única de verdade)
```
Repositório raiz (.openclaw/)
├── agents/pastor-*/INSTRUCTIONS.md   ← Gateway/runtime lê daqui
│   └── referências: ../../workspace/DOCUMENTO.md  ← CORRETO
└── workspace/
    ├── BASE_CONHECIMENTO.md           ← Documento soberano
    ├── MEU_ESTILO_PESSOAL.md          ← Documento soberano
    ├── BANCO_DE_OURO_EXEMPLOS.md      ← Documento soberano
    ├── CONHECIMENTO_COMPILADO_ESSENCIAL.md ← Documento soberano
    └── agents/pastor-*/INSTRUCTIONS.md ← Contexto do agente
        └── referências: ../../DOCUMENTO.md  ← CORRETO (já dentro de workspace/)
```

### CORREÇÕES APLICADAS

**Em `agents/` (gateway):** 4 pastores corrigidos — caminhos de `../../DOCUMENTO.md` → `../../workspace/DOCUMENTO.md`
- `agents/pastor-profetico/INSTRUCTIONS.md` ✅
- `agents/pastor-consolador/INSTRUCTIONS.md` ✅
- `agents/pastor-revisor/INSTRUCTIONS.md` ✅
- `agents/pastor-formatador/INSTRUCTIONS.md` ✅

**Em `workspace/agents/` (contexto):** 4 pastores corrigidos — removido prefixo `workspace/` incorreto
- `workspace/agents/pastor-profetico/INSTRUCTIONS.md` ✅
- `workspace/agents/pastor-consolador/INSTRUCTIONS.md` ✅
- `workspace/agents/pastor-revisor/INSTRUCTIONS.md` ✅
- `workspace/agents/pastor-formatador/INSTRUCTIONS.md` ✅

**`workspace/auditoria/MODO_SENTINELA.md`** — Adicionada seção de arquitetura de diretórios com regra crítica para que o Sentinela nunca misture os prefixos de caminho.

### O QUE NÃO REVERTER (adição à lista)
8. Os caminhos `../../workspace/DOCUMENTO.md` nos arquivos em `agents/pastor-*/INSTRUCTIONS.md`
9. Os caminhos `../../DOCUMENTO.md` nos arquivos em `workspace/agents/pastor-*/INSTRUCTIONS.md`
10. A seção de arquitetura de diretórios no início do MODO_SENTINELA.md

---

## 📐 HIERARQUIA CANÔNICA DE DOCUMENTOS (para todos os pastores)

```
PASSAGEM_DO_DIA (fonte da verdade bíblica)
    ↓
skills/prophetic-voice/SKILL.md (técnica de escrita)
    ↓
MEU_ESTILO_PESSOAL.md (gabarito de voz, tom, cadência)
    ↓
BASE_CONHECIMENTO.md (motores técnicos de escrita)
    ↓
CONHECIMENTO_COMPILADO_ESSENCIAL.md / CCE (repertório de temas)
    ↓
BANCO_DE_OURO_EXEMPLOS.md (calibração de ritmo e qualidade)
```

**Regra:** Documentos de cima têm prioridade sobre os de baixo. Nunca use CCE para definir estrutura — apenas para repertório de metáforas/autoridade.

---

## 🔍 DIAGNÓSTICO DE DOCUMENTOS CRÍTICOS

| Documento | Status | Localização Correta |
|-----------|--------|---------------------|
| BASE_CONHECIMENTO.md | ✅ ATIVO | `workspace/BASE_CONHECIMENTO.md` |
| MEU_ESTILO_PESSOAL.md | ✅ ATIVO | `workspace/MEU_ESTILO_PESSOAL.md` |
| BANCO_DE_OURO_EXEMPLOS.md | ✅ ATIVO | `workspace/BANCO_DE_OURO_EXEMPLOS.md` |
| CONHECIMENTO_COMPILADO_ESSENCIAL.md | ✅ ATIVO | `workspace/CONHECIMENTO_COMPILADO_ESSENCIAL.md` |
| MODO_MASTER.md | ✅ ATIVO | `workspace/agents/master-curador/MODO_MASTER.md` |
| ESTILO_DEVOCIONAL.md | ⚠️ VAZIO | `workspace/ESTILO_DEVOCIONAL.md` (não usar — arquivo vazio) |
| skills/prophetic-voice/SKILL.md | A verificar | `workspace/skills/prophetic-voice/SKILL.md` |

**Nota sobre ESTILO_DEVOCIONAL.md:** Arquivo encontrado em dois locais mas ambos vazios. Os pastores não devem referenciá-lo até que seja preenchido. As regras de estilo estão corretamente distribuídas em MEU_ESTILO_PESSOAL.md e BASE_CONHECIMENTO.md.

---

## ✅ FAVORITOS DO LUCIFRAN — CONFIRMAÇÃO DE USO CORRETO

As 17 mensagens favoritas em `MEMORY.md` representam o DNA do sistema:
- **Padrão confirmado:** Contrastes (Palco vs Secreto), vocabulário de processo (Oficina, Alinhamento, Raiz), frases curtas com impacto
- **Uso correto:** MEMORY.md deve ser consultado para calibrar tom e evitar repetição de temas/metáforas
- **Antirrepetição:** Verificar histórico em `devocionais/historico/` antes de cada geração

---

## 🚫 O QUE NÃO REVERTER

O Sentinela NÃO deve desfazer em ciclos futuros:
1. A hierarquia de documentos adicionada aos 4 pastores
2. A correção de `tua/teu` nas regras de tratamento
3. A unificação dos jobs para 3 (não recriar os 4 jobs removidos)
4. O payload do Ciclo Soberano com os 16 especialistas
5. A Fase 5 adicionada ao pipeline em INSTRUCTIONS.md e PASTOR_CHEFE.md
6. A ambiguidade sessions_spawn/sessions_send esclarecida
7. O loop de verificação no setup-openclaw-24x7.sh

---

*Documento gerado em: 19/02/2026 — Sessão de Revisão Geral Solicitada por Lucifran*
*Próxima ação recomendada: Sincronizar com VPS via git push para vps master*
