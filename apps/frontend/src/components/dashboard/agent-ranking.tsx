'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface AgentPerformanceItem {
  agentId: string;
  agentName: string;
  agentEmail: string;
  resolvedCount: number;
  openCount: number;
  avgFrtSeconds: number;
  avgArtSeconds: number;
}

interface AgentRankingProps {
  data: AgentPerformanceItem[];
  isLoading: boolean;
}

function formatSeconds(seconds: number) {
  if (seconds >= 3600) {
    return `${(seconds / 3600).toFixed(1)} h`;
  }

  return `${Math.round(seconds / 60)} min`;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function AgentRanking({ data, isLoading }: AgentRankingProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-[var(--color-foreground)]">
        Ranking de Agentes
      </h3>
      <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
        Ordenado por conversas resolvidas, com FRT e ART medios no periodo.
      </p>

      {data.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Nenhum agente com atividade no periodo selecionado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((agent, index) => (
            <div
              key={agent.agentId}
              className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]">
                  {initials(agent.agentName)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    #{index + 1} {agent.agentName}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {agent.agentEmail || 'Sem email cadastrado'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                  Resolvidas
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
                  {agent.resolvedCount}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {agent.openCount} em aberto
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                  FRT medio
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
                  {formatSeconds(agent.avgFrtSeconds)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                  ART medio
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
                  {formatSeconds(agent.avgArtSeconds)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
