'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { KanbanCard } from './card';
import { WipIndicator } from './wip-indicator';
import type { Card, Column as ColumnType } from '@/hooks/use-kanban';

interface KanbanColumnProps {
  column: ColumnType;
  cards: Card[];
  onCardClick: (card: Card) => void;
  onAddCard: (columnId: string) => void;
}

export function KanbanColumn({
  column,
  cards,
  onCardClick,
  onAddCard,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const sortedCards = [...cards].sort((a, b) => a.position - b.position);
  const cardIds = sortedCards.map((c) => c.id);
  const count = sortedCards.length;

  const hasLimit = column.wipLimit > 0;
  const atLimit = hasLimit && count === column.wipLimit;
  const exceeded = hasLimit && count > column.wipLimit;

  let borderColor = 'border-[var(--color-border)]';
  if (exceeded) {
    borderColor = 'border-red-400';
  } else if (atLimit) {
    borderColor = 'border-amber-400';
  }

  const columnColor = column.color || 'var(--color-primary)';

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-xl border-2 bg-[var(--color-background)] ${borderColor} transition-colors ${
        isOver ? 'ring-2 ring-[var(--color-primary)]/30' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: columnColor }}
          />
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
            {column.name}
          </h3>
          <WipIndicator current={count} limit={column.wipLimit} />
        </div>
        <button
          onClick={() => onAddCard(column.id)}
          className="rounded-md p-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          title="Adicionar card"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2"
        style={{ minHeight: 80 }}
      >
        <SortableContext
          items={cardIds}
          strategy={verticalListSortingStrategy}
        >
          {sortedCards.map((card) => (
            <KanbanCard key={card.id} card={card} onClick={onCardClick} />
          ))}
        </SortableContext>

        {sortedCards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] py-8">
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Arraste cards aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
