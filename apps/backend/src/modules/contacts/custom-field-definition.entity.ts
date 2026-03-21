import { Entity, Property, Enum } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  BOOLEAN = 'boolean',
}

@Entity({ tableName: 'custom_field_definitions' })
export class CustomFieldDefinitionEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 100 })
  name!: string;

  @Enum({ items: () => FieldType })
  fieldType!: FieldType;

  @Property({ type: 'jsonb', nullable: true })
  options?: string[];

  @Property({ type: 'boolean', default: false })
  required: boolean = false;
}
