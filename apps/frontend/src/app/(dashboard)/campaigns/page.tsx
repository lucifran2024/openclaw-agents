'use client';

import { useState, useCallback } from 'react';
import { Search, Plus, Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignCard } from '@/components/campaigns/campaign-card';
import { CampaignWizard } from '@/components/campaigns/campaign-wizard';
import {
  useCampaigns,
  useCreateCampaign,
  type CampaignsFilters,
  type CreateCampaignDto,
} from '@/hooks/use-campaigns';

const STATUS_TABS = [
  { value: '', label: 'Todas' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'scheduled', label: 'Agendadas' },
  { value: 'running', label: 'Em Execução' },
  { value: 'completed', label: 'Finalizadas' },
] as const;

const PAGE_SIZE = 20;

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);

  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimer) clearTimeout(searchTimer);
      const timer = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
      setSearchTimer(timer);
    },
    [searchTimer],
  );

  const filters: CampaignsFilters = {
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading } = useCampaigns(filters);
  const createCampaign = useCreateCampaign();

  const campaigns = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: PAGE_SIZE };
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;

  function handleCreate(formData: CreateCampaignDto) {
    createCampaign.mutate(formData, {
      onSuccess: () => setWizardOpen(false),
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            Campanhas
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Gerencie e acompanhe suas campanhas de mensagens
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar campanhas por nome..."
          className="pl-9"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <Megaphone className="h-4 w-4" />
        <span>
          {meta.total} {meta.total === 1 ? 'campanha encontrada' : 'campanhas encontradas'}
        </span>
      </div>

      {/* Campaign List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
          <Megaphone className="mb-3 h-10 w-10 text-[var(--color-muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
            Nenhuma campanha encontrada
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Crie sua primeira campanha para começar
          </p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Campaign Wizard Modal */}
      <CampaignWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createCampaign.isPending}
      />
    </div>
  );
}
