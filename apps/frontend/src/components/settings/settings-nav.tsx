'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users2,
  Smartphone,
  ShieldCheck,
  MessageCircleMore,
  CreditCard,
  LockKeyhole,
  KeyRound,
} from 'lucide-react';

const navItems = [
  {
    label: 'Geral',
    href: '/settings/general',
    description: 'Tenant, slug, vertical e fuso',
    icon: Building2,
  },
  {
    label: 'Equipe',
    href: '/settings/team',
    description: 'Membros, funcoes e times',
    icon: Users2,
  },
  {
    label: 'Canais',
    href: '/settings/channels',
    description: 'Contas WhatsApp e templates',
    icon: Smartphone,
  },
  {
    label: 'SLA',
    href: '/settings/sla',
    description: 'Politicas e horarios de atendimento',
    icon: ShieldCheck,
  },
  {
    label: 'Respostas Rapidas',
    href: '/settings/quick-replies',
    description: 'Atalhos operacionais do time',
    icon: MessageCircleMore,
  },
  {
    label: 'Billing',
    href: '/settings/billing',
    description: 'Plano e consumo atual',
    icon: CreditCard,
  },
  {
    label: 'Seguranca',
    href: '/settings/security',
    description: 'SSO e politicas enterprise',
    icon: LockKeyhole,
  },
  {
    label: 'API Keys',
    href: '/settings/api-keys',
    description: 'Acesso para integracoes',
    icon: KeyRound,
  },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
        Centro de Configuracao
      </p>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl border px-3 py-3 transition-colors ${
                active
                  ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_9%,white)]'
                  : 'border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-background)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    active
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-muted-foreground)]">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
