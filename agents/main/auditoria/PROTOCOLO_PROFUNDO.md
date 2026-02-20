# PROTOCOLO PROFUNDO — SCAN/AJUSTE/RESCAN

## Ciclo padrão (obrigatório)
1. **SCAN**: detectar problemas reais (estrutura, paths, A2A, modelo, permissões).
2. **AJUSTE**: aplicar correção mínima e segura (com backup quando estrutural).
3. **RESCAN**: provar que a correção funcionou.

## Regras práticas
- Sem ação destrutiva sem backup.
- Sem “achismo”: toda conclusão precisa de evidência de comando/log.
- Se o ajuste envolve runtime/pasta/base, documentar rollback.

## Evidências mínimas por relatório
- 1 evidência de estrutura (symlink/pasta)
- 1 evidência de paths de INSTRUCTIONS
- 1 evidência de chamada A2A por papel
- 1 evidência de modelo em log

## Formato de evidência
- Arquivo/comando
- Resultado
- Impacto
- Status final
