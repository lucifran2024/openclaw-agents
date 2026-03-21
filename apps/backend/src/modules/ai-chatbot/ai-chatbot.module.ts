import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { KnowledgeBaseEntity } from './entities/knowledge-base.entity';
import { KnowledgeDocumentEntity } from './entities/knowledge-document.entity';
import { KnowledgeChunkEntity } from './entities/knowledge-chunk.entity';
import { AiConversationLogEntity } from './entities/ai-conversation-log.entity';
import { KnowledgeFeedbackEntity } from './entities/knowledge-feedback.entity';
import { EmbeddingService } from './embedding.service';
import { ClassifierService } from './classifier.service';
import { RouterService } from './router.service';
import { RagService } from './rag.service';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeCaptureService } from './knowledge-capture.service';
import { AiPipelineService } from './ai-pipeline.service';
import { AiChatbotController } from './ai-chatbot.controller';
import { AiPipelineWorker } from './workers/ai-pipeline.worker';
import { EmbeddingWorker } from './workers/embedding.worker';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      KnowledgeBaseEntity,
      KnowledgeDocumentEntity,
      KnowledgeChunkEntity,
      AiConversationLogEntity,
      KnowledgeFeedbackEntity,
    ]),
    BullModule.registerQueue(
      { name: 'ai_pipeline' },
      {
        name: 'ai_embedding',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: false,
        },
      },
    ),
  ],
  controllers: [AiChatbotController],
  providers: [
    EmbeddingService,
    ClassifierService,
    RouterService,
    RagService,
    KnowledgeService,
    KnowledgeCaptureService,
    AiPipelineService,
    AiPipelineWorker,
    EmbeddingWorker,
  ],
  exports: [AiPipelineService, RagService, KnowledgeService, EmbeddingService],
})
export class AiChatbotModule {}
