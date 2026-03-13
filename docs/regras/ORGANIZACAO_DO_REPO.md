# Organização do Repositório

Esta seção documenta a "Regra de Negócio" lógica utilizada por nós (e requerida para ser seguida) no processamento dos arquivos textuais, como foram organizados e quais seus critérios:

## 1. Critérios de Classificação
Cada arquivo inserido passará pelos crivos dessas perguntas fundamentais:
* "Isso representa a identidade fixa ou regra mestre do criador?" (`/knowledge-core`)
* "Posso usar no banco principal, mas não é mandatório ou são apenas bons exemplos?" (`/knowledge-optional`)
* "É um arquivo avulso isolado, representando um Modo específico?" (`/modos`)
* "Este arquivo mistura diferentes subconjuntos de regras ou versões de modo num único .txt?" (`/bundles-legados`)

## 2. Adição de Novos Arquivos Futuros
Se no futuro este repositório for nutrido pelo autor, faça as adições seguindo este fluxo:
1. **Analise seu escopo:** Identifique em qual das 4 perguntas acima ele se encaixa primariamente.
2. **Higiene Filename:** Remova vírgulas, substitua múltiplas pontuações, traços aleatórios e espaços por underscore (`_`).
3. **Commit claro:** "Add novo dataset para MODO 32" e empurre para este rep.

**IMPORTANTE (BONDLE):** PRESERVAR > ORGANIZAR > DOCUMENTAR.
- Nunca invente separação de modos antigos misturados que não seja fiel. Mantenha em `/bundles-legados`.
- Não se rescreve conteúdo de mestre ou sub-diretório de regras sem espelhar uma versão `/patches` correspondente.
