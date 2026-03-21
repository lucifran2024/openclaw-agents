import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ScheduleRuleEntity } from './entities/schedule-rule.entity';
import { ScheduleExceptionEntity, ScheduleExceptionType } from './entities/schedule-exception.entity';
import { AppointmentEntity, AppointmentStatus } from './entities/appointment.entity';
import { ServiceTypeEntity } from './entities/service-type.entity';
import { ResourceEntity } from './entities/resource.entity';

export interface TimeSlot {
  start: string; // ISO datetime
  end: string;   // ISO datetime
  resourceId: string;
  resourceName: string;
}

interface AvailabilityQuery {
  resourceId?: string;
  serviceTypeId: string;
  date: string; // YYYY-MM-DD
  unitId?: string;
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly em: EntityManager) {}

  async getAvailableSlots(tenantId: string, query: AvailabilityQuery): Promise<TimeSlot[]> {
    const { serviceTypeId, date, resourceId } = query;

    // Load service type for duration
    const serviceType = await this.em.findOneOrFail(ServiceTypeEntity, {
      id: serviceTypeId,
      tenantId,
    });

    const durationMs = serviceType.durationMinutes * 60 * 1000;

    // Find applicable resources
    let resources: ResourceEntity[];
    if (resourceId) {
      const resource = await this.em.findOne(ResourceEntity, {
        id: resourceId,
        tenantId,
        isActive: true,
      });
      resources = resource ? [resource] : [];
    } else {
      // Find all active resources that provide this service type
      const allResources = await this.em.find(ResourceEntity, {
        tenantId,
        isActive: true,
      });
      resources = allResources.filter(
        (r) => r.serviceTypeIds.includes(serviceTypeId),
      );
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const slots: TimeSlot[] = [];

    for (const resource of resources) {
      const resourceSlots = await this.getSlotsForResource(
        tenantId,
        resource,
        dateObj,
        dayOfWeek,
        durationMs,
        date,
      );
      slots.push(...resourceSlots);
    }

    return slots;
  }

  private async getSlotsForResource(
    tenantId: string,
    resource: ResourceEntity,
    dateObj: Date,
    dayOfWeek: number,
    durationMs: number,
    dateStr: string,
  ): Promise<TimeSlot[]> {
    // 1. Load schedule rules for this day
    const rules = await this.em.find(ScheduleRuleEntity, {
      tenantId,
      resourceId: resource.id,
      dayOfWeek,
      isActive: true,
    });

    if (rules.length === 0) return [];

    // 2. Load exceptions for this date
    const exceptions = await this.em.find(ScheduleExceptionEntity, {
      tenantId,
      resourceId: resource.id,
      date: dateObj,
    });

    // Check for full-day block (no startTime/endTime means full day)
    const fullDayBlock = exceptions.find(
      (e) => e.type === ScheduleExceptionType.BLOCKED && !e.startTime && !e.endTime,
    );
    if (fullDayBlock) return [];

    // 3. Build available time ranges from rules
    let availableRanges: { start: number; end: number }[] = [];

    for (const rule of rules) {
      const start = this.timeToMinutes(rule.startTime);
      const end = this.timeToMinutes(rule.endTime);
      availableRanges.push({ start, end });
    }

    // Add extended hours from exceptions
    for (const exc of exceptions) {
      if (exc.type === ScheduleExceptionType.EXTENDED && exc.startTime && exc.endTime) {
        availableRanges.push({
          start: this.timeToMinutes(exc.startTime),
          end: this.timeToMinutes(exc.endTime),
        });
      }
    }

    // 4. Subtract blocked exceptions (partial day)
    const blockedRanges: { start: number; end: number }[] = [];
    for (const exc of exceptions) {
      if (exc.type === ScheduleExceptionType.BLOCKED && exc.startTime && exc.endTime) {
        blockedRanges.push({
          start: this.timeToMinutes(exc.startTime),
          end: this.timeToMinutes(exc.endTime),
        });
      }
    }

    availableRanges = this.subtractRanges(availableRanges, blockedRanges);

    // 5. Load existing appointments for this resource on this date
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const appointments = await this.em.find(AppointmentEntity, {
      tenantId,
      resourceId: resource.id,
      startAt: { $gte: dayStart },
      endAt: { $lte: dayEnd },
      status: {
        $in: [
          AppointmentStatus.SCHEDULED,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.IN_PROGRESS,
        ],
      },
    });

    // Subtract appointment ranges
    const appointmentRanges = appointments.map((appt) => ({
      start: appt.startAt.getHours() * 60 + appt.startAt.getMinutes(),
      end: appt.endAt.getHours() * 60 + appt.endAt.getMinutes(),
    }));

    availableRanges = this.subtractRanges(availableRanges, appointmentRanges);

    // 6. Split into slots based on service duration
    const durationMinutes = durationMs / 60000;
    const slots: TimeSlot[] = [];

    for (const range of availableRanges) {
      let cursor = range.start;
      while (cursor + durationMinutes <= range.end) {
        const startTime = this.minutesToTime(cursor);
        const endTime = this.minutesToTime(cursor + durationMinutes);
        slots.push({
          start: `${dateStr}T${startTime}:00`,
          end: `${dateStr}T${endTime}:00`,
          resourceId: resource.id,
          resourceName: resource.name,
        });
        cursor += durationMinutes;
      }
    }

    return slots;
  }

  async isSlotAvailable(
    tenantId: string,
    resourceId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean> {
    // Check for overlapping appointments
    const overlapping = await this.em.count(AppointmentEntity, {
      tenantId,
      resourceId,
      status: {
        $in: [
          AppointmentStatus.SCHEDULED,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.IN_PROGRESS,
        ],
      },
      $and: [
        { startAt: { $lt: endAt } },
        { endAt: { $gt: startAt } },
      ],
    });

    return overlapping === 0;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private subtractRanges(
    available: { start: number; end: number }[],
    blocked: { start: number; end: number }[],
  ): { start: number; end: number }[] {
    let result = [...available];

    for (const block of blocked) {
      const next: { start: number; end: number }[] = [];
      for (const range of result) {
        if (block.start >= range.end || block.end <= range.start) {
          // No overlap
          next.push(range);
        } else {
          // Overlap — split
          if (range.start < block.start) {
            next.push({ start: range.start, end: block.start });
          }
          if (range.end > block.end) {
            next.push({ start: block.end, end: range.end });
          }
        }
      }
      result = next;
    }

    return result;
  }
}
