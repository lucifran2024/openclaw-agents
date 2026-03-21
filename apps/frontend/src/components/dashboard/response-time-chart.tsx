'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ResponseTimeChartProps {
  data: Array<{ time: string; frt?: number; art?: number }>;
  isLoading: boolean;
}

export function ResponseTimeChart({ data, isLoading }: ResponseTimeChartProps) {
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
        Tempo de Resposta
      </h3>
      <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
        FRT e ART nas ultimas 24 horas (em minutos)
      </p>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Sem dados disponiveis para o periodo
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
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
              unit=" min"
              width={60}
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
              formatter={(value: number, name: string) => [
                `${value} min`,
                name === 'frt' ? 'Primeira Resposta' : 'Tempo Medio',
              ]}
            />
            <Legend
              formatter={(value: string) =>
                value === 'frt' ? 'Primeira Resposta (FRT)' : 'Tempo Medio (ART)'
              }
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="frt"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3b82f6' }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="art"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, fill: '#10b981' }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
