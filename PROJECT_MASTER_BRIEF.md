CRIE UM PLANO Atue como um Arquiteto de Software Full-Stack Sênior, Engenheiro de IA, Arquiteto de Dados e Especialista em UX/UI para SaaS enterprise.

Quero que você projete do zero uma plataforma profissional omnichannel de atendimento, vendas, campanhas e agendamentos, com foco em alta escala, multi-tenant, operação em tempo real e uso por múltiplos setores: clínicas, salões de beleza, restaurantes, e-commerce, serviços locais e equipes comerciais.

OBSERVAÇÃO DE CONTEXTO — WORKSPACE LIMPA

A pasta atual já foi limpa previamente e deve ser tratada como workspace enxuta para reconstrução do sistema.

Considere que qualquer código, documento ou estrutura antiga relevante já foi removido ou preservado fora desta pasta.
Não perca tempo auditando legado inexistente.

IMPORTANTE:
- construa a nova solução nesta pasta atual
- não crie projeto paralelo
- não duplique aplicação
- não tente reaproveitar arquitetura antiga que não está mais presente
- trate esta pasta como ponto de partida limpo para a nova implementação

Quero que você use esta base limpa para construir a arquitetura correta desde o início, com foco em:
- modularidade
- escalabilidade
- segurança
- multi-tenancy
- evolução segura sem regressão
- código limpo
- baixo acoplamento

Trabalhe por fases, respeitando o escopo pedido em cada etapa.


IMPORTANTE:
Não quero resposta genérica. Quero arquitetura executável, decisões justificadas, schema relacional, eventos, filas, componentes frontend, estrutura backend, segurança, observabilidade e blocos de código reais para iniciar o desenvolvimento.

======================================================================
REGRAS INEGOCIÁVEIS
======================================================================

1. NÃO INVENTE CAPACIDADES DE API.
Antes de desenhar a solução, faça uma MATRIZ DE VIABILIDADE com 3 colunas:
- Suportado oficialmente hoje
- Exige workaround seguro
- Roadmap / opcional / depende de terceiro
Tudo que for WhatsApp, grupos, coexistência, templates, catálogo, pagamentos, 24h window, webhooks e limites deve ser tratado com precisão técnica. Se algo não for oficialmente suportado da forma pedida, sinalize.

2. SEPARE MVP DE V1+.
Estruture a resposta em:
- MVP realista
- Versão enterprise
- Roadmap futuro

3. TECNOLOGIAS-BASE PREFERIDAS
Use como baseline:
- Backend: Node.js + TypeScript
- API: Fastify ou NestJS, mas escolha um e justifique
- Frontend: React + TypeScript
- UI: design system com componentes reutilizáveis
- Banco: PostgreSQL
- Vetores/RAG: pgvector ou arquitetura equivalente justificada
- Cache e filas: Redis + BullMQ
- Tempo real: Socket.IO ou WebSockets equivalentes
- Storage: S3 compatível
- Auth: JWT com refresh token, RBAC e auditoria
- Infra: Docker, CI/CD, ambientes dev/staging/prod

4. ZERO TRUST E MULTI-TENANCY
Toda autorização deve derivar de claims validadas do JWT.
Nunca confie em tenant_id vindo solto no body da requisição.
Todo acesso a banco, cache, filas, eventos e RAG deve ser filtrado por tenant_id.
Quero o isolamento multi-tenant desenhado com Shared Database + tenant_id + Row-Level Security (RLS), preparado para evolução futura para sharding baseado em tenant_id.

5. COMPLIANCE DE MENSAGERIA
Não use hacks para “driblar” detecção.
Não proponha spintax para burlar política.
Quero estratégia de entregabilidade e conformidade:
- consentimento
- segmentação
- opt-in/opt-out
- uso correto de templates
- respeito à janela de atendimento
- pacing/rate limiting seguro
- qualidade de número
- retries/backoff
- auditoria de campanhas
- governança de conteúdo

6. SAÍDA DEVE SER DETALHADA E ESTRUTURADA
Ao final, entregue:
- arquitetura geral
- diagrama textual dos serviços
- schema do banco
- políticas RLS
- eventos e filas
- endpoints principais
- estrutura de pastas
- componentes React
- trechos de código essenciais
- plano de implantação
- checklist de segurança
- checklist de testes
- riscos e trade-offs

======================================================================
OBJETIVO DE PRODUTO
======================================================================

Quero uma plataforma SaaS multi-tenant de atendimento e operação de negócios, com estes pilares:

- Inbox omnichannel com foco principal em WhatsApp
- Atendimento humano + IA + automação baseada em regras
- Kanban operacional como motor central
- Dashboard executivo com KPIs reais e rastreáveis
- Agendamentos/reservas multi-setor
- Campanhas, jornadas, templates e etiquetas
- Tempo real em todas as telas
- Segurança, auditoria, observabilidade e escalabilidade enterprise

======================================================================
ESCOPO FUNCIONAL OBRIGATÓRIO
======================================================================

MÓDULO 1 — DASHBOARD EXECUTIVO, DESIGN SYSTEM E UX PROFISSIONAL
Crie a arquitetura visual e funcional do dashboard aplicando:
- regra dos 5 segundos
- divulgação progressiva
- padrão de leitura F/Z
- mobile-first
- WCAG 2.1 AA
- skeleton screens
- microinterações rápidas
- tooltips de “linhagem do dado” explicando fórmula e origem de cada KPI
- widgets rearranjáveis
- abas superiores com, no mínimo:
  1. Visão Geral
  2. Conversas
  3. Kanban
  4. Agendamentos
  5. Campanhas
  6. Contatos
  7. Relatórios
  8. Configurações

KPIs obrigatórios:
- First Response Time (FRT)
- Average Resolution Time (ART)
- First Contact Resolution (FCR)
- SLA Compliance
- CSAT
- NPS
- Customer Effort Score (CES)
- AI Deflection Rate
- Agent Utilization Rate
- Cost Per Ticket (CPT)
- backlog por fila
- aging por etapa
- throughput
- taxa de abandono
- conversão de agendamento/reserva
- receita por canal/campanha
- taxa de no-show
- taxa de reabertura
- tempo em violação de SLA

Quero fórmulas explícitas, periodicidade de cálculo, origem dos dados e estratégia de materialização/cache.

MÓDULO 2 — KANBAN AVANÇADO COMO MOTOR CENTRAL
O Kanban deve ser o centro operacional do sistema.
Requisitos:
- colunas configuráveis por tenant
- WIP limits por coluna e por swimlane
- swimlanes por setor, prioridade, profissional, unidade ou SLA
- cards com bloqueadores
- regras visuais para risco de SLA
- Definition of Ready e Definition of Done configuráveis
- automações para:
  - mover card inativo
  - escalar ticket parado
  - destacar violação iminente
  - reencaminhar conforme regras
- visualização alternável:
  - cards
  - lista
  - tabela
  - calendário quando aplicável
- métricas avançadas:
  - CFD (Cumulative Flow Diagram)
  - Cycle Time Scatterplot
  - Lead Time
  - Throughput
  - Aging WIP

Quero mostrar como implementar WIP de forma prática para clínicas, restaurantes e atendimento comercial.

MÓDULO 3 — INBOX OMNICHANNEL E ATENDIMENTO
Desenhe uma inbox profissional com:
- lista de conversas
- painel do cliente/contato
- histórico completo
- etiquetas
- notas internas
- anexos e mídia
- timeline de eventos
- SLA visível
- cronômetro da janela de atendimento
- transferência com contexto
- resumo automático do caso
- quick replies
- atalhos
- busca global
- filtros salvos
- visualização por time/agente/fila
- presença e colaboração de equipe
- handoff com resumo para humano e transcrição completa

MÓDULO 4 — WHATSAPP OFICIAL, COEXISTÊNCIA, GRUPOS E COMMERCE
Quero a solução desenhada com precisão para WhatsApp oficial.
Inclua:
- onboarding técnico
- Cloud API
- coexistência com WhatsApp Business App, quando aplicável
- sincronização de histórico e espelhamento de mensagens
- envio e recepção via webhook
- recibos de entrega/leitura
- contatos
- templates
- analytics
- qualidade
- controle de janela de 24 horas
- templates pagos quando necessário
- catálogo/commerce
- links de pagamento
- mensagens interativas compatíveis
- grupos, se oficialmente suportados no cenário descrito
- matriz clara de:
  - suportado agora
  - suportado parcialmente
  - não suportado / precisa workaround

Não quero suposições. Quero arquitetura aderente à realidade oficial.

MÓDULO 5 — CHATBOT COM IA MULTI-AGENTE
Projete um pipeline com pelo menos 5 agentes:
1. Classificador de intenção e sentimento
2. Roteador por setor/fila/swimlane
3. Agente de resposta com RAG
4. Agente de escalonamento para humano
5. Agente de captura de conhecimento

Requisitos:
- RAG com isolamento estrito por tenant_id
- filtros por tenant_id na camada de retrieval
- versionamento da base de conhecimento
- feedback loop humano
- confiança/score por resposta
- fallback para humano
- trilha de decisão
- guardrails
- redaction de dados sensíveis quando necessário
- resumo do atendimento gerado no handoff
- aprendizado a partir de tickets resolvidos por humanos, com revisão/aprovação se necessário

Quero a arquitetura do pipeline, os eventos entre agentes, contratos de entrada/saída e como evitar vazamento entre tenants.

MÓDULO 6 — CHATBOT SEM IA / NO-CODE / REGRAS
Além da IA, quero um construtor visual sem código para automações tradicionais:
- árvore de decisão
- gatilhos por palavra-chave
- menus
- respostas rápidas
- formulários simples
- captura de dados
- reuso de blocos
- versão e publicação
- simulação/teste de fluxo
- fallback para humano
- integração com agenda e CRM

Quero:
- schema para armazenar os fluxos
- modelagem de nós e transições
- componentes React do builder visual
- engine de execução no backend

MÓDULO 7 — CONTATOS, ETIQUETAS, CRM LEVE E SEGMENTAÇÃO
Quero um módulo de contatos com:
- perfil do cliente
- múltiplos canais
- tags/labels coloridas
- campos customizados
- consentimentos
- origem do lead
- histórico de interações
- score
- segmentação dinâmica
- listas inteligentes
- notas
- responsáveis
- última ação
- valor estimado
- status do funil

MÓDULO 8 — CAMPANHAS, JORNADAS E ENTREGABILIDADE
Quero um motor de campanhas assíncrono com BullMQ + Redis.
Requisitos:
- filas por tenant
- filas por tipo de campanha
- agendamento
- throttling
- pacing seguro
- retries com exponential backoff
- DLQ (Dead Letter Queue)
- idempotência
- tracking por mensagem
- pause/resume
- cancelamento
- opt-out automático
- supressão de contatos
- auditoria de conteúdo
- monitoramento de qualidade
- templates aprovados
- segmentação
- personalização legítima via variáveis e dados do contato
- warm-up/governança de reputação de número sem hacks
- limites operacionais configuráveis
- trilha de compliance

Quero o desenho completo da fila, workers, retries, backoff, DLQ e monitoramento.

MÓDULO 9 — AGENDAMENTOS E RESERVAS MULTI-SETOR
A plataforma deve servir para:
- clínica: consulta/profissional/sala/unidade
- salão: serviço/profissional/duração
- restaurante: mesa/turno/capacidade
- serviços: visita/slot/técnico
- comercial: demos/reuniões/retornos

Requisitos:
- agenda nativa
- disponibilidade em tempo real
- bloqueios
- buffers
- remarcação
- cancelamento
- no-show
- fila de espera
- confirmação automática
- lembretes
- integração com bot e inbox
- visão calendário + lista + Kanban
- regras por setor
- recursos compartilhados
- timezone
- multiunidade

Quero o modelo relacional completo para agenda, reservas, profissionais, recursos, serviços, regras e waitlist.

MÓDULO 10 — TEMPO REAL, WEBSOCKETS E EVENTOS
Desenhe a infraestrutura de tempo real para:
- novas mensagens
- mudança de card
- atualização de KPIs
- presença de agentes
- alertas de SLA
- status de campanha
- alterações de agenda

Requisitos:
- Socket.IO ou equivalente
- Redis Pub/Sub
- Redis adapter
- sticky sessions quando necessário
- ping/pong e keepalive
- controle de backpressure
- identificação e limpeza de zombie sockets
- rooms por tenant/equipe/conversa
- autenticação segura no handshake
- escalabilidade horizontal

Explique arquitetura single-node e multi-node.

MÓDULO 11 — BANCO DE DADOS, RLS E PREPARO PARA SHARDING
Modele o PostgreSQL com:
- tenant_id em tabelas críticas
- RLS obrigatória
- políticas por operação
- auditoria
- índices
- partições onde fizer sentido
- preparação para hash-based sharding por tenant_id
- estratégia para right to be forgotten
- soft delete vs hard delete com justificativa
- exclusão segura de vetores/RAG
- impacto em filas e referências

Quero:
- schema SQL
- tabelas principais
- relacionamentos
- índices
- políticas RLS exemplo
- estratégia de migração
- estratégia de connection pooling com PgBouncer ou equivalente

MÓDULO 12 — SEGURANÇA, IAM, RBAC E AUDITORIA
Inclua:
- autenticação JWT
- refresh token rotation
- RBAC por tenant, equipe, unidade e recurso
- permissões finas
- trilha de auditoria
- login seguro
- rate limit
- proteção CSRF quando aplicável
- secrets management
- criptografia em trânsito e em repouso
- mascaramento de PII
- logs auditáveis
- sessões
- impersonation administrativa auditada
- política de retenção
- segurança de webhooks
- assinatura/verificação de eventos externos

MÓDULO 13 — ONBOARDING, WHITE-LABEL E EXPERIÊNCIA DO TENANT
Quero:
- onboarding guiado
- sample data para tenant novo
- theming dinâmico por tenant
- logo/cores/branding
- presets por vertical (clínica/salão/restaurante/e-commerce)
- wizard de configuração
- status de integração
- checklist de ativação

MÓDULO 14 — OBSERVABILIDADE, OPERAÇÃO E RESILIÊNCIA
Inclua:
- structured logging
- tracing
- métricas técnicas
- health checks
- alertas
- dashboards operacionais
- SLO/SLI
- circuit breaker onde fizer sentido
- retries conscientes
- idempotência
- outbox/inbox pattern se necessário
- backups
- restore testado
- disaster recovery
- feature flags
- controle de versão de schema
- CI/CD
- ambientes dev/staging/prod

MÓDULO 15 — BILLING, LIMITES E GOVERNANÇA SAAS
Como é um SaaS, inclua:
- plano por tenant
- limites por uso
- cotas por usuário/canal/mensagens/agendamentos
- overage
- billing hooks
- bloqueios graduais
- trilha de consumo
- separação entre recursos contratados e recursos usados

MÓDULO 16 — RELATÓRIOS E EXPORTAÇÕES
Inclua:
- relatórios por canal
- por agente
- por equipe
- por unidade
- por campanha
- por agenda
- por vertical
- exportação CSV/XLSX/PDF
- filtros persistidos
- snapshots agendados
- relatórios executivos e operacionais

======================================================================
ENTREGÁVEIS OBRIGATÓRIOS DA SUA RESPOSTA
======================================================================

Entregue sua resposta exatamente nesta ordem:

1. MATRIZ DE VIABILIDADE
Liste o que é:
- suportado oficialmente hoje
- suportado com workaround
- roadmap / opcional
Especialmente para WhatsApp, grupos, coexistência, templates, pagamentos, catálogo, 24h window e limitações.

2. VISÃO GERAL DA ARQUITETURA
Mostre:
- contexto
- serviços
- fronteiras
- fluxos principais
- decisões de stack e trade-offs

3. DIAGRAMA TEXTUAL DA SOLUÇÃO
Descreva serviços e comunicação entre eles.

4. MODELAGEM DE DADOS
Forneça:
- tabelas
- colunas principais
- relacionamentos
- índices
- campos tenant_id
- campos auditáveis
- tabelas de agenda
- tabelas de inbox
- tabelas de campanhas
- tabelas do builder sem IA
- tabelas do RAG/knowledge base

5. EXEMPLOS DE SQL
Inclua:
- CREATE TABLE essenciais
- RLS example policies
- índices
- constraints

6. ARQUITETURA RAG
Explique:
- ingestão
- chunking
- embeddings
- retrieval com tenant_id
- versionamento
- feedback loop
- exclusão segura
- observabilidade do RAG

7. EVENTOS, FILAS E WORKERS
Desenhe:
- BullMQ queues
- retries
- exponential backoff
- DLQ
- agendamentos
- workers
- eventos Redis Pub/Sub
- rooms WebSocket

8. BACKEND
Forneça:
- estrutura de pastas
- módulos
- contratos
- middlewares
- auth
- tenant context
- webhook handlers
- exemplos de código Node.js/TypeScript
- endpoint examples

9. FRONTEND
Forneça:
- árvore de páginas
- árvore de componentes React
- estado global
- queries/mutations
- telas principais
- design das abas
- componentes do Kanban
- componentes do inbox
- componentes da agenda
- componentes do builder no-code
- widgets do dashboard
- exemplos de código React/TypeScript

10. UX/UI
Explique:
- hierarquia visual
- regras de mobile-first
- acessibilidade
- skeleton states
- empty states
- sample data
- theming/white-label
- data lineage nos KPIs

11. SEGURANÇA E COMPLIANCE
Entregue:
- matriz de ameaças
- controles
- JWT claims
- RBAC
- RLS
- auditoria
- LGPD
- right to be forgotten
- retenção
- minimização de dados

12. OBSERVABILIDADE E OPERAÇÃO
Inclua:
- logs
- métricas
- tracing
- alertas
- dashboards
- runbooks
- backup/restore

13. ROADMAP DE IMPLEMENTAÇÃO
Separe em fases:
- Fase 1: MVP
- Fase 2: enterprise core
- Fase 3: escala e otimização

14. CHECKLIST FINAL
Inclua:
- checklist de arquitetura
- checklist de segurança
- checklist de UX
- checklist de banco
- checklist de filas
- checklist de testes

15. CÓDIGO INICIAL
No final, entregue um “starter kit” com:
- estrutura monorepo sugerida
- arquivos principais
- exemplos reais de código para backend e frontend
- ordem recomendada de implementação

======================================================================
REGRAS DE QUALIDADE DA SUA RESPOSTA
======================================================================

- Não seja superficial.
- Não escreva texto de marketing.
- Não invente endpoint nem recurso inexistente.
- Quando houver ambiguidade, sinalize.
- Quando algo tiver risco operacional, jurídico ou técnico, destaque.
- Justifique escolhas.
- Prefira precisão a volume.
- Onde houver decisão importante, mostre trade-off.
- Sempre diferencie o que é:
  - obrigatório para MVP
  - recomendável para enterprise
  - opcional para roadmap

15. Plataforma SaaS Operável e Comercializável
Além de tudo acima, inclua obrigatoriamente:
- Billing completo: planos, add-ons, trial, proration, dunning, cobrança por uso, cotas, entitlements e portal do cliente
- Tenant lifecycle: provisionamento, onboarding, upgrade, downgrade, suspensão, reativação, encerramento, exportação e purge seguro
- Super Admin: painel global da operação SaaS com visão de tenants, uso, incidentes, filas, integrações e billing
- API pública + Webhooks: autenticação por chave, rate limit, versionamento, idempotência e documentação OpenAPI
- SSO/MFA/SCIM: autenticação enterprise e provisionamento automatizado de usuários
- Busca global unificada com filtros e permissões
- Feature flags, rollout gradual, kill switch e configuração por tenant
- Observabilidade completa com traces, métricas, logs correlacionados e error tracking
- FinOps: custo por tenant, por canal, por campanha e por uso de IA
- Centro de consentimento e governança LGPD
- Disaster Recovery, restore testado, runbooks e status page



16. Arquitetura para Evolução Segura e Mudanças sem Regressão

Quero que a plataforma seja projetada explicitamente para permitir novas funções, refatorações e atualizações sem quebrar módulos já existentes.

Exijo que a arquitetura siga estas regras:

- Modularidade forte: prefira iniciar como Modular Monolith bem separado por domínios (Inbox, Kanban, Agendamentos, Campanhas, Contatos, Billing, IAM, IA, Relatórios), com fronteiras claras, baixo acoplamento e sem dependências circulares.
- Contratos públicos explícitos: toda comunicação entre módulos e APIs deve ter contratos bem definidos, tipados e documentados.
- Versionamento: use Semantic Versioning para APIs públicas, eventos e SDKs internos, deixando claro o que é mudança compatível e o que é breaking change.
- Compatibilidade retroativa: toda alteração crítica deve ser feita com estratégia backward-compatible sempre que possível.
- Migrações seguras: toda mudança de banco deve seguir o padrão Expand → Migrate → Contract, evitando quebrar código antigo durante deploys graduais.
- Testes anti-regressão em camadas:
  - testes unitários por domínio
  - testes de integração por módulo
  - testes de contrato entre consumidores e provedores
  - smoke tests de rotas críticas
  - testes end-to-end dos fluxos principais
- Contract Testing obrigatório: use contratos verificáveis entre frontend/backend e entre serviços internos, para impedir que uma mudança em um provider quebre consumidores existentes.
- Feature Flags: toda função nova de risco deve nascer atrás de feature flag, com rollout gradual por tenant/equipe e kill switch imediato.
- Depreciação formal: toda API, evento, campo ou comportamento antigo deve ter política de depreciação, janela de convivência e plano de remoção.
- Eventos versionados: eventos assíncronos devem ter versionamento e estratégia de compatibilidade para consumidores antigos.
- Anti-corruption layer para integrações externas: mudanças em APIs externas (ex: WhatsApp, pagamentos) não devem vazar para o resto do sistema.
- Idempotência: jobs, webhooks e processamentos assíncronos devem ser idempotentes para evitar efeitos colaterais em retries.
- Observabilidade de regressão: instrumente logs, métricas e traces correlacionados por request_id, tenant_id, user_id e workflow_id para detectar rapidamente que mudança quebrou qual fluxo.
- Rollback seguro: todo deploy deve permitir rollback sem corromper banco, filas ou contratos.
- ADRs obrigatórios: registre decisões arquiteturais importantes para que futuras alterações não quebrem premissas antigas.
- Definition of Done técnico: nenhuma feature pode ser considerada pronta sem testes, métricas, logs, documentação, rollback plan e avaliação de impacto em módulos existentes.

Além disso, entregue:
1. uma estratégia de versionamento de APIs e eventos
2. uma estratégia de migração segura de banco
3. uma matriz de dependências entre módulos
4. um plano de testes anti-regressão
5. um modelo de feature flags e rollout progressivo
6. exemplos práticos de como adicionar uma nova função sem quebrar as já existentes
7. exemplos práticos de como alterar schema de banco sem derrubar o sistema


CRIE UM PLANO PARA Agora produzIR a arquitetura completa.