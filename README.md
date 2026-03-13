# openclaw-agents Knowledge Base

## Objetivo
Este repositório serve como a **Fonte Viva de Consulta** do sistema de geração de conteúdo devocional/pastoral. Ele é projetado especificamente para atuar como base de conhecimento (Knowledge) em um GEM/GPT Personalizado.

## Versionamento e Auditoria
O repositório mantém um histórico de auditoria seguro e limpo de todos os prompts, regras, definições de estilo e variações do sistema. Toda mudança efetuada deve ser comitada aqui para preservar legados e assegurar integridade no versionamento contínuo.

> **Aviso:** O repositório reflete uma estruturação voltada ao LLM (GPT/GEM) e consulta humana e **não substitui** a hierarquia lógica interna do seu sistema operacional.

## Estrutura do Repositório
Abaixo está a explicação de cada pasta e seu propósito:

- **`/knowledge-core`**: A fundação do sistema. Contém os arquivos centrais, absolutos e estáveis do seu ambiente pastoral (Ex: PROMPT SYSTEM, BASE DE CONHECIMENTO, ESTILO PESSOAL). **Estes são os arquivos mais importantes do repositório.**
- **`/knowledge-optional`**: Arquivos importantes, mas subordinados ou complementares (Ex: BANCO DE OURO DE EXEMPLOS, CONHECIMENTO COMPILADO).
- **`/modos`**: Arquivos limpos de modos de operação individuais criados ao longo do tempo.
- **`/bundles-legados`**: Versões de arquivos que agrupam múltiplos modos (legado) ou histórico de transições. Preservados para consulta, não devem ser os principais no Knowledge ativo do GPT se modos individuais estiverem disponíveis.
- **`/patches`**: Arquivos de correção, diffs temporários ou pequenos ajustes.
- **`/experimentos`**: Testes, rascunhos e rascunhos em andamento de novos modos de escrita.
- **`/backups`**: Cópias antigas ou segurança de material.
- **`/docs`**: Documentação auxiliar, inventários detalhados, regras de organização futuras e mapeamentos de nomes.

## Candidatos a Upload no GEM/GPT
Para alimentar a "Base Escrita" do GPT/GEM com excelência e sem conflito, os melhores arquivos a serem anexados são todos os contidos em `/knowledge-core` e os principais repertórios em `/knowledge-optional`. Para mais detalhes, veja `/docs/regras/ARQUIVOS_RECOMENDADOS_PARA_KNOWLEDGE.md`.
