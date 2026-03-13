# PVC VOZ 05 - GPS do Knowledge

## O que e este repositorio?

Este repositorio serve como **sistema de navegacao (GPS)** para o Gem PVC VOZ 05.

Ele **NAO contem** os documentos de conhecimento (eles estao carregados diretamente no Knowledge do Gem como TXTs).

Ele contem **mapas e guias** que ajudam o Gem a consultar os documentos do Knowledge de forma mais eficiente e inteligente.

## Arquivos deste repositorio

| Arquivo | Funcao |
|---------|--------|
| **GUIA_DE_NAVEGACAO.md** | Passo a passo de COMO consultar os docs (ler PRIMEIRO) |
| **MAPA_DOCUMENTOS.md** | Indice completo de TODOS os documentos do Knowledge |
| **CRUZAMENTO_RAPIDO.md** | Tabela de referencia cruzada por modo e por situacao |

## Como funciona

1. O Gem recebe um pedido do usuario (ex: "modo 1")
2. O Gem consulta o **GUIA_DE_NAVEGACAO** para saber a ordem correta de leitura
3. O Gem consulta o **MAPA_DOCUMENTOS** para entender o que tem em cada arquivo
4. O Gem consulta o **CRUZAMENTO_RAPIDO** para saber quais arquivos abrir para aquele modo
5. O Gem vai aos TXTs do Knowledge e consulta SOMENTE o necessario

## Regra importante

Os documentos do Knowledge (TXTs) sao a **fonte de verdade**.
Este repositorio e apenas um **guia de navegacao** - ele nao substitui nenhum documento.
