'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  Send,
  CheckCircle2,
  Eye,
  AlertTriangle,
  UserMinus,
  Calendar,
  Radio,
  FileText,
  Users,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCampaign,
  useStartCampaign,
  usePauseCampaign,
  useCancelCampaign,
  type CampaignStatus,
} from '@/hooks/use-campaigns';

const statusConfig: Record<
  CampaignStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Rascunho',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  scheduled: {
    label: 'Agendada',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  running: {
    label: 'Em Execução',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  paused: {
    label: 'Pausada',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  completed: {
    label: 'Finalizada',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PageProps {
  params: Promise<{ campaignId: string }>;
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { campaignId } = use(params);
  const router = useRouter();

  const { data: campaign, isLoading } = useCampaign(campaignId);
  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();
  const cancelCampaign = useCancelCampaign();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Campanha não encontrada
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/campaigns')}>
          Voltar
        </Button>
      </div>
    );
  }

  const status = statusConfig[campaign.status];
  const totalSent = campaign.stats.sent || 0;
  const totalTarget = totalSent + campaign.stats.failed;

  const kpis = [
    {
      label: 'Enviadas',
      value: campaign.stats.sent,
      icon: Send,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Entregues',
      value: campaign.stats.delivered,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Lidas',
      value: campaign.stats.read,
      icon: Eye,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Falhas',
      value: campaign.stats.failed,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Opt-out',
      value: campaign.stats.optedOut,
      icon: UserMinus,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  const canStart = campaign.status === 'draft' || campaign.status === 'scheduled';
  const canPause = campaign.status === 'running';
  const canCancel =
    campaign.status === 'draft' ||
    campaign.status === 'scheduled' ||
    campaign.status === 'running' ||
    campaign.status === 'paused';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/campaigns')}
            className="mt-0.5 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                {campaign.name}
              </h1>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
            {campaign.description && (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {campaign.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canStart && (
            <Button
              onClick={() => startCampaign.mutate(campaignId)}
              disabled={startCampaign.isPending}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {startCampaign.isPending ? 'Iniciando...' : 'Iniciar'}
            </Button>
          )}
          {canPause && (
            <Button
              variant="secondary"
              onClick={() => pauseCampaign.mutate(campaignId)}
              disabled={pauseCampaign.isPending}
              className="gap-2"
            >
              <Pause className="h-4 w-4" />
              {pauseCampaign.isPending ? 'Pausando...' : 'Pausar'}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => cancelCampaign.mutate(campaignId)}
              disabled={cancelCampaign.isPending}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              {cancelCampaign.isPending ? 'Cancelando...' : 'Cancelar'}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-center gap-2">
                <div className={`rounded-lg p-2 ${kpi.bg}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[var(--color-foreground)]">
                {kpi.value.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      {totalTarget > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              Progresso de envio
            </h3>
            <span className="text-sm text-[var(--color-muted-foreground)]">
              {totalSent} / {totalTarget} (
              {Math.round((totalSent / totalTarget) * 100)}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{
                width: `${(totalSent / totalTarget) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Campaign Info */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--color-foreground)]">
          Informações da campanha
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <Radio className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Tipo</p>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {campaign.type === 'broadcast' ? 'Broadcast' : 'Gatilho'}
              </p>
            </div>
          </div>

          {campaign.templateId && (
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Template</p>
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  {campaign.templateId}
                </p>
              </div>
            </div>
          )}

          {campaign.segmentId && (
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Segmento</p>
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  {campaign.segmentId}
                </p>
              </div>
            </div>
          )}

          {campaign.scheduledAt && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Agendada para</p>
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  {formatDate(campaign.scheduledAt)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Criada em</p>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {formatDate(campaign.createdAt)}
              </p>
            </div>
          </div>

          {campaign.startedAt && (
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Iniciada em</p>
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  {formatDate(campaign.startedAt)}
                </p>
              </div>
            </div>
          )}

          {campaign.completedAt && (
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Finalizada em</p>
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  {formatDate(campaign.completedAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Results Table Placeholder */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--color-foreground)]">
          Resultados das mensagens
        </h3>
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Tabela de resultados em breve...
          </p>
        </div>
      </div>
    </div>
  );
}
