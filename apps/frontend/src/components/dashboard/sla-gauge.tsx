'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface SlaGaugeProps {
  value: number;
  isLoading: boolean;
}

function getColor(value: number): string {
  if (value >= 90) return '#10b981';
  if (value >= 75) return '#f59e0b';
  return '#ef4444';
}

function getLabel(value: number): string {
  if (value >= 90) return 'Excelente';
  if (value >= 75) return 'Regular';
  return 'Critico';
}

export function SlaGauge({ value, isLoading }: SlaGaugeProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="flex items-center justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
      </div>
    );
  }

  const color = getColor(value);
  const label = getLabel(value);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-[var(--color-foreground)]">
        SLA Compliance
      </h3>
      <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
        Meta: 95%
      </p>

      <div className="flex flex-col items-center justify-center">
        <div className="relative h-40 w-40">
          <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="8"
              opacity={0.3}
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[var(--color-foreground)]">
              {value}%
            </span>
            <span
              className="text-xs font-medium"
              style={{ color }}
            >
              {label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
