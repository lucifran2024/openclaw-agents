import { Entity, Property, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export interface WidgetConfig {
  widgetId: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, any>;
}

@Entity({ tableName: 'widget_layouts' })
@Index({ properties: ['tenantId', 'userId'] })
export class WidgetLayoutEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  userId!: string;

  @Property({ default: 'default' })
  layoutName: string = 'default';

  @Property({ type: 'jsonb', default: '[]' })
  widgets: WidgetConfig[] = [];

  @Property({ type: 'boolean', default: false })
  isDefault: boolean = false;
}
