# 🛠️ PROTOCOLO DE AUDITORIA PROFUNDA E AUTO-AJUSTE (SCAN V3 - INTENSIVO)

Este documento define o padrão de ouro para as manutenções horárias da Mesa Pastoral. O objetivo é manter o sistema 100% livre de legados, clichês e inconsistências.

---

## 🔍 CAMADA 1: INTEGRIDADE DA BASE (SECTION-BY-SECTION)
**Checklist Obrigatório:**
- [ ] **Sincronia de IDs:** Verifique se os § citados no `MODO_MASTER.md` existem na `BASE_CONHECIMENTO.md`.
- [ ] **Exclusão de Legados:** Garanta que não existam referências a "Modo 1", "M1.x", "Modo 2", "FIAs" ou "Estruturas E01-E25". A Base v3 foca apenas em Motores Técnicos.
- [ ] **Links Quebrados:** Procure por referências a arquivos inexistentes (ex: `SECAO6.TXT`).

## 🧬 CAMADA 2: CAÇA TÉCNICA (DNA E CLICHÊS)
**Executar via `grep` em todos os arquivos:**
1. **Caça aos Clichês:** `Deus tem o controle`, `Tudo coopera`, `No tempo de Deus`, `Vai passar`, `Declare vitória`.
2. **Caça aos Pronomes:** `sua `, `seu `. (Permitido apenas em citações bíblicas literais).
3. **Púlpito Detector:** `Amados`, `Irmãos`, `Contemplemos`.

## ⚙️ CAMADA 3: PERFORMANCE E WORKSPACE
- [ ] **Timeouts:** Verificar se os jobs de Cron estão falhando por ler arquivos gigantes. Se sim, instruir o uso de leitura por pedaços.
- [ ] **Organização:** Arquivos em `devocionais/historico/` devem seguir o padrão `YYYY-MM-DD-X.md`.

## 🧪 CAMADA 4: O TESTE DE MESA (Q5-LITE)
**Validar as últimas 3 peças geradas:**
1. Gancho no estômago?
2. Cena sensorial/Asfalto presente?
3. Pivot (Virada) bíblica clara?
4. Fechamento curto e impactante?
5. Zero clichês?

---

## 🛠️ FERRAMENTAS OBRIGATÓRIAS
1. **`grep -rnE`**: Para buscas transversais.
2. **`session_status`**: Para saúde de tokens.
3. **`read/edit`**: Para cirurgias imediatas.

## ⏱️ DURAÇÃO E RECURSIVIDADE
- **Mínimo:** 5 minutos de processamento ativo.
- **Ciclos:** Realizar pelo menos 3 rodadas de Scan -> Ajuste -> Re-scan.

---
*Assinado: Pastora Chefe (Protocolo Sincronizado v3)*
