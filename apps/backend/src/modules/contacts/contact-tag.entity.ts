import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { ContactEntity } from './contact.entity';
import { TagEntity } from './tag.entity';

@Entity({ tableName: 'contact_tags' })
export class ContactTagEntity {
  @PrimaryKey({ type: 'varchar', length: 26 })
  contactId!: string;

  @PrimaryKey({ type: 'varchar', length: 26 })
  tagId!: string;

  @ManyToOne(() => ContactEntity, { fieldName: 'contactId', joinColumn: 'contact_id', primary: false })
  contact!: ContactEntity;

  @ManyToOne(() => TagEntity, { fieldName: 'tagId', joinColumn: 'tag_id', primary: false })
  tag!: TagEntity;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  assignedAt: Date = new Date();
}
