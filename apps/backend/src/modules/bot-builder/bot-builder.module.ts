import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BotFlowEntity } from './entities/bot-flow.entity';
import { BotFlowNodeEntity } from './entities/bot-flow-node.entity';
import { BotFlowEdgeEntity } from './entities/bot-flow-edge.entity';
import { BotFlowSessionEntity } from './entities/bot-flow-session.entity';
import { FlowService } from './flow.service';
import { FlowEngineService } from './flow-engine.service';
import { FlowValidatorService } from './flow-validator.service';
import { BotBuilderController } from './bot-builder.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      BotFlowEntity,
      BotFlowNodeEntity,
      BotFlowEdgeEntity,
      BotFlowSessionEntity,
    ]),
  ],
  controllers: [BotBuilderController],
  providers: [FlowService, FlowEngineService, FlowValidatorService],
  exports: [FlowService, FlowEngineService],
})
export class BotBuilderModule {}
