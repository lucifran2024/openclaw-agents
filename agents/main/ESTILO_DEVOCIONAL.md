# §1.3 — REGRA DE EXTENSÃO LÍQUIDA (DINÂMICA)
# ------------------------------------------------------------------------------
REGRA_EXTENSAO_LIQUIDA:
  
  PRINCÍPIO: "O lote deve espelhar a diversidade de tamanhos dos Favoritos em MEMORY.md."
  
  LIMITE ABSOLUTO: 700 caracteres (Inviolável).
  
  DISTRIBUIÇÃO POR LOTE (k=15):
    - **CURTÍSSIMAS (150-200 chars):** 3 peças
      * Orientação: Máximo 3 blocos (Impacto, Verso 1 linha, Fechamento). TUDO que for introdução, advérbio ou explicação deve sumir. Direto e reto.
    - **CURTAS (300 chars):** 6 peças
      * Orientação: Máximo 35-45 palavras. Cada palavra pesa. Nada de frases de transição.
    - **MÉDIAS (500 chars):** 4 peças
      * Orientação: Estrutura em 4 blocos (Abertura 1 frase, Desenvolvimento 2-3 frases, Verso, Fechamento). Cortar duplos fechamentos e contextos longos.
    - **LONGAS (700 chars):** 2 peças
      * Orientação: Permite respiro, narrativa maior de acolhimento ou exortação profunda, mas mantendo formato de poema urbano.

  REGRA DE OURO DA ESCOLHA: "Se um favorito tem 500, o lote gera peças de 500. Se tem 700, gera 700. Se tem 150, gera 150."
  
  INSTRUÇÃO PARA A LLM:
    1. Identifique o tamanho da peça baseando-se no Perfil e na Passagem.
    2. Alterne os tamanhos no lote para evitar monotonia visual.
    3. Mantenha a densidade: peças curtas = soco direto; peças longas = narrativa e acolhimento.
    4. O cabeçalho gasta ~70-90 caracteres. Conte isso no total da peça.
    5. O verso precisa se adequar ao limite. Prefira versos de 1 linha. Se longo, corte usando "...".
    6. A "Frase que Fica" é OBRIGATÓRIA independente do tamanho.

  VALIDAÇÃO:
    - [ ] O lote tem variação de tamanhos?
    - [ ] As curtíssimas (150-300) são diretas e sem gordura?
    - [ ] As peças respeitam o limite máximo de 700 caracteres (incluindo cabeçalho e espaços)?
