import { Entity, Property, Enum, Index, PrimaryKey } from '@mikro-orm/core';
import { ulid } from 'ulid';

export enum ScheduleExceptionType {
  BLOCKED = 'blocked',
  EXTENDED = 'extended',
  HOLIDAY = 'holiday',
}

@Entity({ tableName: 'schedule_exceptions' })
@Index({ properties: ['tenantId', 'resourceId', 'date'] })
export class ScheduleExceptionEntity {
  @PrimaryKey({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Property({ type: 'varchar', length: 26 })
  tenantId!: string;

  @Property({ type: 'varchar', length: 26 })
  resourceId!: string;

  @Property({ type: 'date' })
  date!: Date;

  @Property({ type: 'varchar', length: 5, nullable: true })
  startTime?: string;

  @Property({ type: 'varchar', length: 5, nullable: true })
  endTime?: string;

  @Property({ type: 'text', nullable: true })
  reason?: string;

  @Enum({ items: () => ScheduleExceptionType })
  type!: ScheduleExceptionType;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  createdAt: Date = new Date();
}
