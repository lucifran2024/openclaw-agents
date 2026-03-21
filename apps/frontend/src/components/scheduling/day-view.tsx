'use client';

import { useMemo } from 'react';
import { format, parseISO, isSameHour, differenceInMinutes, startOfDay, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import type { Appointment, ServiceType } from '@/hooks/use-scheduling';

const HOUR_HEIGHT = 64;
const START_HOUR = 8;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

interface DayViewProps {
  date: Date;
  appointments: Appointment[];
  serviceTypes: ServiceType[];
  isLoading: boolean;
  onAppointmentClick: (appointment: Appointment) => void;
  onSlotClick: (date: string, time: string) => void;
}

export function DayView({
  date,
  appointments,
  serviceTypes,
  isLoading,
  onAppointmentClick,
  onSlotClick,
}: DayViewProps) {
  const serviceTypeMap = useMemo(() => {
    const map = new Map<string, ServiceType>();
    serviceTypes.forEach((st) => map.set(st.id, st));
    return map;
  }, [serviceTypes]);

  function getAppointmentStyle(appt: Appointment) {
    const start = parseISO(appt.startAt);
    const end = parseISO(appt.endAt);
    const startMinutes = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const duration = differenceInMinutes(end, start);
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;

    const st = serviceTypeMap.get(appt.serviceTypeId);
    const color = st?.color || '#3b82f6';

    return { top, height: Math.max(height, 24), color };
  }

  function handleSlotClick(hour: number) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    onSlotClick(dateStr, `${dateStr}T${timeStr}:00`);
  }

  if (isLoading) {
    return (
      <div className="space-y-1">
        {HOURS.map((h) => (
          <div key={h} className="flex gap-2">
            <Skeleton className="h-16 w-14 shrink-0" />
            <Skeleton className="h-16 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Day Header */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
          {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h3>
      </div>

      {/* Time Grid */}
      <div className="relative">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="flex border-b border-[var(--color-border)] last:border-b-0"
            style={{ height: HOUR_HEIGHT }}
          >
            <div className="flex w-16 shrink-0 items-start justify-end border-r border-[var(--color-border)] pr-2 pt-1">
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
            <div
              className="relative flex-1 cursor-pointer hover:bg-[var(--color-muted)]/30"
              onClick={() => handleSlotClick(hour)}
            />
          </div>
        ))}

        {/* Appointments overlay */}
        <div className="absolute inset-0 left-16 pointer-events-none">
          {appointments
            .filter((a) => a.status !== 'cancelled')
            .map((appt) => {
              const { top, height, color } = getAppointmentStyle(appt);
              const st = serviceTypeMap.get(appt.serviceTypeId);

              return (
                <div
                  key={appt.id}
                  className="absolute left-1 right-2 overflow-hidden rounded-md border px-2 py-1 text-xs pointer-events-auto cursor-pointer transition-opacity hover:opacity-90"
                  style={{
                    top,
                    height,
                    backgroundColor: `${color}20`,
                    borderColor: color,
                    color,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAppointmentClick(appt);
                  }}
                >
                  <p className="truncate font-semibold">
                    {format(parseISO(appt.startAt), 'HH:mm')} - {format(parseISO(appt.endAt), 'HH:mm')}
                  </p>
                  {st && <p className="truncate">{st.name}</p>}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
