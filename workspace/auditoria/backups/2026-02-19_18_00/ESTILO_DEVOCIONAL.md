# §1.3 — REGRA DE EXTENSÃO POR PEÇA (OBRIGATÓRIA)
# ------------------------------------------------------------------------------
REGRA_EXTENSAO_POR_PECA:
  
  LIMITE_ABSOLUTO:
    caracteres_maximo: 500
    nota: |
      500 caracteres é o novo limite de STATUS (WhatsApp/Instagram).
      TUDO conta: cabeçalho, corpo, verso, fechamento, quebras de linha.
      O cabeçalho ([FAMÍLIA] ID — Nome + 📖 Leitura do dia:) consome ~70-90 caracteres.
      Sobram ~410 caracteres para corpo + verso + fechamento.
      Isso equivale a ~60-80 palavras no corpo (sem contar cabeçalho).
  
  limite_em_palavras:
    corpo_texto: "60–80 palavras (SEM contar cabeçalho e referência bíblica)"
    total_com_tudo: "80–100 palavras máximo (contando verso e referência)"
  
  excecoes: "NENHUMA. O limite de 500 caracteres é INVIOLÁVEL."
  
  estrutura_compacta:
    regra: |
      Com 500 caracteres, cada palavra precisa PESAR.
      ZERO gordura. ZERO frase de transição desnecessária.
      
      ESTRUTURA IDEAL (4 blocos, não 5):
      1. ABERTURA: 1 frase de impacto (redefinição ou gancho) — ~10-15 palavras
      2. DESENVOLVIMENTO: 2-3 frases curtas — ~20-30 palavras
      3. VERSO: 1 verso curto com referência — ~15-20 palavras
      4. FECHAMENTO: 1 frase — ~5-10 palavras
      
      TOTAL: ~60-80 palavras
    
    o_que_cortar:
      - "Contexto histórico extenso (máximo 1 frase de contexto)"
      - "Explicação do verso (o verso deve falar por si)"
      - "Frases de transição ('E sabe o que isso significa?', 'Mas pensa comigo:')"
      - "Desenvolvimento longo (máximo 3 frases entre abertura e verso)"
      - "Duplo fechamento (1 frase de aplicação + 1 frase extra = cortar a extra)"
    
    o_que_manter:
      - "Abertura de impacto (redefinição ou gancho)"
      - "1 verso bíblico (escolher o mais CURTO e FORTE da passagem)"
      - "1 frase que fica"
      - "Fechamento cortante"
  
  estrutura_visual_compacta: |
    Mesmo com menos palavras, manter o formato de POEMA URBANO.
    Frases isoladas. Quebras de linha. Respira.
    
    EXEMPLO 500 CARACTERES:
    
    [JORNADA] J08 — Confrontar Ídolos
    
    📖 Leitura do dia: Jeremias 49-50
    
    **Segurança que não vem de Deus tem prazo de validade.**
    
    Amom confiava nos tesouros. Edom na altura.
    A gente confia no cargo, no saldo e na reputação.
    Mas ídolo moderno não é estásua. É o que ocupa o lugar dEle.
    
    "A sua arrogância te enganou... de lá eu te derrubarei." (Jeremias 49:16)
    
    Desça antes que caia.
    
    ← ISSO TEM ~450 CARACTERES. CABE NO STATUS.
  
  escolha_do_verso:
    regra: |
      Com limite de caracteres, o VERSO precisa ser CURTO.
      PREFERIR versos de 1 linha (até 60 caracteres).
      
      SE o verso ideal da passagem for longo (2+ linhas):
      → Usar apenas a parte mais forte (ex: só a segunda metade)
      → OU usar "..." para indicar corte
      → Formato: "...de lá eu te derrubarei." (Jeremias 49:16)
      
      NUNCA omitir o verso. Apenas encurtar.
  
  frase_que_fica:
    regra: |
      CADA peça DEVE ter pelo menos 1 frase que o leitor lembraria no banho.
      Com limite de 500 caracteres, a frase que fica é AINDA MAIS IMPORTANTE.
    
    teste: "Qual frase desta peça alguém printaria?"
    se_nao_encontrar: "Reescrever até criar uma."
  
  validacao_final:
    regra: |
      ANTES de entregar cada peça:
      1. Contar caracteres (incluindo espaços e quebras de linha)
      2. SE > 500 → CORTAR frases de menor impacto
      3. SE < 350 → Está curto demais, pode adicionar 1 frase
      4. ALVO: 400-500 caracteres por peça
      
      PRIORIDADE DE CORTE (o que sai primeiro):
      1. Contexto histórico extenso
      2. Frases de transição
      3. Explicação do verso
      4. Segunda frase do fechamento
      
      NUNCA CORTAR:
      - Abertura de impacto
      - Verso bíblico
      - Frase que fica
      - Fechamento principal# §1.3 — REGRA DE EXTENSÃO POR PEÇA (OBRIGATÓRIA)
# ------------------------------------------------------------------------------
REGRA_EXTENSAO_POR_PECA:
  
  LIMITE_ABSOLUTO:
    caracteres_maximo: 300
    nota: |
      300 caracteres é o limite REAL de leitura rápida no Status (sem "ver mais").
      TUDO conta: cabeçalho, corpo, verso, fechamento, quebras de linha.
      O cabeçalho ([FAMÍLIA] ID — Nome + 📖 Leitura do dia:) consome ~70-80 caracteres.
      Sobram ~220 caracteres para o resto (~35-40 palavras).
  
  limite_em_palavras:
    total_com_tudo: "35–45 palavras máximo (contando verso e referência)"
  
  excecoes: "NENHUMA. O limite de 300 caracteres é INVIOLÁVEL."
  
  estrutura_ultra_compacta:
    regra: |
      Máximo de 6 a 8 linhas de texto NO TOTAL.
      
      ESTRUTURA OBRIGATÓRIA (3 blocos):
      1. IMPACTO: 1 frase de impacto — ~10 palavras
      2. VERSO: 1 verso curto (máx 1 linha) — ~10-15 palavras
      3. FECHAMENTO: 1 frase curta — ~5 palavras
    
    o_que_cortar:
      - "Toda e qualquer introdução"
      - "Contexto histórico e explicações"
      - "Advérbios (-mente)"
    
  exemplo: |
    [JORNADA] J08 — Confrontar Ídolos
    📖 Leitura do dia: Jeremias 49-50
    
    **Segurança sem Deus é castelo de areia.**
    Ídolo não é estásua, é o que ocupa o lugar dEle.
    
    "A sua arrogância te enganou... de lá eu te derrubarei." (Jr 49:16)
    
    Desça antes que caia.
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
