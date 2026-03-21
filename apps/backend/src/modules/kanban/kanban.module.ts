import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BoardEntity } from './entities/board.entity';
import { ColumnEntity } from './entities/column.entity';
import { SwimlaneEntity } from './entities/swimlane.entity';
import { CardEntity } from './entities/card.entity';
import { CardHistoryEntity } from './entities/card-history.entity';
import { KanbanAutomationEntity } from './entities/kanban-automation.entity';
import { KanbanService } from './kanban.service';
import { KanbanController } from './kanban.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      BoardEntity,
      ColumnEntity,
      SwimlaneEntity,
      CardEntity,
      CardHistoryEntity,
      KanbanAutomationEntity,
    ]),
  ],
  controllers: [KanbanController],
  providers: [KanbanService],
  exports: [KanbanService],
})
export class KanbanModule {}
