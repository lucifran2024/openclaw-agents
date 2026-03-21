'use client';

import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Card } from '@/hooks/use-kanban';

interface CardDetailModalProps {
  card: Card | null;
  boardId: string;
  onClose: () => void;
  onSave: (data: {
    cardId: string;
    boardId: string;
    title?: string;
    description?: string;
    priority?: Card['priority'];
    assignedTo?: string;
    dueDate?: string;
  }) => void;
  isSaving: boolean;
}

export function CardDetailModal({
  card,
  boardId,
  onClose,
  onSave,
  isSaving,
}: CardDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Card['priority']>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setPriority(card.priority);
      setAssignedTo(card.assignedTo || '');
      setDueDate(card.dueDate ? card.dueDate.slice(0, 10) : '');
    }
  }, [card]);

  if (!card) return null;

  const handleSave = () => {
    onSave({
      cardId: card.id,
      boardId,
      title: title !== card.title ? title : undefined,
      description: description !== (card.description || '') ? description : undefined,
      priority: priority !== card.priority ? priority : undefined,
      assignedTo: assignedTo !== (card.assignedTo || '') ? assignedTo : undefined,
      dueDate: dueDate !== (card.dueDate?.slice(0, 10) || '') ? dueDate : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            Detalhes do Card
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
              Titulo
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titulo do card"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
              Descricao
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o card..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Priority + Assignee row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Card['priority'])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="low">Baixa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Responsavel
              </label>
              <Input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Nome do responsavel"
              />
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
              Data de vencimento
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* History placeholder */}
          <div className="rounded-lg border border-dashed border-[var(--color-border)] p-4">
            <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Historico de movimentacoes</span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Em breve...
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
