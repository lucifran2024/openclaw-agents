'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SettingsEmptyState,
  SettingsErrorState,
  SettingsPageHeader,
  SettingsSection,
} from '@/components/settings/settings-shell';
import {
  useCreateQuickReply,
  useDeleteQuickReply,
  useQuickReplies,
  useUpdateQuickReply,
  type QuickReply,
} from '@/hooks/use-settings';

const emptyForm = {
  shortcut: '',
  content: '',
};

function mapReplyToForm(reply: QuickReply) {
  return {
    shortcut: reply.shortcut,
    content: reply.content,
  };
}

function formatDate(date?: string) {
  if (!date) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function SettingsQuickRepliesPage() {
  const repliesQuery = useQuickReplies();
  const { data: replies, isLoading } = repliesQuery;
  const createReply = useCreateQuickReply();
  const updateReply = useUpdateQuickReply();
  const deleteReply = useDeleteQuickReply();
  const [search, setSearch] = useState('');
  const [selectedReplyId, setSelectedReplyId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!replies?.length) {
      setMode('create');
      setSelectedReplyId(null);
      return;
    }

    if (!selectedReplyId) {
      setMode('edit');
      setSelectedReplyId(replies[0].id);
    }
  }, [replies, selectedReplyId]);

  const filteredReplies = useMemo(() => {
    if (!replies) return [];
    const normalized = search.trim().toLowerCase();
    if (!normalized) return replies;

    return replies.filter((reply) =>
      `${reply.shortcut} ${reply.content}`.toLowerCase().includes(normalized),
    );
  }, [replies, search]);

  const selectedReply =
    replies?.find((reply) => reply.id === selectedReplyId) || null;

  useEffect(() => {
    if (mode === 'create') {
      setForm(emptyForm);
      return;
    }

    if (selectedReply) {
      setForm(mapReplyToForm(selectedReply));
    }
  }, [mode, selectedReply]);

  function handleNewReply() {
    setMode('create');
    setSelectedReplyId(null);
    setForm(emptyForm);
    setFeedback(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setError(null);

    const payload = {
      shortcut: form.shortcut.trim(),
      content: form.content.trim(),
    };

    if (mode === 'edit' && selectedReplyId) {
      updateReply.mutate(
        { id: selectedReplyId, data: payload },
        {
          onSuccess: () => setFeedback('Resposta rapida atualizada com sucesso.'),
          onError: (mutationError) => {
            setError(
              mutationError instanceof Error
                ? mutationError.message
                : 'Nao foi possivel atualizar a resposta.',
            );
          },
        },
      );
      return;
    }

    createReply.mutate(payload, {
      onSuccess: (createdReply) => {
        setMode('edit');
        setSelectedReplyId(createdReply.id);
        setFeedback('Resposta rapida criada com sucesso.');
      },
      onError: (mutationError) => {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Nao foi possivel criar a resposta.',
        );
      },
    });
  }

  function handleDeleteReply() {
    if (!selectedReplyId) return;

    setFeedback(null);
    setError(null);

    deleteReply.mutate(selectedReplyId, {
      onSuccess: () => {
        setMode('create');
        setSelectedReplyId(null);
        setForm(emptyForm);
        setFeedback('Resposta rapida removida com sucesso.');
      },
      onError: (mutationError) => {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Nao foi possivel remover a resposta.',
        );
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (repliesQuery.error || !replies) {
    return (
      <div className="space-y-6">
        <SettingsPageHeader
          title="Respostas Rapidas"
          description="Centralize atalhos do time para agilizar atendimento, follow-up e encaminhamentos."
          actions={
            <Button variant="outline" onClick={handleNewReply}>
              Nova Resposta
            </Button>
          }
        />
        <SettingsErrorState
          title="Nao foi possivel carregar as respostas rapidas"
          description="A biblioteca de atalhos depende da listagem atual para busca, selecao e edicao segura dos itens existentes."
          details={repliesQuery.error instanceof Error ? repliesQuery.error.message : undefined}
          action={
            <Button onClick={() => void repliesQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Respostas Rapidas"
        description="Centralize atalhos do time para agilizar atendimento, follow-up e encaminhamentos."
        actions={
          <Button variant="outline" onClick={handleNewReply}>
            Nova Resposta
          </Button>
        }
      />

      <div className="grid gap-6 2xl:grid-cols-[0.8fr_1.2fr]">
        <SettingsSection
          title="Biblioteca de atalhos"
          description="Busque por slash command ou trecho de texto para localizar rapidamente o atalho correto."
        >
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por /atalho ou conteudo..."
              className="pl-9"
            />
          </div>

          {!filteredReplies.length ? (
            <SettingsEmptyState
              title={replies?.length ? 'Nenhuma resposta encontrada' : 'Nenhuma resposta cadastrada'}
              description={
                replies?.length
                  ? 'Tente outro termo de busca para encontrar o atalho desejado.'
                  : 'Crie a primeira resposta rapida para padronizar o atendimento da operacao.'
              }
              action={
                !replies?.length ? (
                  <Button variant="outline" onClick={handleNewReply}>
                    Criar primeira resposta
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredReplies.map((reply) => (
                <button
                  key={reply.id}
                  type="button"
                  onClick={() => {
                    setMode('edit');
                    setSelectedReplyId(reply.id);
                    setFeedback(null);
                    setError(null);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedReplyId === reply.id && mode === 'edit'
                      ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-background)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-sm font-semibold text-[var(--color-primary)]">
                        /{reply.shortcut}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm text-[var(--color-foreground)]">
                        {reply.content}
                      </p>
                    </div>
                    <div className="shrink-0 text-xs text-[var(--color-muted-foreground)]">
                      {formatDate(reply.createdAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title={mode === 'create' ? 'Nova resposta' : 'Editar resposta'}
          description="Prefira atalhos curtos, com conteudo pronto para uso imediato pelo time."
          actions={
            mode === 'edit' && selectedReplyId ? (
              <Button
                variant="destructive"
                onClick={handleDeleteReply}
                disabled={deleteReply.isPending}
              >
                {deleteReply.isPending ? 'Removendo...' : 'Excluir'}
              </Button>
            ) : null
          }
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Shortcut
              </label>
              <Input
                value={form.shortcut}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    shortcut: e.target.value.replace(/^\//, ''),
                  }))
                }
                placeholder="followup"
                required
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                O time usara este atalho como <span className="font-mono">/followup</span>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Conteudo
              </label>
              <textarea
                value={form.content}
                onChange={(e) =>
                  setForm((current) => ({ ...current, content: e.target.value }))
                }
                className="min-h-48 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Oi! Obrigado pelo retorno. Vou seguir com o proximo passo e te atualizo ainda hoje."
                required
              />
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                Preview
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-foreground)]">
                {form.content || 'O conteudo aparecera aqui em tempo real.'}
              </p>
            </div>

            <Button
              type="submit"
              disabled={createReply.isPending || updateReply.isPending}
            >
              {createReply.isPending || updateReply.isPending
                ? 'Salvando...'
                : mode === 'create'
                  ? 'Criar Resposta'
                  : 'Salvar Resposta'}
            </Button>
          </form>

          {feedback ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {feedback}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </SettingsSection>
      </div>
    </div>
  );
}
