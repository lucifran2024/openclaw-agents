import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';
import { BoardEntity } from './board.entity';

@Entity({ tableName: 'kanban_columns' })
export class ColumnEntity extends TenantBaseEntity {
  @ManyToOne(() => BoardEntity, { fieldName: 'board_id' })
  board!: BoardEntity;

  @Property({ persist: false })
  get boardId(): string {
    return this.board?.id;
  }

  @Property()
  name!: string;

  @Property()
  position: number = 0;

  @Property({ default: 0 })
  wipLimit: number = 0;

  @Property({ nullable: true })
  color?: string;

  @Property({ default: false })
  isTerminal: boolean = false;
}
