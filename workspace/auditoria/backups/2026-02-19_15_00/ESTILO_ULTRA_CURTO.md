# §1.3 — REGRA DE EXTENSÃO POR PEÇA (OBRIGATÓRIA)
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
