import { Entity, Property, Enum, Collection, OneToMany } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum BoardType {
  SALES = 'sales',
  SUPPORT = 'support',
  CUSTOM = 'custom',
}

export interface BoardSettings {
  wipLimits?: Record<string, number>;
  automations?: Record<string, unknown>;
}

@Entity({ tableName: 'kanban_boards' })
export class BoardEntity extends TenantBaseEntity {
  @Property()
  name!: string;

  @Enum(() => BoardType)
  type: BoardType = BoardType.CUSTOM;

  @Property({ nullable: true })
  description?: string;

  @Property({ default: false })
  isDefault: boolean = false;

  @Property({ type: 'jsonb', default: '{}' })
  settings: BoardSettings = {};

  @OneToMany(() => ColumnEntity, (col) => col.board)
  columns = new Collection<ColumnEntity>(this);

  @OneToMany(() => SwimlaneEntity, (sw) => sw.board)
  swimlanes = new Collection<SwimlaneEntity>(this);
}

// Avoid circular imports — re-export references
import { ColumnEntity } from './column.entity';
import { SwimlaneEntity } from './swimlane.entity';
