import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';
import { BoardEntity } from './board.entity';

export enum AutomationTrigger {
  CARD_ENTERS_COLUMN = 'card_enters_column',
  CARD_EXITS_COLUMN = 'card_exits_column',
  WIP_EXCEEDED = 'wip_exceeded',
  DUE_DATE_PASSED = 'due_date_passed',
}

export enum AutomationAction {
  MOVE_CARD = 'move_card',
  ASSIGN_AGENT = 'assign_agent',
  SEND_NOTIFICATION = 'send_notification',
  UPDATE_PRIORITY = 'update_priority',
}

@Entity({ tableName: 'kanban_automations' })
export class KanbanAutomationEntity extends TenantBaseEntity {
  @ManyToOne(() => BoardEntity, { fieldName: 'board_id' })
  board!: BoardEntity;

  @Property()
  name!: string;

  @Enum(() => AutomationTrigger)
  trigger!: AutomationTrigger;

  @Property({ type: 'jsonb', default: '{}' })
  triggerConfig: Record<string, unknown> = {};

  @Enum(() => AutomationAction)
  action!: AutomationAction;

  @Property({ type: 'jsonb', default: '{}' })
  actionConfig: Record<string, unknown> = {};

  @Property({ default: true })
  isActive: boolean = true;
}
