import { type ReactNode, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface SettingsPageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export function SettingsPageHeader({
  title,
  description,
  actions,
}: SettingsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

interface SettingsSectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function SettingsSection({
  title,
  description,
  actions,
  className,
  children,
  ...props
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm',
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

interface SettingsEmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function SettingsEmptyState({
  title,
  description,
  icon,
  action,
}: SettingsEmptyStateProps) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-6 py-10 text-center">
      {icon ? <div className="mb-4 text-[var(--color-muted-foreground)]">{icon}</div> : null}
      <h4 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h4>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-muted-foreground)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

interface SettingsErrorStateProps {
  title: string;
  description: string;
  details?: string;
  action?: ReactNode;
}

export function SettingsErrorState({
  title,
  description,
  details,
  action,
}: SettingsErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
      <h4 className="text-base font-semibold">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-red-800">{description}</p>
      {details ? (
        <pre className="mt-4 overflow-x-auto rounded-xl border border-red-200 bg-white/70 px-4 py-3 text-xs leading-6 text-red-900">
          {details}
        </pre>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
