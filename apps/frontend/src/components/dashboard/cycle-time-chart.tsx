'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface CycleTimeBucket {
  label: string;
  count: number;
}

interface CycleTimeStats {
  avgHours: number;
  p50Hours: number;
  p90Hours: number;
  totalCards: number;
}

interface CycleTimeChartProps {
  buckets?: CycleTimeBucket[];
  stats?: CycleTimeStats;
  isLoading: boolean;
}

function formatHours(value: number) {
  if (value >= 24) {
    return `${(value / 24).toFixed(1)} d`;
  }

  return `${value.toFixed(1)} h`;
}

export function CycleTimeChart({ buckets = [], stats, isLoading }: CycleTimeChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <Skeleton className="mb-4 h-5 w-44" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (!stats?.totalCards) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-[var(--color-foreground)]">
          Distribuicao de Cycle Time
        </h3>
        <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
          Histograma dos cards que ja alcançaram uma coluna terminal.
        </p>
        <div className="flex h-72 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Ainda nao ha cards concluidos suficientes para calcular cycle time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="mb-1 text-base font-semibold text-[var(--color-foreground)]">
            Distribuicao de Cycle Time
          </h3>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Visao rapida da dispersao de tempo entre entrada no fluxo e etapa terminal.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[var(--color-background)] px-3 py-2">
            <p className="text-xs text-[var(--color-muted-foreground)]">Media</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
              {formatHours(stats.avgHours)}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-background)] px-3 py-2">
            <p className="text-xs text-[var(--color-muted-foreground)]">P50</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
              {formatHours(stats.p50Hours)}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-background)] px-3 py-2">
            <p className="text-xs text-[var(--color-muted-foreground)]">P90</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
              {formatHours(stats.p90Hours)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={buckets} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.45} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
              formatter={(value: number) => [`${value}`, 'Cards']}
            />
            <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
