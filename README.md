# PVC VOZ 05 - GPS + Regras Essenciais

## O que e este repositorio?

Este repositorio serve como **sistema de navegacao (GPS) e resumo de regras essenciais** para o Gem PVC VOZ 05.

Ele contem:
- **Regras essenciais** extraidas da BASE (para o Gem aplicar mesmo quando nao conseguir ler a BASE completa)
- **Checklist obrigatorio** de variedade e qualidade
- **Mapas e guias** de navegacao dos documentos TXT do Knowledge

## Arquivos deste repositorio (ordem de prioridade)

| # | Arquivo | Funcao | Obrigatorio? |
|---|---------|--------|-------------|
| 1 | **RESUMO_EXECUTIVO_BASE.md** | Regras essenciais de escrita (voz, anti-cliche, lexico, variancia) | SIM — ler primeiro |
| 2 | **CHECKLIST_OBRIGATORIO.md** | Checklist de 4 fases para garantir variedade e qualidade | SIM — aplicar em toda geracao |
| 3 | **CRUZAMENTO_RAPIDO.md** | Tabela modo -> quais arquivos TXT abrir | SIM |
| 4 | **GUIA_DE_NAVEGACAO.md** | Passo a passo de como consultar os docs por camadas | Recomendado |
| 5 | **MAPA_DOCUMENTOS.md** | Indice completo de TODOS os documentos do Knowledge | Referencia |

## Como funciona

1. O Gem recebe um pedido do usuario (ex: "modo 1")
2. O Gem le **RESUMO_EXECUTIVO_BASE** para carregar as regras essenciais de escrita
3. O Gem le **CHECKLIST_OBRIGATORIO** para saber como planejar o lote com variedade
4. O Gem consulta **CRUZAMENTO_RAPIDO** para saber quais TXTs abrir
5. O Gem vai aos TXTs do Knowledge e consulta SOMENTE o necessario
6. O Gem aplica o CHECKLIST durante e apos a escrita

## Regras importantes

- Os TXTs do Knowledge sao a **fonte de verdade completa**
- O RESUMO_EXECUTIVO_BASE e um **extrato** das regras mais criticas da BASE
- Se a BASE completa estiver acessivel, consultar as secoes COMPLETAS dela tambem
- O CHECKLIST deve ser executado **silenciosamente** (nao imprimir na saida)
