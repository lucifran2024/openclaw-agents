import { Injectable, Logger } from '@nestjs/common';
import {
  EventSubscriber,
  EventArgs,
  FlushEventArgs,
} from '@mikro-orm/core';

/**
 * TenantValidationSubscriber — Defense layer 2 of 3.
 *
 * Validates that any entity with a `tenantId` property has it set before
 * being persisted. This catches bugs where tenant context is missing due to
 * misconfigured routes, direct EntityManager usage, or bypassed interceptors.
 *
 * Layers:
 *   1. TenantContextInterceptor (SET LOCAL inside transaction)
 *   2. THIS subscriber (validates tenant_id before flush)
 *   3. RLS policies in PostgreSQL (final barrier)
 */
@Injectable()
export class TenantValidationSubscriber implements EventSubscriber {
  private readonly logger = new Logger(TenantValidationSubscriber.name);

  async beforeCreate(args: EventArgs<any>): Promise<void> {
    this.validateTenantId(args, 'CREATE');
  }

  async beforeUpdate(args: EventArgs<any>): Promise<void> {
    this.validateTenantId(args, 'UPDATE');
  }

  async beforeDelete(args: EventArgs<any>): Promise<void> {
    this.validateTenantId(args, 'DELETE');
  }

  private validateTenantId(args: EventArgs<any>, operation: string): void {
    const entity = args.entity;

    // Only validate entities that have a tenantId property
    if (!('tenantId' in entity)) {
      return;
    }

    if (!entity.tenantId) {
      const entityName = entity.constructor?.name || 'Unknown';
      const msg = `CRITICAL: Attempted to ${operation} ${entityName} without tenant_id. Entity ID: ${entity.id || 'new'}`;
      this.logger.error(msg);
      throw new Error(msg);
    }
  }
}
