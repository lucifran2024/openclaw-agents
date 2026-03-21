'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, LayoutGrid, Save, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardLayoutWidget } from '@/hooks/use-dashboard';

interface WidgetGridProps {
  widgets: DashboardLayoutWidget[];
  isLoading: boolean;
  isSaving: boolean;
  onSave: (widgets: DashboardLayoutWidget[]) => void;
}

const WIDGET_LABELS: Record<string, string> = {
  'open-conversations': 'Conversas abertas',
  'avg-frt': 'Tempo de primeira resposta',
  'avg-art': 'Tempo medio de resposta',
  'sla-compliance': 'SLA compliance',
  'throughput-chart': 'Throughput',
  'csat-chart': 'CSAT',
};

function normalizeWidgets(widgets: DashboardLayoutWidget[]) {
  return widgets.map((widget, index) => ({
    ...widget,
    x: index % 2 === 0 ? 0 : 6,
    y: Math.floor(index / 2) * 2,
    w: 6,
    h: widget.type === 'stat' || widget.type === 'gauge' ? 2 : 4,
  }));
}

function SortableWidgetCard({ widget }: { widget: DashboardLayoutWidget }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.widgetId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = WIDGET_LABELS[widget.widgetId] || widget.widgetId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-sm ${
        isDragging ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-foreground)]">{title}</p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Tipo: {widget.type.replace(/_/g, ' ')}
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function WidgetGrid({ widgets, isLoading, isSaving, onSave }: WidgetGridProps) {
  const [items, setItems] = useState<DashboardLayoutWidget[]>(widgets);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  useEffect(() => {
    setItems(widgets);
  }, [widgets]);

  const isDirty = useMemo(
    () => JSON.stringify(items) !== JSON.stringify(widgets),
    [items, widgets],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.widgetId === active.id);
      const newIndex = current.findIndex((item) => item.widgetId === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <Skeleton className="mb-4 h-5 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-[var(--color-primary)]" />
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">
              Widget Grid
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Arraste os cards para reorganizar o layout salvo do dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setItems(widgets)} disabled={!isDirty || isSaving}>
            <Undo2 className="mr-2 h-4 w-4" />
            Restaurar
          </Button>
          <Button onClick={() => onSave(normalizeWidgets(items))} disabled={!isDirty || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar layout'}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((item) => item.widgetId)} strategy={rectSortingStrategy}>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((widget) => (
                <SortableWidgetCard key={widget.widgetId} widget={widget} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
