'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConversationItem } from './conversation-item';
import {
  useConversations,
  type ConversationFilters,
} from '@/hooks/use-conversations';

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const TABS = [
  { label: 'Todas', value: 'all' },
  { label: 'Abertas', value: 'open' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Resolvidas', value: 'resolved' },
] as const;

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export function ConversationList({
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [activeTab, setActiveTab] = useState<string>('open');
  const [search, setSearch] = useState('');

  const filters: ConversationFilters = useMemo(
    () => ({
      status: activeTab === 'all' ? undefined : activeTab,
      search: search || undefined,
    }),
    [activeTab, search],
  );

  const { data, isLoading } = useConversations(filters);

  const conversations = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="flex h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-background)]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--color-border)] p-4">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          Conversas
        </h2>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {total} {total === 1 ? 'conversa' : 'conversas'}
        </p>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-shrink-0 gap-0.5 border-b border-[var(--color-border)] px-3">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 border-b-2 px-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.value
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-muted)]">
              <Search className="h-5 w-5 text-[var(--color-muted-foreground)]" />
            </div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              Nenhuma conversa encontrada
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Tente alterar os filtros de busca
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedId}
                onClick={() => onSelect(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
