import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Job } from 'bullmq';
import { WaitlistService } from '../waitlist.service';

interface WaitlistJobData {
  tenantId: string;
  resourceId: string;
  serviceTypeId: string;
  startAt: string;
  endAt: string;
}

@Injectable()
@Processor('scheduling_waitlist')
export class WaitlistWorker extends WorkerHost {
  private readonly logger = new Logger(WaitlistWorker.name);

  constructor(
    private readonly em: EntityManager,
    private readonly waitlistService: WaitlistService,
  ) {
    super();
  }

  async process(job: Job<WaitlistJobData>): Promise<void> {
    const { tenantId, resourceId, serviceTypeId, startAt, endAt } = job.data;
    this.logger.log(
      `Processing waitlist for opened slot: resource ${resourceId}, ${startAt} - ${endAt}`,
    );

    try {
      const offered = await this.waitlistService.processWaitlist(
        tenantId,
        resourceId,
        { startAt, endAt, serviceTypeId },
      );

      if (offered.length > 0) {
        this.logger.log(
          `Offered slot to ${offered.length} waitlist entries for tenant ${tenantId}`,
        );

        // In a real implementation, send WhatsApp notifications to offered contacts
        // Example:
        // for (const entry of offered) {
        //   const contact = await fork.findOne(ContactEntity, { id: entry.contactId, tenantId });
        //   await whatsappSender.sendTemplateMessage(
        //     tenantId, phoneNumberId, contact.phone,
        //     'waitlist_slot_available', 'pt_BR', [...]
        //   );
        // }
      } else {
        this.logger.log(`No matching waitlist entries for the opened slot`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process waitlist for slot ${startAt}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
