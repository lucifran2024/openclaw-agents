import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export abstract class BaseWorker {
  protected abstract readonly logger: Logger;

  protected async processWithIdempotency<T>(
    job: Job<T>,
    processedSet: Set<string>,
    handler: (data: T) => Promise<void>,
  ): Promise<void> {
    const idempotencyKey = (job.data as any).idempotencyKey || job.id;

    if (processedSet.has(idempotencyKey!)) {
      this.logger.warn(`Duplicate job detected: ${idempotencyKey}`, job.queueName);
      return;
    }

    try {
      await handler(job.data);
      processedSet.add(idempotencyKey!);
    } catch (error) {
      this.logger.error(
        `Job ${job.id} failed: ${(error as Error).message}`,
        (error as Error).stack,
        job.queueName,
      );
      throw error;
    }
  }

  protected logJobStart(job: Job): void {
    this.logger.log(`Processing job ${job.id} (attempt ${job.attemptsMade + 1})`, job.queueName);
  }

  protected logJobComplete(job: Job): void {
    this.logger.log(`Job ${job.id} completed successfully`, job.queueName);
  }
}
