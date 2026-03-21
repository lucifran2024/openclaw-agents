import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';
import { BoardEntity } from './board.entity';

@Entity({ tableName: 'kanban_swimlanes' })
export class SwimlaneEntity extends TenantBaseEntity {
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
}
