// Module
export { AiChatbotModule } from './ai-chatbot.module';

// Entities
export { KnowledgeBaseEntity, KnowledgeBaseStatus } from './entities/knowledge-base.entity';
export {
  KnowledgeDocumentEntity,
  DocumentSourceType,
  DocumentStatus,
} from './entities/knowledge-document.entity';
export { KnowledgeChunkEntity } from './entities/knowledge-chunk.entity';
export { AiConversationLogEntity } from './entities/ai-conversation-log.entity';
export { KnowledgeFeedbackEntity, FeedbackRating } from './entities/knowledge-feedback.entity';

// Services
export { AiPipelineService } from './ai-pipeline.service';
export { ClassifierService } from './classifier.service';
export { RouterService } from './router.service';
export { RagService } from './rag.service';
export { EmbeddingService } from './embedding.service';
export { KnowledgeService } from './knowledge.service';
export { KnowledgeCaptureService } from './knowledge-capture.service';

// DTOs
export { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
export { CreateDocumentDto } from './dto/create-document.dto';
export { QueryRagDto } from './dto/query-rag.dto';
export { SubmitFeedbackDto } from './dto/submit-feedback.dto';
