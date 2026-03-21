'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface StatusDonutProps {
  open: number;
  pending: number;
  resolved?: number;
  closed?: number;
  isLoading: boolean;
}

const STATUS_CONFIG = [
  { key: 'open', label: 'Abertas', color: '#3b82f6' },
  { key: 'pending', label: 'Pendentes', color: '#f59e0b' },
  { key: 'resolved', label: 'Resolvidas', color: '#10b981' },
  { key: 'closed', label: 'Fechadas', color: '#6b7280' },
] as const;

export function StatusDonut({ open, pending, resolved = 0, closed = 0, isLoading }: StatusDonutProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <Skeleton className="mb-4 h-5 w-44" />
        <div className="flex items-center justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
      </div>
    );
  }

  const values: Record<string, number> = { open, pending, resolved, closed };
  const chartData = STATUS_CONFIG
    .map((s) => ({ name: s.label, value: values[s.key], color: s.color }))
    .filter((d) => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-[var(--color-foreground)]">
        Conversas por Status
      </h3>
      <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
        Distribuicao atual
      </p>

      {total === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">Sem conversas</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-40 w-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number, name: string) => [`${value}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center total */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[var(--color-foreground)]">{total}</span>
              <span className="text-[10px] text-[var(--color-muted-foreground)]">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {entry.name}
                </span>
                <span className="text-xs font-semibold text-[var(--color-foreground)]">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
