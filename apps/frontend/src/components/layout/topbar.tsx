'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-md p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              placeholder="Buscar... (Ctrl+K)"
              readOnly
              className="h-9 w-64 cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] pl-9 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] lg:w-80"
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative rounded-md p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          aria-label="Notificacoes"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-destructive)]" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[var(--color-muted)] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-foreground)]">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="hidden text-sm font-medium text-[var(--color-foreground)] md:block">
              {user?.name || 'Usuario'}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-[var(--color-muted-foreground)] md:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg z-50">
              <div className="border-b border-[var(--color-border)] px-4 py-3">
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {user?.email || 'email@exemplo.com'}
                </p>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--color-destructive)] hover:bg-[var(--color-muted)] transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
