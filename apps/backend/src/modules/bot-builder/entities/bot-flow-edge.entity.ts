import { Entity, Property, Index, PrimaryKey } from '@mikro-orm/core';
import { ulid } from 'ulid';

@Entity({ tableName: 'bot_flow_edges' })
@Index({ properties: ['tenantId', 'flowId'] })
@Index({ properties: ['tenantId', 'sourceNodeId'] })
@Index({ properties: ['tenantId', 'targetNodeId'] })
export class BotFlowEdgeEntity {
  @PrimaryKey({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Property({ type: 'varchar', length: 26 })
  tenantId!: string;

  @Property({ type: 'varchar', length: 26 })
  flowId!: string;

  @Property({ type: 'varchar', length: 26 })
  sourceNodeId!: string;

  @Property({ type: 'varchar', length: 26 })
  targetNodeId!: string;

  @Property({ type: 'varchar', length: 100, nullable: true })
  sourceHandle?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  label?: string;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  createdAt: Date = new Date();
}
