'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  MessageSquare,
  Kanban,
  Users,
  Megaphone,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useCurrentTenant } from '@/hooks/use-settings';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { label: 'Visao Geral', href: '/', icon: LayoutDashboard },
  { label: 'Conversas', href: '/inbox', icon: MessageSquare },
  { label: 'Kanban', href: '/kanban', icon: Kanban },
  { label: 'Contatos', href: '/contacts', icon: Users },
  { label: 'Campanhas', href: '/campaigns', icon: Megaphone },
  { label: 'Agendamentos', href: '/scheduling', icon: Calendar },
  { label: 'Relatorios', href: '/reports', icon: BarChart3 },
  { label: 'Configuracoes', href: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { data: tenant } = useCurrentTenant();

  const theme = (tenant?.settings?.theme as { logo?: string } | undefined) || {};
  const brandName = tenant?.name || 'OmniChat';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-full w-64 flex-col
          border-r border-[var(--color-border)] bg-[var(--color-surface)]
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            {theme.logo ? (
              <img
                src={theme.logo}
                alt={brandName}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                <MessageSquare className="h-4 w-4" />
              </div>
            )}
            <span className="truncate text-lg font-bold text-[var(--color-foreground)]">
              {brandName}
            </span>
          </Link>
          <button
            onClick={onToggle}
            className="rounded-md p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] lg:block"
            aria-label="Recolher menu"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-colors duration-150
                  ${
                    active
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                  }
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-[var(--color-border)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-foreground)]">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                {user?.name || 'Usuario'}
              </p>
              <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                {user?.role || 'Membro'}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-md p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-destructive)] hover:text-[var(--color-destructive-foreground)] transition-colors"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
