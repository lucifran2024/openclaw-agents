import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity({ tableName: 'appointments' })
@Index({ properties: ['tenantId', 'resourceId', 'startAt'] })
@Index({ properties: ['tenantId', 'contactId'] })
@Index({ properties: ['tenantId', 'status'] })
export class AppointmentEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  contactId!: string;

  @Property({ type: 'varchar', length: 26 })
  resourceId!: string;

  @Property({ type: 'varchar', length: 26 })
  serviceTypeId!: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  unitId?: string;

  @Property({ type: 'timestamptz' })
  startAt!: Date;

  @Property({ type: 'timestamptz' })
  endAt!: Date;

  @Enum({ items: () => AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus = AppointmentStatus.SCHEDULED;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ type: 'timestamptz', nullable: true })
  reminderSentAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  confirmedAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Property({ type: 'text', nullable: true })
  cancelReason?: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  conversationId?: string;
}
