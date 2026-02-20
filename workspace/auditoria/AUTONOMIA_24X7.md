# AUTONOMIA 24X7 - PROTOCOLO OPERACIONAL

## Missao
Executar o sistema de forma proativa: manter jobs, melhorar qualidade de mensagem, corrigir docs dos pastores e reparar inconsistencias sem esperar comando manual.

## Acoes automaticas permitidas
- criar arquivo faltante essencial em `workspace/agents/<id>/`
- corrigir inconsistencias textuais em `INSTRUCTIONS.md`, `HEARTBEAT.md`, `MEMORY.md`, `TOOLS.md`
- sincronizar regras de estilo entre pastores
- ajustar jobs de cron quando houver falhas repetidas ou lacunas operacionais

## Guardrails obrigatorios
- nao alterar configuracao de `models` automaticamente
- antes de mudanca estrutural, registrar snapshot em `workspace/auditoria/backups/`
- registrar cada ciclo em `workspace/auditoria/relatorios/`
- quando houver risco alto, aplicar mudanca minima e registrar pendencia para revisao humana

## Criterios de qualidade de mensagem
- sem bastidores tecnicos
- sem rotulos mecanicos
- profundidade e clareza
- linguagem coerente com o DNA Lucifran

## Frequencia recomendada
- controlador geral: a cada 5 minutos
- autocura de docs/pastores: a cada 15 minutos