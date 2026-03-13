# GUIA DE NAVEGACAO PARA O GEM

> **VOCE (GEM) DEVE LER ESTE ARQUIVO ANTES DE QUALQUER GERACAO.**
> Ele ensina como consultar os documentos do Knowledge de forma eficiente.

---

## REGRA DE OURO

**NAO leia tudo de uma vez.** Consulte por CAMADAS, na ordem correta.

---

## PASSO A PASSO OBRIGATORIO ANTES DE GERAR

### PASSO 1 - RESOLVER O DIA
1. Identifique a data de hoje (use o relogio do sistema)
2. Abra **SECAO6.txt** e encontre APENAS a linha da data de hoje
3. Extraia: PASSAGEM_DO_DIA e REFERENCIA_DO_DIA
4. **PARE.** Nao leia mais nada do SECAO6.

### PASSO 2 - IDENTIFICAR O MODO
1. O usuario vai pedir um MODO (ex: "modo 1", "modo 3.5", "modo master")
2. Localize o arquivo correto usando esta tabela:

| Modo Pedido | Arquivo para Consultar |
|-------------|----------------------|
| Modo 1 | MODO_1.txt |
| Modo 1.2 | M1_2_M1_4_ATE_M1_9.txt (secao MODO 1.2) |
| Modo 1.4 a 1.9 | M1_2_M1_4_ATE_M1_9.txt (secao correspondente) |
| Modo 1.9.5 | MODO_1_9_5.txt |
| Modo 2 | M2_M4_1_M4_2_M4_3.txt (secao MODO 2) |
| Modo 3 | MODO_MASTER_MODO_FIA_M3_AO_M31.txt (secao M3) |
| Modo 3.5 | MODO_3_5_COMPLETO.txt |
| Modo 4.1 a 4.3 | M2_M4_1_M4_2_M4_3.txt (secao correspondente) |
| Modo 5 a 31 | MODO_MASTER_MODO_FIA_M3_AO_M31.txt (secao correspondente) |
| Modo MASTER | MODO_MASTER_MODO_FIA_M3_AO_M31.txt (secao MASTER) |
| Modo FIA | MODO_MASTER_MODO_FIA_M3_AO_M31.txt (secao FIA) |

3. Leia APENAS a secao do modo pedido dentro do arquivo.
4. Identifique: formato, quantidade (k=?), importacoes obrigatorias da BASE.

### PASSO 3 - CONSULTAR A BASE (somente o necessario)
1. O MODO ativo vai listar quais secoes da BASE sao obrigatorias (ex: S3.7, S3.12, S3.20)
2. Abra **BASE_DE_CONHECIMENTO_UNIFICADA_v2.txt**
3. Consulte SOMENTE as secoes listadas pelo modo
4. **PROIBIDO varrer a BASE inteira.** Use o indice S0.99 para localizar rapidamente.

### PASSO 4 - CALIBRAR A VOZ
1. Consulte **MEU_ESTILO_PESSOAL.txt** para ritmo e cadencia
2. Se precisar de espelho de temperatura, consulte **BANCO_DE_OURO_EXEMPLOS.txt**
3. **LEMBRE:** Imitar musica, nunca copiar letra

### PASSO 5 - REPERTORIO OPCIONAL
1. Se o modo permitir e fizer sentido, consulte **CONHECIMENTO_COMPILADO_ESSENCIAL_v1_4.txt**
2. **Maximo:** 0-1 ingrediente forte por geracao
3. **O CCE sempre perde em conflito** com qualquer outro documento

---

## O QUE CONSULTAR QUANDO

### "Preciso saber SOBRE O QUE escrever"
→ SECAO6.txt (passagem do dia)

### "Preciso saber EM QUE FORMATO escrever"
→ Arquivo do MODO ativo (ver tabela acima)

### "Preciso saber COMO escrever bem"
→ BASE_DE_CONHECIMENTO_UNIFICADA_v2.txt (somente secoes exigidas)

### "Preciso calibrar o TOM e RITMO"
→ MEU_ESTILO_PESSOAL.txt

### "Preciso de um ESPELHO de estilo"
→ BANCO_DE_OURO_EXEMPLOS.txt (nao copiar, so sentir a musica)

### "Preciso de um VERSICULO ou TEMA complementar"
→ CONHECIMENTO_COMPILADO_ESSENCIAL_v1_4.txt (opcional, subordinado)

### "Preciso ver EXEMPLOS reais do autor"
→ FAVORITAS.txt (DNA do que o autor gosta)
→ EXEMPLOS_MODO_31.txt (exemplos especificos para M3.5)

---

## RESOLUCAO DE CONFLITOS

Se dois documentos dizem coisas diferentes:

| Dimensao | Quem Vence |
|----------|-----------|
| Conteudo/Tema/Tese | SECAO6.txt (passagem) vence TUDO |
| Formato/Estrutura/Quantidade | MODO ativo vence |
| Regras gerais de redacao | BASE_DE_CONHECIMENTO vence |
| Estilo/Cadencia/Voz | MEU_ESTILO_PESSOAL vence a Base |
| Exemplos e favoritos | NUNCA governam, apenas espelham |

---

## PROIBICOES ABSOLUTAS

1. **NAO** leia o SECAO6 inteiro - so a linha do dia
2. **NAO** varra a BASE inteira - so as secoes exigidas pelo modo
3. **NAO** misture regras de modos diferentes
4. **NAO** copie exemplos literalmente (BANCO_DE_OURO, FAVORITAS, EXEMPLOS)
5. **NAO** invente versiculos se nao tiver certeza
6. **NAO** exponha bastidores, logs, nomes de secoes ou raciocinio interno
7. **NAO** reduza o lote por conveniencia (se o modo pede 15, entregue 15)
8. **NAO** carregue exigencias de um modo para outro

---

## DICA DE PERFORMANCE

Para arquivos GRANDES (como MODO_MASTER com 10.994 linhas), use os marcadores:
- `## INICIO MODO ##` / `## FIM MODO ##` para localizar secoes
- Navegue pelo INDICE ou HEADERS em vez de ler linearmente
- Consulte este MAPA primeiro, depois va ao documento especifico
