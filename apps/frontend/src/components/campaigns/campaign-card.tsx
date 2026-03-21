'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Send, Radio, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Campaign, CampaignStatus } from '@/hooks/use-campaigns';

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

const typeLabels: Record<string, string> = {
  broadcast: 'Broadcast',
  triggered: 'Gatilho',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const router = useRouter();
  const status = statusConfig[campaign.status];
  const totalSent = campaign.stats.sent || 0;
  const delivered = campaign.stats.delivered || 0;
  const failed = campaign.stats.failed || 0;
  const deliveryRate =
    totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0;

  return (
    <div
      onClick={() => router.push(`/campaigns/${campaign.id}`)}
      className="cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all hover:border-[var(--color-ring)] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-[var(--color-foreground)]">
            {campaign.name}
          </h3>
          {campaign.description && (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted-foreground)]">
              {campaign.description}
            </p>
          )}
        </div>
        <Badge className={status.className}>{status.label}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
        <span className="inline-flex items-center gap-1">
          {campaign.type === 'broadcast' ? (
            <Radio className="h-3.5 w-3.5" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {typeLabels[campaign.type]}
        </span>

        {campaign.scheduledAt && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(campaign.scheduledAt)}
          </span>
        )}

        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(campaign.createdAt)}
        </span>
      </div>

      {/* Stats mini-bar */}
      {totalSent > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
            <span>
              {delivered} entregues de {totalSent} enviadas
            </span>
            <span>{deliveryRate}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
            <div className="flex h-full">
              <div
                className="bg-green-500 transition-all"
                style={{
                  width: `${totalSent > 0 ? (delivered / totalSent) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-red-400 transition-all"
                style={{
                  width: `${totalSent > 0 ? (failed / totalSent) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
