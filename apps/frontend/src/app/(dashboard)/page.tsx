'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Clock,
  GitBranch,
  MessageSquare,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { AgentRanking } from '@/components/dashboard/agent-ranking';
import { CfdChart } from '@/components/dashboard/cfd-chart';
import { ChannelBreakdown } from '@/components/dashboard/channel-breakdown';
import { CycleTimeChart } from '@/components/dashboard/cycle-time-chart';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { MessagesChart } from '@/components/dashboard/messages-chart';
import { ResponseTimeChart } from '@/components/dashboard/response-time-chart';
import { SlaGauge } from '@/components/dashboard/sla-gauge';
import { StatusDonut } from '@/components/dashboard/status-donut';
import { WidgetGrid } from '@/components/dashboard/widget-grid';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDashboardAgents,
  useDashboardCfd,
  useDashboardChannels,
  useDashboardCycleTime,
  useDashboardLayout,
  useDashboardNps,
  useDashboardOverview,
  useMessagesHistory,
  useResponseTimeHistory,
  useSaveDashboardLayout,
} from '@/hooks/use-dashboard';
import { useBoards } from '@/hooks/use-kanban';

type DateRange = 'today' | '7d' | '30d';
type DashboardTab = 'overview' | 'advanced';

function getDateRange(range: DateRange) {
  const now = new Date();
  const end = now.toISOString();
  const start = new Date(now);

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
  }

  return { startDate: start.toISOString(), endDate: end };
}

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  );
}

interface DashboardAlertProps {
  title: string;
  description: string;
  details?: string;
  action?: ReactNode;
}

function DashboardAlert({
  title,
  description,
  details,
  action,
}: DashboardAlertProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">{description}</p>
          {details ? (
            <pre className="mt-4 overflow-x-auto rounded-xl border border-amber-200 bg-white/70 px-4 py-3 text-xs leading-6 text-amber-950">
              {details}
            </pre>
          ) : null}
          {action ? <div className="mt-5">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

function DashboardSectionError({
  title,
  description,
  details,
  action,
}: DashboardAlertProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-red-800">{description}</p>
      {details ? (
        <pre className="mt-4 overflow-x-auto rounded-xl border border-red-200 bg-white/70 px-4 py-3 text-xs leading-6 text-red-900">
          {details}
        </pre>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro inesperado ao carregar dados do dashboard.';
}

function getErrorDetails(errors: unknown[]) {
  return errors.map((error) => getErrorMessage(error)).join('\n\n');
}

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'Hoje',
  '7d': '7 dias',
  '30d': '30 dias',
};

const TAB_LABELS: Record<DashboardTab, string> = {
  overview: 'Visao Geral',
  advanced: 'Analytics Avancado',
};

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>('today');
  const [tab, setTab] = useState<DashboardTab>('overview');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [layoutFeedback, setLayoutFeedback] = useState<string | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const { startDate, endDate } = useMemo(() => getDateRange(range), [range]);

  const boardsQuery = useBoards();
  const overviewQuery = useDashboardOverview();
  const responseTime = useResponseTimeHistory(startDate, endDate);
  const messages = useMessagesHistory(startDate, endDate);
  const cfdQuery = useDashboardCfd(selectedBoardId, startDate, endDate);
  const cycleTimeQuery = useDashboardCycleTime(selectedBoardId);
  const agentsQuery = useDashboardAgents(startDate, endDate);
  const channelsQuery = useDashboardChannels(startDate, endDate);
  const npsQuery = useDashboardNps(startDate, endDate);
  const layoutQuery = useDashboardLayout();
  const saveLayout = useSaveDashboardLayout();
  const data = overviewQuery.data;
  const isLoading = overviewQuery.isLoading;

  const overviewErrors = [
    overviewQuery.error,
    responseTime.error,
    messages.error,
  ].filter(Boolean) as unknown[];
  const advancedErrors = [
    boardsQuery.error,
    cfdQuery.error,
    cycleTimeQuery.error,
    agentsQuery.error,
    channelsQuery.error,
    npsQuery.error,
    layoutQuery.error,
  ].filter(Boolean) as unknown[];
  const overviewUnavailable = Boolean(overviewQuery.error && !data);
  const advancedUnavailable = Boolean(advancedErrors.length);

  useEffect(() => {
    if (!selectedBoardId && boardsQuery.data?.length) {
      setSelectedBoardId(boardsQuery.data[0].id);
    }
  }, [boardsQuery.data, selectedBoardId]);

  const selectedBoard = useMemo(
    () => boardsQuery.data?.find((board) => board.id === selectedBoardId) || null,
    [boardsQuery.data, selectedBoardId],
  );

  const formatTrend = (value: number | undefined) => {
    if (value === undefined) return undefined;
    return { value: `${Math.abs(value)}%`, positive: value >= 0 };
  };

  async function handleSaveLayout(
    widgets: NonNullable<typeof layoutQuery.data>['widgets'],
  ) {
    setLayoutFeedback(null);
    setLayoutError(null);

    try {
      await saveLayout.mutateAsync({
        widgets,
        layoutName: layoutQuery.data?.layoutName || 'default',
      });
      setLayoutFeedback('Layout de widgets salvo com sucesso.');
    } catch (error) {
      setLayoutError(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel salvar o layout dos widgets.',
      );
    }
  }

  async function handleRetryOverview() {
    await Promise.allSettled([
      overviewQuery.refetch(),
      responseTime.refetch(),
      messages.refetch(),
    ]);
  }

  async function handleRetryAdvanced() {
    await Promise.allSettled([
      boardsQuery.refetch(),
      cfdQuery.refetch(),
      cycleTimeQuery.refetch(),
      agentsQuery.refetch(),
      channelsQuery.refetch(),
      npsQuery.refetch(),
      layoutQuery.refetch(),
    ]);
  }

  const retryButton = (onClick: () => Promise<void>) => (
    <button
      type="button"
      onClick={() => void onClick()}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:opacity-90"
    >
      <RotateCcw className="h-4 w-4" />
      Tentar novamente
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Monitore a operacao do tenant e aprofunde a leitura de fluxo, canais e agentes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            {(Object.keys(TAB_LABELS) as DashboardTab[]).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === key
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {TAB_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            {(Object.keys(RANGE_LABELS) as DateRange[]).map((key) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === key
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {RANGE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'overview' ? (
        <>
          {overviewErrors.length ? (
            <DashboardAlert
              title={
                overviewUnavailable
                  ? 'Dashboard temporariamente indisponivel'
                  : 'Dashboard carregado parcialmente'
              }
              description={
                overviewUnavailable
                  ? 'Nao foi possivel carregar os dados operacionais do dashboard. Enquanto a API estiver indisponivel, esta aba nao deve ser tratada como fonte valida.'
                  : 'Alguns blocos do dashboard falharam ao carregar. Os cards que aparecem abaixo podem estar incompletos ate a proxima tentativa.'
              }
              details={getErrorDetails(overviewErrors)}
              action={retryButton(handleRetryOverview)}
            />
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isLoading ? (
              <>
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
              </>
            ) : (
              <>
                <KpiCard
                  title="Conversas Abertas"
                  value={overviewUnavailable ? '--' : data?.openConversations ?? 0}
                  icon={<MessageSquare className="h-5 w-5" />}
                  trend={overviewUnavailable ? undefined : formatTrend(data?.openConversationsTrend)}
                  subtitle={
                    overviewUnavailable ? 'indisponivel sem backend' : 'snapshot operacional'
                  }
                />
                <KpiCard
                  title="Tempo Medio de Resposta"
                  value={overviewUnavailable ? '--' : data?.avgResponseTime ?? '--'}
                  icon={<Clock className="h-5 w-5" />}
                  trend={overviewUnavailable ? undefined : formatTrend(data?.avgResponseTimeTrend)}
                  subtitle={overviewUnavailable ? 'indisponivel sem backend' : 'media do periodo'}
                />
                <KpiCard
                  title="SLA Compliance"
                  value={
                    overviewUnavailable
                      ? '--'
                      : data?.slaCompliance !== undefined
                        ? `${data.slaCompliance}%`
                        : '--'
                  }
                  icon={<ShieldCheck className="h-5 w-5" />}
                  trend={overviewUnavailable ? undefined : formatTrend(data?.slaComplianceTrend)}
                  subtitle={overviewUnavailable ? 'indisponivel sem backend' : 'meta: 95%'}
                />
                <KpiCard
                  title="Mensagens Hoje"
                  value={overviewUnavailable ? '--' : data?.messagesToday ?? 0}
                  icon={<Send className="h-5 w-5" />}
                  trend={overviewUnavailable ? undefined : formatTrend(data?.messagesTodayTrend)}
                  subtitle={
                    overviewUnavailable ? 'indisponivel sem backend' : 'enviadas e recebidas'
                  }
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {responseTime.error ? (
              <DashboardSectionError
                title="Serie de tempo de resposta indisponivel"
                description="Nao foi possivel carregar FRT e ART em runtime. O grafico nao deve ser interpretado como vazio enquanto a API estiver fora."
                details={getErrorMessage(responseTime.error)}
                action={retryButton(handleRetryOverview)}
              />
            ) : (
              <ResponseTimeChart data={responseTime.data} isLoading={responseTime.isLoading} />
            )}
            {messages.error ? (
              <DashboardSectionError
                title="Serie de mensagens indisponivel"
                description="Nao foi possivel carregar throughput no periodo selecionado. O grafico foi substituido por um estado de erro explicito."
                details={getErrorMessage(messages.error)}
                action={retryButton(handleRetryOverview)}
              />
            ) : (
              <MessagesChart data={messages.data} isLoading={messages.isLoading} />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {overviewUnavailable ? (
              <DashboardSectionError
                title="SLA indisponivel"
                description="Nao foi possivel carregar o compliance de SLA. Esse bloco so volta a ser confiavel quando a API responder normalmente."
                details={getErrorDetails([overviewQuery.error])}
                action={retryButton(handleRetryOverview)}
              />
            ) : (
              <SlaGauge value={data?.slaCompliance ?? 0} isLoading={isLoading} />
            )}
            {overviewUnavailable ? (
              <DashboardSectionError
                title="Status de conversas indisponivel"
                description="Nao foi possivel carregar o snapshot de abertas e pendentes. O donut foi substituido por um estado de erro para evitar leitura enganosa."
                details={getErrorDetails([overviewQuery.error])}
                action={retryButton(handleRetryOverview)}
              />
            ) : (
              <StatusDonut
                open={data?.openConversations ?? 0}
                pending={data?.pendingConversations ?? 0}
                isLoading={isLoading}
              />
            )}
          </div>
        </>
      ) : (
        <>
          {advancedUnavailable ? (
            <DashboardAlert
              title="Analytics avancado carregado parcialmente"
              description="Parte das consultas do modulo avancado falhou em runtime. Os blocos em erro foram substituidos por estados explicitos para evitar falsos vazios."
              details={getErrorDetails(advancedErrors)}
              action={retryButton(handleRetryAdvanced)}
            />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                Filtros de Analytics
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    Board do Kanban
                  </label>
                  <select
                    value={selectedBoardId || ''}
                    onChange={(event) => setSelectedBoardId(event.target.value || null)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {boardsQuery.data?.length ? (
                      boardsQuery.data.map((board) => (
                        <option key={board.id} value={board.id}>
                          {board.name}
                        </option>
                      ))
                    ) : boardsQuery.error ? (
                      <option value="">Nao foi possivel carregar boards</option>
                    ) : (
                      <option value="">Nenhum board disponivel</option>
                    )}
                  </select>
                  {boardsQuery.error ? (
                    <p className="text-xs text-red-700">
                      {getErrorMessage(boardsQuery.error)}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                    Recorte atual
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-foreground)]">
                    {RANGE_LABELS[range]}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {selectedBoard ? `Board selecionado: ${selectedBoard.name}` : 'Selecione um board para CFD e cycle time.'}
                  </p>
                </div>
              </div>
            </div>

            {npsQuery.error ? (
              <DashboardSectionError
                title="NPS indisponivel"
                description="Nao foi possivel carregar score, tendencia e distribuicao do NPS para o periodo selecionado."
                details={getErrorMessage(npsQuery.error)}
                action={retryButton(handleRetryAdvanced)}
              />
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                  NPS do Periodo
                </p>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-4xl font-bold tracking-tight text-[var(--color-foreground)]">
                      {npsQuery.data?.score ?? 0}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      {npsQuery.data?.totalResponses ?? 0} respostas validas
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--color-primary)]/10 p-3 text-[var(--color-primary)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-[var(--color-background)] px-3 py-2">
                    <p className="text-xs text-[var(--color-muted-foreground)]">Promotores</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
                      {npsQuery.data?.promoters ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-background)] px-3 py-2">
                    <p className="text-xs text-[var(--color-muted-foreground)]">Passivos</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
                      {npsQuery.data?.passives ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-background)] px-3 py-2">
                    <p className="text-xs text-[var(--color-muted-foreground)]">Detratores</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
                      {npsQuery.data?.detractors ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <KpiCard
              title="Board Selecionado"
              value={boardsQuery.error ? '--' : selectedBoard?.name || '--'}
              icon={<GitBranch className="h-5 w-5" />}
              subtitle={
                boardsQuery.error
                  ? 'indisponivel sem backend'
                  : `${boardsQuery.data?.length || 0} boards encontrados`
              }
            />
            <KpiCard
              title="Agentes no Ranking"
              value={agentsQuery.error ? '--' : agentsQuery.data?.length ?? 0}
              icon={<Users className="h-5 w-5" />}
              subtitle={
                agentsQuery.error ? 'indisponivel sem backend' : 'com atividade no periodo'
              }
            />
            <KpiCard
              title="Canais Ativos"
              value={channelsQuery.error ? '--' : channelsQuery.data?.length ?? 0}
              icon={<BarChart3 className="h-5 w-5" />}
              subtitle={
                channelsQuery.error
                  ? 'indisponivel sem backend'
                  : 'com conversas registradas'
              }
            />
            <KpiCard
              title="Tendencia NPS"
              value={
                npsQuery.error
                  ? '--'
                  : npsQuery.data?.trend !== undefined
                  ? `${npsQuery.data.trend > 0 ? '+' : ''}${npsQuery.data.trend}`
                  : '--'
              }
              icon={<Sparkles className="h-5 w-5" />}
              subtitle={
                npsQuery.error
                  ? 'indisponivel sem backend'
                  : 'comparado ao periodo anterior'
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {cfdQuery.error || boardsQuery.error ? (
              <DashboardSectionError
                title="CFD indisponivel"
                description="Nao foi possivel carregar o fluxo cumulativo para o board selecionado."
                details={getErrorMessage(cfdQuery.error || boardsQuery.error)}
                action={retryButton(handleRetryAdvanced)}
              />
            ) : (
              <CfdChart
                columns={cfdQuery.data?.columns || []}
                data={cfdQuery.data?.data || []}
                isLoading={cfdQuery.isLoading}
              />
            )}
            {cycleTimeQuery.error || boardsQuery.error ? (
              <DashboardSectionError
                title="Cycle time indisponivel"
                description="Nao foi possivel carregar os buckets e estatisticas de cycle time."
                details={getErrorMessage(cycleTimeQuery.error || boardsQuery.error)}
                action={retryButton(handleRetryAdvanced)}
              />
            ) : (
              <CycleTimeChart
                buckets={cycleTimeQuery.data?.buckets}
                stats={cycleTimeQuery.data?.stats}
                isLoading={cycleTimeQuery.isLoading}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {agentsQuery.error ? (
              <DashboardSectionError
                title="Ranking de agentes indisponivel"
                description="Nao foi possivel carregar o ranking operacional por agente."
                details={getErrorMessage(agentsQuery.error)}
                action={retryButton(handleRetryAdvanced)}
              />
            ) : (
              <AgentRanking data={agentsQuery.data || []} isLoading={agentsQuery.isLoading} />
            )}
            {channelsQuery.error ? (
              <DashboardSectionError
                title="Breakdown por canal indisponivel"
                description="Nao foi possivel carregar a distribuicao de canais para o periodo selecionado."
                details={getErrorMessage(channelsQuery.error)}
                action={retryButton(handleRetryAdvanced)}
              />
            ) : (
              <ChannelBreakdown
                data={channelsQuery.data || []}
                isLoading={channelsQuery.isLoading}
              />
            )}
          </div>

          {layoutFeedback ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {layoutFeedback}
            </div>
          ) : null}

          {layoutError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {layoutError}
            </div>
          ) : null}

          {layoutQuery.error ? (
            <DashboardSectionError
              title="Layout de widgets indisponivel"
              description="Nao foi possivel carregar o layout salvo do dashboard. O editor de widgets foi ocultado ate a API voltar."
              details={getErrorMessage(layoutQuery.error)}
              action={retryButton(handleRetryAdvanced)}
            />
          ) : (
            <WidgetGrid
              widgets={layoutQuery.data?.widgets || []}
              isLoading={layoutQuery.isLoading}
              isSaving={saveLayout.isPending}
              onSave={handleSaveLayout}
            />
          )}
        </>
      )}
    </div>
  );
}
