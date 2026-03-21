import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum NodeType {
  START = 'start',
  MESSAGE = 'message',
  QUESTION = 'question',
  CONDITION = 'condition',
  ACTION = 'action',
  DELAY = 'delay',
  API_CALL = 'api_call',
  AI_RESPONSE = 'ai_response',
  ASSIGN_AGENT = 'assign_agent',
  END = 'end',
}

@Entity({ tableName: 'bot_flow_nodes' })
@Index({ properties: ['tenantId', 'flowId'] })
export class BotFlowNodeEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  flowId!: string;

  @Enum({ items: () => NodeType })
  type!: NodeType;

  @Property({ type: 'jsonb', default: '{}' })
  data: Record<string, unknown> = {};

  @Property({ type: 'jsonb', default: '{"x":0,"y":0}' })
  position: { x: number; y: number } = { x: 0, y: 0 };
}
