'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './column';
import { KanbanCardOverlay } from './card';
import type { Card, Column } from '@/hooks/use-kanban';

interface KanbanBoardProps {
  columns: Column[];
  cards: Card[];
  onMoveCard: (cardId: string, columnId: string, position: number) => void;
  onCardClick: (card: Card) => void;
  onAddCard: (columnId: string) => void;
}

export function KanbanBoard({
  columns,
  cards,
  onMoveCard,
  onCardClick,
  onAddCard,
}: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns],
  );

  const cardsByColumn = useMemo(() => {
    const map: Record<string, Card[]> = {};
    for (const col of columns) {
      map[col.id] = [];
    }
    for (const card of cards) {
      if (map[card.columnId]) {
        map[card.columnId].push(card);
      }
    }
    return map;
  }, [cards, columns]);

  const findColumnForCard = useCallback(
    (cardId: string): string | null => {
      const card = cards.find((c) => c.id === cardId);
      if (card) return card.columnId;
      // Check if cardId is actually a column id (droppable)
      if (columns.find((c) => c.id === cardId)) return cardId;
      return null;
    },
    [cards, columns],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const card = cards.find((c) => c.id === event.active.id);
      if (card) setActiveCard(card);
    },
    [cards],
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback is handled by the droppable isOver state
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);

      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const card = cards.find((c) => c.id === activeId);
      if (!card) return;

      // Determine target column
      let targetColumnId: string;
      const overCard = cards.find((c) => c.id === overId);
      const overColumn = columns.find((c) => c.id === overId);

      if (overCard) {
        targetColumnId = overCard.columnId;
      } else if (overColumn) {
        targetColumnId = overColumn.id;
      } else {
        return;
      }

      // Calculate new position
      const targetCards = (cardsByColumn[targetColumnId] || [])
        .filter((c) => c.id !== activeId)
        .sort((a, b) => a.position - b.position);

      let newPosition: number;
      if (overCard && overCard.columnId === targetColumnId) {
        // Find the index of the card we're dropping over
        const overIndex = targetCards.findIndex((c) => c.id === overId);
        newPosition = overIndex >= 0 ? overIndex : targetCards.length;
      } else {
        // Dropping on empty column or on column header
        newPosition = targetCards.length;
      }

      // Skip if nothing changed
      if (card.columnId === targetColumnId && card.position === newPosition) {
        return;
      }

      onMoveCard(activeId, targetColumnId, newPosition);
    },
    [cards, columns, cardsByColumn, onMoveCard],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        {sortedColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            cards={cardsByColumn[column.id] || []}
            onCardClick={onCardClick}
            onAddCard={onAddCard}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeCard ? <KanbanCardOverlay card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
