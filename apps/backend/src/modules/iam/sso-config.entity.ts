import { Entity, Index, Property } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'sso_configs' })
@Index({ properties: ['tenantId'] })
export class SsoConfigEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 255 })
  entityId!: string;

  @Property({ type: 'varchar', length: 500 })
  ssoUrl!: string;

  @Property({ type: 'text' })
  certificate!: string;
}
