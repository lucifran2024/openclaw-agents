'use client';

import { useState, useMemo } from 'react';
import {
  format,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarView } from '@/components/scheduling/calendar-view';
import { DayView } from '@/components/scheduling/day-view';
import { AppointmentForm } from '@/components/scheduling/appointment-form';
import {
  useAppointments,
  useServiceTypes,
  useResources,
  type Appointment,
} from '@/hooks/use-scheduling';

type ViewMode = 'week' | 'day';

const resourceTypeLabels: Record<string, string> = {
  professional: 'Profissional',
  room: 'Sala',
  equipment: 'Equipamento',
  table: 'Mesa',
};

export default function SchedulingPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<string>('');

  // Form/modal state
  const [formOpen, setFormOpen] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [defaultFormDate, setDefaultFormDate] = useState<string | undefined>();
  const [defaultFormTime, setDefaultFormTime] = useState<string | undefined>();

  // Compute date range for fetching
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const fetchDate = viewMode === 'week'
    ? format(weekStart, 'yyyy-MM-dd')
    : format(currentDate, 'yyyy-MM-dd');

  const { data: appointments, isLoading: appointmentsLoading } = useAppointments(
    fetchDate,
    selectedResourceId || undefined,
  );
  const { data: serviceTypes } = useServiceTypes();
  const { data: resources } = useResources();

  // Filter appointments by service type on the client
  const filteredAppointments = useMemo(() => {
    let list = appointments || [];
    if (selectedServiceTypeId) {
      list = list.filter((a) => a.serviceTypeId === selectedServiceTypeId);
    }
    return list;
  }, [appointments, selectedServiceTypeId]);

  // Navigation
  function navigatePrev() {
    if (viewMode === 'week') {
      setCurrentDate((d) => subWeeks(d, 1));
    } else {
      setCurrentDate((d) => subDays(d, 1));
    }
  }

  function navigateNext() {
    if (viewMode === 'week') {
      setCurrentDate((d) => addWeeks(d, 1));
    } else {
      setCurrentDate((d) => addDays(d, 1));
    }
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function handleSlotClick(date: string, time: string) {
    setDefaultFormDate(date);
    setDefaultFormTime(time);
    setFormOpen(true);
  }

  function handleAppointmentClick(appt: Appointment) {
    setViewingAppointment(appt);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setViewingAppointment(null);
    setDefaultFormDate(undefined);
    setDefaultFormTime(undefined);
  }

  const dateRangeLabel =
    viewMode === 'week'
      ? `${format(weekStart, "dd 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`
      : format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const scheduledCount = filteredAppointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed',
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            Agendamentos
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Gerencie sua agenda e compromissos
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Top Bar: Navigation + View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-sm font-medium capitalize text-[var(--color-foreground)]">
            {dateRangeLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {scheduledCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <CalendarIcon className="h-3 w-3" />
              {scheduledCount} agendamento{scheduledCount !== 1 ? 's' : ''}
            </Badge>
          )}
          <div className="flex rounded-md border border-[var(--color-border)]">
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              } rounded-l-md`}
            >
              <List className="h-3.5 w-3.5" />
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              } rounded-r-md`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Semana
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar + Calendar */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Left Sidebar */}
        <div className="w-full space-y-4 lg:w-56 lg:shrink-0">
          {/* Resource Filter */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
              Recursos
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedResourceId('')}
                className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                  !selectedResourceId
                    ? 'bg-primary text-primary-foreground'
                    : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
                }`}
              >
                Todos
              </button>
              {resources?.map((resource) => (
                <button
                  key={resource.id}
                  onClick={() => setSelectedResourceId(resource.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                    selectedResourceId === resource.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
                  }`}
                >
                  <span className="truncate">{resource.name}</span>
                  <span className="ml-auto text-[10px] opacity-70">
                    {resourceTypeLabels[resource.type] || resource.type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Service Type Filter */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
              Serviços
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedServiceTypeId('')}
                className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                  !selectedServiceTypeId
                    ? 'bg-primary text-primary-foreground'
                    : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
                }`}
              >
                Todos
              </button>
              {serviceTypes?.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedServiceTypeId(st.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                    selectedServiceTypeId === st.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
                  }`}
                >
                  {st.color && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: st.color }}
                    />
                  )}
                  <span className="truncate">{st.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 min-w-0">
          {viewMode === 'week' ? (
            <CalendarView
              currentDate={currentDate}
              appointments={filteredAppointments}
              serviceTypes={serviceTypes || []}
              isLoading={appointmentsLoading}
              onAppointmentClick={handleAppointmentClick}
              onSlotClick={handleSlotClick}
            />
          ) : (
            <DayView
              date={currentDate}
              appointments={filteredAppointments}
              serviceTypes={serviceTypes || []}
              isLoading={appointmentsLoading}
              onAppointmentClick={handleAppointmentClick}
              onSlotClick={handleSlotClick}
            />
          )}
        </div>
      </div>

      {/* Appointment Form / Detail Modal */}
      <AppointmentForm
        open={formOpen || !!viewingAppointment}
        appointment={viewingAppointment}
        defaultDate={defaultFormDate}
        defaultTime={defaultFormTime}
        defaultResourceId={selectedResourceId || undefined}
        onClose={handleCloseForm}
      />
    </div>
  );
}
