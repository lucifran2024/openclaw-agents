import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConversationEntity } from './conversation.entity';
import { MessageEntity } from './message.entity';
import { InternalNoteEntity } from './internal-note.entity';
import { SlaPolicyEntity } from './sla-policy.entity';
import { QuickReplyEntity } from './quick-reply.entity';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { SlaService } from './sla.service';
import { ConversationController } from './conversation.controller';
import { SlaController } from './sla.controller';
import { QuickReplyController } from './quick-reply.controller';
import { QuickReplyService } from './quick-reply.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      InternalNoteEntity,
      SlaPolicyEntity,
      QuickReplyEntity,
    ]),
  ],
  controllers: [ConversationController, SlaController, QuickReplyController],
  providers: [ConversationService, MessageService, SlaService, QuickReplyService],
  exports: [ConversationService, MessageService],
})
export class InboxModule {}
