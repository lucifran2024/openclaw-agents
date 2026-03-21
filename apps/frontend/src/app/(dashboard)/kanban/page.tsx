'use client';

import { useState, useCallback } from 'react';
import {
  LayoutDashboard,
  ChevronDown,
  Plus,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanBoard } from '@/components/kanban/board';
import { CardDetailModal } from '@/components/kanban/card-detail-modal';
import {
  useBoards,
  useBoard,
  useBoardCards,
  useBoardMetrics,
  useMoveCard,
  useCreateCard,
  useUpdateCard,
  type Card,
} from '@/hooks/use-kanban';

export default function KanbanPage() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // New card form state
  const [newCardColumnId, setNewCardColumnId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<Card['priority']>('medium');

  // Queries
  const { data: boards, isLoading: boardsLoading } = useBoards();
  const activeBoardId = selectedBoardId || boards?.[0]?.id || null;
  const { data: board, isLoading: boardLoading } = useBoard(activeBoardId);
  const { data: cards = [], isLoading: cardsLoading } = useBoardCards(activeBoardId);
  const { data: metrics } = useBoardMetrics(showMetrics ? activeBoardId : null);

  // Mutations
  const moveCard = useMoveCard();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();

  const activeBoard = boards?.find((b) => b.id === activeBoardId) || boards?.[0];

  const handleMoveCard = useCallback(
    (cardId: string, columnId: string, position: number) => {
      if (!activeBoardId) return;
      moveCard.mutate({ cardId, columnId, position, boardId: activeBoardId });
    },
    [activeBoardId, moveCard],
  );

  const handleCardClick = useCallback((card: Card) => {
    setSelectedCard(card);
  }, []);

  const handleAddCard = useCallback((columnId: string) => {
    setNewCardColumnId(columnId);
    setNewCardTitle('');
    setNewCardPriority('medium');
  }, []);

  const handleCreateCard = useCallback(() => {
    if (!activeBoardId || !newCardColumnId || !newCardTitle.trim()) return;
    createCard.mutate(
      {
        boardId: activeBoardId,
        columnId: newCardColumnId,
        title: newCardTitle.trim(),
        priority: newCardPriority,
      },
      {
        onSuccess: () => {
          setNewCardColumnId(null);
          setNewCardTitle('');
        },
      },
    );
  }, [activeBoardId, newCardColumnId, newCardTitle, newCardPriority, createCard]);

  const handleUpdateCard = useCallback(
    (data: Parameters<typeof updateCard.mutate>[0]) => {
      updateCard.mutate(data, {
        onSuccess: () => setSelectedCard(null),
      });
    },
    [updateCard],
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (boardsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!boards || boards.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
          Kanban
        </h1>
        <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="text-center">
            <LayoutDashboard className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)]" />
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              Nenhum board encontrado
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            Kanban
          </h1>

          {/* Board selector */}
          {boards.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setBoardDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
              >
                {activeBoard?.name || 'Selecionar board'}
                <ChevronDown className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              </button>

              {boardDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setBoardDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-40 mt-1 min-w-[180px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
                    {boards.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBoardId(b.id);
                          setBoardDropdownOpen(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-muted)] ${
                          b.id === activeBoardId
                            ? 'font-semibold text-[var(--color-primary)]'
                            : 'text-[var(--color-foreground)]'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMetrics((v) => !v)}
            className="gap-1.5"
          >
            <BarChart3 className="h-4 w-4" />
            Metricas
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const firstCol = board?.columns?.[0];
              if (firstCol) handleAddCard(firstCol.id);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Novo Card
          </Button>
        </div>
      </div>

      {/* ── Metrics bar ────────────────────────────────────────────────────── */}
      {showMetrics && metrics && (
        <div className="flex gap-3 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          {metrics.columns.map((col) => (
            <div
              key={col.id}
              className={`flex min-w-[140px] flex-col rounded-lg border px-3 py-2 ${
                col.wipExceeded
                  ? 'border-red-300 bg-red-50'
                  : 'border-[var(--color-border)] bg-[var(--color-background)]'
              }`}
            >
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                {col.name}
              </span>
              <span className="text-lg font-bold text-[var(--color-foreground)]">
                {col.cardCount}
              </span>
              <span className="text-[11px] text-[var(--color-muted-foreground)]">
                Tempo medio: {col.avgDwellTime ? `${col.avgDwellTime}h` : '--'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Board ──────────────────────────────────────────────────────────── */}
      {boardLoading || cardsLoading ? (
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : board ? (
        <div className="flex-1 overflow-hidden">
          <KanbanBoard
            columns={board.columns}
            cards={cards}
            onMoveCard={handleMoveCard}
            onCardClick={handleCardClick}
            onAddCard={handleAddCard}
          />
        </div>
      ) : null}

      {/* ── New card inline form ───────────────────────────────────────────── */}
      {newCardColumnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setNewCardColumnId(null)}
          />
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
              Novo Card
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  Titulo
                </label>
                <Input
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Titulo do card"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCard();
                    if (e.key === 'Escape') setNewCardColumnId(null);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  Prioridade
                </label>
                <select
                  value={newCardPriority}
                  onChange={(e) =>
                    setNewCardPriority(e.target.value as Card['priority'])
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setNewCardColumnId(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCard}
                disabled={createCard.isPending || !newCardTitle.trim()}
              >
                {createCard.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Card detail modal ──────────────────────────────────────────────── */}
      <CardDetailModal
        card={selectedCard}
        boardId={activeBoardId || ''}
        onClose={() => setSelectedCard(null)}
        onSave={handleUpdateCard}
        isSaving={updateCard.isPending}
      />
    </div>
  );
}
