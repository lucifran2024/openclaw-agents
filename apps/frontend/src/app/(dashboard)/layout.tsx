'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useCurrentTenant } from '@/hooks/use-settings';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuthGuard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: tenant } = useCurrentTenant();

  useEffect(() => {
    const theme = (tenant?.settings?.theme as
      | { primaryColor?: string; favicon?: string }
      | undefined) || { primaryColor: '#2563eb' };

    document.documentElement.style.setProperty(
      '--color-primary',
      theme.primaryColor || '#2563eb',
    );
    document.documentElement.style.setProperty(
      '--color-ring',
      theme.primaryColor || '#2563eb',
    );

    if (theme.favicon) {
      let favicon = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = theme.favicon;
    }
  }, [tenant?.settings]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-muted)] border-t-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-muted-foreground)]">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
