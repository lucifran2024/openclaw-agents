import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export function KpiCard({ title, value, subtitle, icon, trend }: KpiCardProps) {
  return (
    <div className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[var(--color-primary)]/30">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
            {value}
          </p>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2">
              {trend && (
                <span
                  className={`text-xs font-medium ${
                    trend.positive ? 'text-emerald-600' : 'text-[var(--color-destructive)]'
                  }`}
                >
                  {trend.positive ? '+' : ''}{trend.value}
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="rounded-lg bg-[var(--color-primary)]/10 p-3 text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)]/20">
          {icon}
        </div>
      </div>
    </div>
  );
}
