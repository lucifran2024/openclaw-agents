'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Bot,
  Search,
  Clock,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useFlows, useCreateFlow, type Flow } from '@/hooks/use-bot-builder';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  published: { label: 'Publicado', variant: 'default' },
  archived: { label: 'Arquivado', variant: 'outline' },
};

const TRIGGER_LABELS: Record<string, string> = {
  message_received: 'Mensagem recebida',
  keyword: 'Palavra-chave',
  contact_created: 'Novo contato',
  manual: 'Manual',
  webhook: 'Webhook',
};

export default function BotBuilderPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowTrigger, setNewFlowTrigger] = useState('message_received');

  const { data: flows, isLoading } = useFlows();
  const createFlow = useCreateFlow();

  const filtered = (flows || []).filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleCreate() {
    if (!newFlowName.trim()) return;
    createFlow.mutate(
      { name: newFlowName.trim(), triggerType: newFlowTrigger },
      {
        onSuccess: (flow) => {
          setCreateOpen(false);
          setNewFlowName('');
          router.push(`/bot-builder/${flow.id}`);
        },
      },
    );
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            Bot Builder
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Crie e gerencie fluxos de automação com o editor visual
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Fluxo
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar fluxos por nome..."
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <Bot className="h-4 w-4" />
        <span>
          {filtered.length} {filtered.length === 1 ? 'fluxo encontrado' : 'fluxos encontrados'}
        </span>
      </div>

      {/* Flow List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
          <Bot className="mb-3 h-10 w-10 text-[var(--color-muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
            Nenhum fluxo encontrado
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Crie seu primeiro fluxo de automação
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Fluxo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              onClick={() => router.push(`/bot-builder/${flow.id}`)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
              Novo Fluxo
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--color-foreground)]">
                  Nome do fluxo
                </label>
                <Input
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="Ex: Boas-vindas, Suporte Nível 1..."
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--color-foreground)]">
                  Tipo de gatilho
                </label>
                <select
                  value={newFlowTrigger}
                  onChange={(e) => setNewFlowTrigger(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="message_received">Mensagem recebida</option>
                  <option value="keyword">Palavra-chave</option>
                  <option value="contact_created">Novo contato</option>
                  <option value="manual">Manual</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newFlowName.trim() || createFlow.isPending}
              >
                {createFlow.isPending ? 'Criando...' : 'Criar Fluxo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlowCard({
  flow,
  onClick,
  formatDate,
}: {
  flow: Flow;
  onClick: () => void;
  formatDate: (d: string) => string;
}) {
  const status = STATUS_LABELS[flow.status] || STATUS_LABELS.draft;
  const triggerLabel = TRIGGER_LABELS[flow.triggerType] || flow.triggerType;

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 text-left transition-all hover:shadow-md hover:border-primary/30 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="rounded-lg p-2 bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
          <GitBranch className="h-5 w-5" />
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-1 line-clamp-1">
        {flow.name}
      </h3>
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] mb-3">
        <Bot className="h-3 w-3" />
        <span>{triggerLabel}</span>
        <span className="mx-1">|</span>
        <span>v{flow.version}</span>
      </div>
      <div className="mt-auto flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
        <Clock className="h-3 w-3" />
        <span>{formatDate(flow.updatedAt || flow.createdAt)}</span>
      </div>
    </button>
  );
}
