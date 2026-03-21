import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshTokenEntity extends BaseEntity {
  @Property()
  userId!: string;

  @Property()
  tokenHash!: string;

  @Property({ type: 'timestamptz' })
  expiresAt!: Date;

  @Property({ type: 'timestamptz', nullable: true })
  revokedAt?: Date;
}
