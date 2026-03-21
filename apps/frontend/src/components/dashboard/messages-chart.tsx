'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface MessagesChartProps {
  data: Array<{ time: string; mensagens: number }>;
  isLoading: boolean;
}

export function MessagesChart({ data, isLoading }: MessagesChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <Skeleton className="mb-4 h-5 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-[var(--color-foreground)]">
        Volume de Mensagens
      </h3>
      <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
        Mensagens enviadas e recebidas por hora
      </p>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Sem dados disponiveis para o periodo
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} vertical={false} />
            <XAxis
              dataKey="time"
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
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
              formatter={(value: number) => [`${value}`, 'Mensagens']}
              cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }}
            />
            <Bar
              dataKey="mensagens"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
