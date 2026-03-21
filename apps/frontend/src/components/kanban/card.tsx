'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Card as CardType } from '@/hooks/use-kanban';

const priorityConfig: Record<
  CardType['priority'],
  { label: string; className: string }
> = {
  low: {
    label: 'Baixa',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  medium: {
    label: 'Média',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  high: {
    label: 'Alta',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  urgent: {
    label: 'Urgente',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

interface KanbanCardProps {
  card: CardType;
  onClick: (card: CardType) => void;
}

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[card.priority];

  const initials = card.assignedTo
    ? card.assignedTo
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : null;

  const formattedDate = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      })
    : null;

  const isOverdue =
    card.dueDate && new Date(card.dueDate) < new Date() ? true : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'z-50 rotate-2 opacity-90 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-[var(--color-muted-foreground)] opacity-0 transition-opacity hover:bg-[var(--color-muted)] group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Arrastar card"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => onClick(card)}
        >
          <p className="text-sm font-medium leading-snug text-[var(--color-foreground)]">
            {card.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={`text-[10px] px-1.5 py-0 ${priority.className}`}>
              {priority.label}
            </Badge>

            {formattedDate && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] ${
                  isOverdue
                    ? 'text-red-500 font-medium'
                    : 'text-[var(--color-muted-foreground)]'
                }`}
              >
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            )}
          </div>
        </div>

        {/* Assignee avatar */}
        {initials && (
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-semibold text-white"
            title={card.assignedTo}
          >
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}

/** Overlay card shown while dragging */
export function KanbanCardOverlay({ card }: { card: CardType }) {
  const priority = priorityConfig[card.priority];

  return (
    <div className="w-64 rotate-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl">
      <p className="text-sm font-medium text-[var(--color-foreground)]">
        {card.title}
      </p>
      <div className="mt-2">
        <Badge className={`text-[10px] px-1.5 py-0 ${priority.className}`}>
          {priority.label}
        </Badge>
      </div>
    </div>
  );
}
