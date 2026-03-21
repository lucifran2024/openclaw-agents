'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface CfdColumn {
  id: string;
  name: string;
  color?: string;
}

interface CfdChartProps {
  data: Array<Record<string, string | number>>;
  columns: CfdColumn[];
  isLoading: boolean;
}

const FALLBACK_COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

export function CfdChart({ data, columns, isLoading }: CfdChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <Skeleton className="mb-4 h-5 w-52" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (!columns.length || !data.length) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-[var(--color-foreground)]">
          Cumulative Flow Diagram
        </h3>
        <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
          Evolucao acumulada de cards por coluna ao longo do periodo selecionado.
        </p>
        <div className="flex h-72 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Escolha um board com historico para visualizar o fluxo acumulado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-[var(--color-foreground)]">
        Cumulative Flow Diagram
      </h3>
      <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
        A largura das faixas mostra onde o fluxo acumula trabalho ao longo do tempo.
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <defs>
            {columns.map((column, index) => {
              const color = column.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
              return (
                <linearGradient key={column.id} id={`gradient-${column.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.45} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {columns.map((column, index) => {
            const color = column.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
            return (
              <Area
                key={column.id}
                type="monotone"
                dataKey={column.id}
                stackId="flow"
                stroke={color}
                fill={`url(#gradient-${column.id})`}
                strokeWidth={2}
                name={column.name}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
