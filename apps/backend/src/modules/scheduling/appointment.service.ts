import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AppointmentEntity, AppointmentStatus } from './entities/appointment.entity';
import { ServiceTypeEntity } from './entities/service-type.entity';
import { AvailabilityService } from './availability.service';

export interface AppointmentFilters {
  resourceId?: string;
  contactId?: string;
  date?: string;
  status?: AppointmentStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly availabilityService: AvailabilityService,
    @InjectQueue('scheduling_reminder') private readonly reminderQueue: Queue,
    @InjectQueue('scheduling_waitlist') private readonly waitlistQueue: Queue,
  ) {}

  async bookAppointment(
    tenantId: string,
    data: {
      contactId: string;
      resourceId: string;
      serviceTypeId: string;
      startAt: string;
      notes?: string;
      unitId?: string;
    },
  ): Promise<AppointmentEntity> {
    // Load service type for duration
    const serviceType = await this.em.findOne(ServiceTypeEntity, {
      id: data.serviceTypeId,
      tenantId,
    });
    if (!serviceType) {
      throw new NotFoundException('Service type not found');
    }

    const startAt = new Date(data.startAt);
    const endAt = new Date(startAt.getTime() + serviceType.durationMinutes * 60 * 1000);

    // Validate slot availability
    const available = await this.availabilityService.isSlotAvailable(
      tenantId,
      data.resourceId,
      startAt,
      endAt,
    );
    if (!available) {
      throw new BadRequestException('The selected time slot is not available');
    }

    const appointment = this.em.create(AppointmentEntity, {
      tenantId,
      contactId: data.contactId,
      resourceId: data.resourceId,
      serviceTypeId: data.serviceTypeId,
      unitId: data.unitId,
      startAt,
      endAt,
      notes: data.notes,
      status: AppointmentStatus.SCHEDULED,
    } as any);

    await this.em.persistAndFlush(appointment);

    // Enqueue reminder jobs (24h and 1h before)
    await this.enqueueReminders(appointment);

    this.logger.log(`Appointment booked: ${appointment.id} for tenant ${tenantId}`);
    return appointment;
  }

  async cancelAppointment(
    tenantId: string,
    id: string,
    reason?: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.em.findOne(AppointmentEntity, { id, tenantId });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelledAt = new Date();
    appointment.cancelReason = reason;
    await this.em.flush();

    // Trigger waitlist check for the now-open slot
    await this.waitlistQueue.add('slot-opened', {
      tenantId,
      resourceId: appointment.resourceId,
      serviceTypeId: appointment.serviceTypeId,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
    });

    this.logger.log(`Appointment cancelled: ${id}`);
    return appointment;
  }

  async rescheduleAppointment(
    tenantId: string,
    id: string,
    newStartAt: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.em.findOne(AppointmentEntity, { id, tenantId });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const serviceType = await this.em.findOneOrFail(ServiceTypeEntity, {
      id: appointment.serviceTypeId,
      tenantId,
    });

    const startAt = new Date(newStartAt);
    const endAt = new Date(startAt.getTime() + serviceType.durationMinutes * 60 * 1000);

    const available = await this.availabilityService.isSlotAvailable(
      tenantId,
      appointment.resourceId,
      startAt,
      endAt,
    );
    if (!available) {
      throw new BadRequestException('The new time slot is not available');
    }

    const oldStartAt = appointment.startAt;
    const oldEndAt = appointment.endAt;

    appointment.startAt = startAt;
    appointment.endAt = endAt;
    appointment.status = AppointmentStatus.SCHEDULED;
    await this.em.flush();

    // Enqueue new reminders
    await this.enqueueReminders(appointment);

    // Trigger waitlist for old slot
    await this.waitlistQueue.add('slot-opened', {
      tenantId,
      resourceId: appointment.resourceId,
      serviceTypeId: appointment.serviceTypeId,
      startAt: oldStartAt.toISOString(),
      endAt: oldEndAt.toISOString(),
    });

    return appointment;
  }

  async confirmAppointment(tenantId: string, id: string): Promise<AppointmentEntity> {
    const appointment = await this.em.findOne(AppointmentEntity, { id, tenantId });
    if (!appointment) throw new NotFoundException('Appointment not found');

    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.confirmedAt = new Date();
    await this.em.flush();
    return appointment;
  }

  async markNoShow(tenantId: string, id: string): Promise<AppointmentEntity> {
    const appointment = await this.em.findOne(AppointmentEntity, { id, tenantId });
    if (!appointment) throw new NotFoundException('Appointment not found');

    appointment.status = AppointmentStatus.NO_SHOW;
    await this.em.flush();
    return appointment;
  }

  async completeAppointment(tenantId: string, id: string): Promise<AppointmentEntity> {
    const appointment = await this.em.findOne(AppointmentEntity, { id, tenantId });
    if (!appointment) throw new NotFoundException('Appointment not found');

    appointment.status = AppointmentStatus.COMPLETED;
    await this.em.flush();
    return appointment;
  }

  async getAppointments(
    tenantId: string,
    filters: AppointmentFilters = {},
  ): Promise<{ data: AppointmentEntity[]; total: number }> {
    const { resourceId, contactId, date, status, page = 1, limit = 20 } = filters;

    const where: Record<string, any> = { tenantId };
    if (resourceId) where.resourceId = resourceId;
    if (contactId) where.contactId = contactId;
    if (status) where.status = status;

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      where.startAt = { $gte: dayStart, $lte: dayEnd };
    }

    const [data, total] = await this.em.findAndCount(AppointmentEntity, where, {
      orderBy: { startAt: 'ASC' },
      limit,
      offset: (page - 1) * limit,
    });

    return { data, total };
  }

  async getAppointmentById(tenantId: string, id: string): Promise<AppointmentEntity | null> {
    return this.em.findOne(AppointmentEntity, { id, tenantId });
  }

  async getAppointmentsByDate(tenantId: string, date: string): Promise<AppointmentEntity[]> {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    return this.em.find(
      AppointmentEntity,
      {
        tenantId,
        startAt: { $gte: dayStart, $lte: dayEnd },
      },
      { orderBy: { startAt: 'ASC' } },
    );
  }

  private async enqueueReminders(appointment: AppointmentEntity): Promise<void> {
    const now = Date.now();
    const startMs = appointment.startAt.getTime();

    // 24h before
    const delay24h = startMs - 24 * 60 * 60 * 1000 - now;
    if (delay24h > 0) {
      await this.reminderQueue.add(
        'send-reminder',
        {
          appointmentId: appointment.id,
          tenantId: appointment.tenantId,
          type: '24h',
        },
        { delay: delay24h, jobId: `reminder-24h-${appointment.id}` },
      );
    }

    // 1h before
    const delay1h = startMs - 60 * 60 * 1000 - now;
    if (delay1h > 0) {
      await this.reminderQueue.add(
        'send-reminder',
        {
          appointmentId: appointment.id,
          tenantId: appointment.tenantId,
          type: '1h',
        },
        { delay: delay1h, jobId: `reminder-1h-${appointment.id}` },
      );
    }
  }
}
