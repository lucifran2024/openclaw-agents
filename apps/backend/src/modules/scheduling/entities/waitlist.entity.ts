import { Entity, Property, Enum, Index, PrimaryKey } from '@mikro-orm/core';
import { ulid } from 'ulid';

export enum WaitlistStatus {
  WAITING = 'waiting',
  OFFERED = 'offered',
  BOOKED = 'booked',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity({ tableName: 'waitlist' })
@Index({ properties: ['tenantId', 'status'] })
@Index({ properties: ['tenantId', 'serviceTypeId'] })
export class WaitlistEntity {
  @PrimaryKey({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Property({ type: 'varchar', length: 26 })
  tenantId!: string;

  @Property({ type: 'varchar', length: 26 })
  contactId!: string;

  @Property({ type: 'varchar', length: 26 })
  serviceTypeId!: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  resourceId?: string;

  @Property({ type: 'date' })
  preferredDateStart!: Date;

  @Property({ type: 'date' })
  preferredDateEnd!: Date;

  @Property({ type: 'varchar', length: 5, nullable: true })
  preferredTimeStart?: string;

  @Property({ type: 'varchar', length: 5, nullable: true })
  preferredTimeEnd?: string;

  @Enum({ items: () => WaitlistStatus, default: WaitlistStatus.WAITING })
  status: WaitlistStatus = WaitlistStatus.WAITING;

  @Property({ type: 'timestamptz', nullable: true })
  offeredAt?: Date;

  @Property({ type: 'varchar', length: 26, nullable: true })
  offeredAppointmentId?: string;

  @Property({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  createdAt: Date = new Date();
}
