'use client';

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimeSlot } from '@/hooks/use-scheduling';

interface SlotPickerProps {
  slots: TimeSlot[];
  isLoading: boolean;
  selectedSlot: string | null;
  onSelectSlot: (startAt: string) => void;
}

export function SlotPicker({ slots, isLoading, selectedSlot, onSelectSlot }: SlotPickerProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando horários...
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-8">
        <Clock className="mb-2 h-8 w-8 text-[var(--color-muted-foreground)]" />
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Nenhum horário disponível
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Selecione outro dia, recurso ou serviço
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.available);
  const unavailableSlots = slots.filter((s) => !s.available);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {availableSlots.length} de {slots.length} horários disponíveis
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const time = format(parseISO(slot.startAt), 'HH:mm', { locale: ptBR });
          const isSelected = selectedSlot === slot.startAt;

          return (
            <button
              key={slot.startAt}
              type="button"
              disabled={!slot.available}
              onClick={() => onSelectSlot(slot.startAt)}
              className={`
                flex h-10 items-center justify-center rounded-md border text-sm font-medium transition-colors
                ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : slot.available
                      ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-primary hover:bg-primary/10'
                      : 'cursor-not-allowed border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)] opacity-50 line-through'
                }
              `}
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
