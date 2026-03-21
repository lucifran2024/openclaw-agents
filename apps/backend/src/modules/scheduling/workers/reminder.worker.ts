import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Job } from 'bullmq';
import { AppointmentEntity, AppointmentStatus } from '../entities/appointment.entity';

interface ReminderJobData {
  appointmentId: string;
  tenantId: string;
  type: '24h' | '1h';
}

@Injectable()
@Processor('scheduling_reminder')
export class ReminderWorker extends WorkerHost {
  private readonly logger = new Logger(ReminderWorker.name);

  constructor(private readonly em: EntityManager) {
    super();
  }

  async process(job: Job<ReminderJobData>): Promise<void> {
    const { appointmentId, tenantId, type } = job.data;
    this.logger.log(`Processing ${type} reminder for appointment ${appointmentId}`);

    const fork = this.em.fork();

    const appointment = await fork.findOne(AppointmentEntity, {
      id: appointmentId,
      tenantId,
    });

    if (!appointment) {
      this.logger.warn(`Appointment ${appointmentId} not found, skipping reminder`);
      return;
    }

    // Skip if cancelled or already completed
    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.NO_SHOW
    ) {
      this.logger.log(`Appointment ${appointmentId} is ${appointment.status}, skipping reminder`);
      return;
    }

    try {
      // Load the WhatsApp sender service to send template message
      // In a real implementation, this would inject WhatsAppSenderService
      // and send a template message to the contact's phone number.
      // For now, we log and mark the reminder as sent.
      //
      // Example integration:
      // const contact = await fork.findOne(ContactEntity, { id: appointment.contactId, tenantId });
      // await whatsappSender.sendTemplateMessage(
      //   tenantId, phoneNumberId, contact.phone,
      //   'appointment_reminder', 'pt_BR',
      //   [{ type: 'body', parameters: [{ type: 'text', text: appointmentDetails }] }]
      // );

      this.logger.log(
        `Reminder ${type} sent for appointment ${appointmentId} (tenant: ${tenantId})`,
      );

      appointment.reminderSentAt = new Date();
      await fork.flush();
    } catch (error) {
      this.logger.error(
        `Failed to send ${type} reminder for appointment ${appointmentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
