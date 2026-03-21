import { Entity, Property, Index, PrimaryKey } from '@mikro-orm/core';
import { ulid } from 'ulid';

export interface PipelineLog {
  classifier?: {
    intent: string;
    sentiment: string;
    confidence: number;
  };
  router?: {
    destination: string;
    queue?: string;
    priority?: string;
  };
  rag?: {
    answer?: string;
    sources?: string[];
    confidence: number;
  };
  escalation?: {
    escalated: boolean;
    reason?: string;
  };
}

@Entity({ tableName: 'ai_conversation_logs' })
@Index({ properties: ['tenantId', 'conversationId'] })
export class AiConversationLogEntity {
  @PrimaryKey({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Property({ type: 'varchar', length: 26 })
  tenantId!: string;

  @Property({ type: 'varchar', length: 26 })
  conversationId!: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  messageId?: string;

  @Property({ type: 'jsonb', default: '{}' })
  pipeline: PipelineLog = {};

  @Property({ type: 'text' })
  inputText!: string;

  @Property({ type: 'text', nullable: true })
  outputText?: string;

  @Property({ type: 'float', nullable: true })
  confidence?: number;

  @Property({ type: 'boolean', default: false })
  wasEscalated: boolean = false;

  @Property({ type: 'int', default: 0 })
  responseTimeMs: number = 0;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  createdAt: Date = new Date();
}
