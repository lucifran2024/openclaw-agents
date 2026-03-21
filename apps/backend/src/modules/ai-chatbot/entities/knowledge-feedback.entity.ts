import { Entity, Property, Enum, Index, PrimaryKey } from '@mikro-orm/core';
import { ulid } from 'ulid';

export enum FeedbackRating {
  HELPFUL = 'helpful',
  NOT_HELPFUL = 'not_helpful',
  WRONG = 'wrong',
}

@Entity({ tableName: 'knowledge_feedback' })
@Index({ properties: ['tenantId', 'chunkId'] })
@Index({ properties: ['tenantId', 'conversationId'] })
export class KnowledgeFeedbackEntity {
  @PrimaryKey({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Property({ type: 'varchar', length: 26 })
  tenantId!: string;

  @Property({ type: 'varchar', length: 26 })
  chunkId!: string;

  @Property({ type: 'varchar', length: 26 })
  conversationId!: string;

  @Enum({ items: () => FeedbackRating })
  rating!: FeedbackRating;

  @Property({ type: 'text', nullable: true })
  comment?: string;

  @Property({ type: 'varchar', length: 26 })
  createdBy!: string;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  createdAt: Date = new Date();
}
