# 🛡️ MODO SENTINELA — V8 (Detecção de Falhas Reais)

Objetivo: detectar **falhas que quebram operação** antes que virem incidente.

## 1) Prioridade de risco (ordem obrigatória)
1. **Estrutura de pastas** (duplicidade/divergência)
2. **Caminhos quebrados** em `INSTRUCTIONS.md`
3. **Rede A2A** (todos os pastores respondendo)
4. **Modelo real em execução** (status × logs)
5. **Permissões sensíveis** (`auth-profiles.json`)

## 2) Abertura obrigatória de documentos (antes dos testes)
- Abrir e validar presença/leitura de:
  1. `/data/.openclaw/agents/main/MEMORY.md` (DNA/Favoritos)
  2. `/data/.openclaw/BASE_CONHECIMENTO.md`
  3. `/data/.openclaw/MEU_ESTILO_PESSOAL.md`
  4. `/data/.openclaw/BANCO_DE_OURO_EXEMPLOS.md`
  5. `/data/.openclaw/CONHECIMENTO_COMPILADO_ESSENCIAL.md`
- Se algum estiver ausente/inacessível: registrar **falha crítica** e propor correção.

## 3) Testes obrigatórios por ciclo

### A. Estrutura única (anti-duplicidade)
- Confirmar que `/data/.openclaw/workspace/agents` aponta para `/data/.openclaw/agents`.
- Se não apontar: abrir alerta crítico no relatório.

### B. Integridade de caminhos
- Escanear `agents/*/INSTRUCTIONS.md` por referências `.md`.
- Validar existência real dos caminhos citados.
- Corrigir caminhos quebrados imediatamente e registrar diff.

### C. Rede A2A ponta a ponta
- Disparar teste curto para cada papel:
  - `pastor-profetico`
  - `pastor-consolador`
  - `pastor-revisor`
  - `pastor-formatador`
  - `master-curador`
- Se qualquer um falhar: alerta crítico + causa provável (modelo, auth, limite, permissão).

### D. Modelo real (verdade operacional)
- Conferir `session_status`.
- Conferir logs (`openclaw logs --limit 200 --plain`) e validar provider/model da run.
- Se houver divergência, registrar como **INCONSISTÊNCIA DE ROTEAMENTO**.

### E. Segurança mínima
- Garantir `chmod 600` em:
  - `/data/.openclaw/agents/pastor-*/agent/auth-profiles.json`

## 4) Critério de falha do ciclo
O ciclo é **INVÁLIDO** se:
- não houver evidência de abertura dos 5 documentos-base,
- não houver evidência de A2A real,
- não houver validação de paths,
- ou não houver checagem de modelo real em log.

## 5) Saída obrigatória
Salvar em `auditoria/relatorios/YYYY-MM-DD_HH-mm_SENTINELA.md` com:
- ✅ checks aprovados
- ❌ falhas detectadas
- 🛠 correções aplicadas (arquivo + antes/depois)
- 🚨 riscos pendentes

## 6) Regra de ouro
Nunca reportar “tudo ok” sem evidência executável.
