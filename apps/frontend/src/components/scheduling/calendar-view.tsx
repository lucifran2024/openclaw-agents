'use client';

import { useMemo } from 'react';
import {
  format,
  parseISO,
  startOfWeek,
  addDays,
  isSameDay,
  differenceInMinutes,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import type { Appointment, ServiceType } from '@/hooks/use-scheduling';

const HOUR_HEIGHT = 56;
const START_HOUR = 8;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

interface CalendarViewProps {
  currentDate: Date;
  appointments: Appointment[];
  serviceTypes: ServiceType[];
  isLoading: boolean;
  onAppointmentClick: (appointment: Appointment) => void;
  onSlotClick: (date: string, time: string) => void;
}

export function CalendarView({
  currentDate,
  appointments,
  serviceTypes,
  isLoading,
  onAppointmentClick,
  onSlotClick,
}: CalendarViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const serviceTypeMap = useMemo(() => {
    const map = new Map<string, ServiceType>();
    (serviceTypes || []).forEach((st) => map.set(st.id, st));
    return map;
  }, [serviceTypes]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments
      .filter((a) => a.status !== 'cancelled')
      .forEach((appt) => {
        const dayKey = format(parseISO(appt.startAt), 'yyyy-MM-dd');
        const list = map.get(dayKey) || [];
        list.push(appt);
        map.set(dayKey, list);
      });
    return map;
  }, [appointments]);

  function getAppointmentStyle(appt: Appointment) {
    const start = parseISO(appt.startAt);
    const end = parseISO(appt.endAt);
    const startMinutes = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const duration = differenceInMinutes(end, start);
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;

    const st = serviceTypeMap.get(appt.serviceTypeId);
    const color = st?.color || '#3b82f6';

    return { top, height: Math.max(height, 20), color };
  }

  function handleSlotClick(day: Date, hour: number) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    onSlotClick(dateStr, `${dateStr}T${timeStr}:00`);
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
          {Array.from({ length: 8 * 6 }).map((_, i) => (
            <Skeleton key={`body-${i}`} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Header Row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--color-border)]">
        <div className="border-r border-[var(--color-border)] bg-[var(--color-muted)] p-2" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`border-r border-[var(--color-border)] p-2 text-center last:border-r-0 ${
              isToday(day) ? 'bg-primary/10' : 'bg-[var(--color-muted)]'
            }`}
          >
            <p className="text-xs font-medium uppercase text-[var(--color-muted-foreground)]">
              {format(day, 'EEE', { locale: ptBR })}
            </p>
            <p
              className={`text-lg font-bold ${
                isToday(day) ? 'text-primary' : 'text-[var(--color-foreground)]'
              }`}
            >
              {format(day, 'dd')}
            </p>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="relative">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--color-border)] last:border-b-0"
            style={{ height: HOUR_HEIGHT }}
          >
            <div className="flex items-start justify-end border-r border-[var(--color-border)] pr-2 pt-1">
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
            {weekDays.map((day) => (
              <div
                key={`${day.toISOString()}-${hour}`}
                className={`relative border-r border-[var(--color-border)] last:border-r-0 cursor-pointer hover:bg-[var(--color-muted)]/30 ${
                  isToday(day) ? 'bg-primary/5' : ''
                }`}
                onClick={() => handleSlotClick(day, hour)}
              />
            ))}
          </div>
        ))}

        {/* Appointment Overlays */}
        {weekDays.map((day, dayIndex) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDay.get(dayKey) || [];

          return dayAppointments.map((appt) => {
            const { top, height, color } = getAppointmentStyle(appt);
            const st = serviceTypeMap.get(appt.serviceTypeId);

            // Calculate horizontal position: skip the time column (60px), then position in the day column
            const leftPercent = ((dayIndex + 1) / 8) * 100;
            const widthPercent = (1 / 8) * 100;

            return (
              <div
                key={appt.id}
                className="absolute overflow-hidden rounded px-1 py-0.5 text-[10px] leading-tight cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  top,
                  height,
                  left: `calc(${leftPercent}% + 2px)`,
                  width: `calc(${widthPercent}% - 4px)`,
                  backgroundColor: `${color}20`,
                  borderLeft: `3px solid ${color}`,
                  color,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAppointmentClick(appt);
                }}
              >
                <p className="truncate font-semibold">
                  {format(parseISO(appt.startAt), 'HH:mm')}
                </p>
                {height > 30 && st && <p className="truncate">{st.name}</p>}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
