# §1.3 — REGRA DE EXTENSÃO LÍQUIDA (DINÂMICA)
# ------------------------------------------------------------------------------
REGRA_EXTENSAO_LIQUIDA:
  
  PRINCÍPIO: "O lote deve espelhar a diversidade de tamanhos dos Favoritos em MEMORY.md."
  
  DISTRIBUIÇÃO OBRIGATÓRIA POR LOTE (k=15):
    - **CURTÍSSIMAS (150-200 chars):** 3 peças (Estilo "Tempo de Deus" / "Mentirinha")
    - **CURTAS (300 chars):** 6 peças (Estilo "Davi no Campo" / "Oficina")
    - **MÉDIAS (500 chars):** 4 peças (Estilo "Limites no Amor" / "Gálatas 6:5")
    - **LONGAS (700 chars):** 2 peças (Estilo "Cuidado e Misericórdia" / "Salmos 41:1")

  LIMITE ABSOLUTO: 700 caracteres (Inviolável).
  
  REGRA DE OURO: "Se um favorito tem 500, o lote gera peças de 500. Se tem 700, gera 700. Se tem 150, gera 150."
  
  INSTRUÇÃO PARA A LLM:
    1. Identifique o tamanho da peça baseando-se no Perfil e na Passagem.
    2. Alterne os tamanhos no lote para evitar monotonia visual.
    3. Mantenha a densidade: peças curtas = soco direto; peças longas = narrativa e acolhimento.

  VALIDAÇÃO:
    - [ ] O lote tem pelo menos 3 variações de tamanho?
    - [ ] As peças longas (700) respeitam o respiro e parágrafos?
    - [ ] As curtíssimas (150) são diretas e sem gordura?
    - [ ] PROIBIDO: Incluir metadados como "(Lote variado: X chars)" ou qualquer log técnico no balão da mensagem. O texto deve vir limpo.
