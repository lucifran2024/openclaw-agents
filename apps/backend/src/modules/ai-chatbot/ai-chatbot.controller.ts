import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EntityManager } from '@mikro-orm/postgresql';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant, CurrentUser } from '../../common/auth/tenant.decorator';
import { KnowledgeService } from './knowledge.service';
import { RagService } from './rag.service';
import { AiConversationLogEntity } from './entities/ai-conversation-log.entity';
import { KnowledgeFeedbackEntity } from './entities/knowledge-feedback.entity';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryRagDto } from './dto/query-rag.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@ApiTags('AI Chatbot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('ai')
export class AiChatbotController {
  constructor(
    private readonly em: EntityManager,
    private readonly knowledgeService: KnowledgeService,
    private readonly ragService: RagService,
  ) {}

  // ─── Knowledge Bases ──────────────────────────────────────────

  @Get('knowledge-bases')
  @RequirePermission('ai:read')
  @ApiOperation({ summary: 'List all knowledge bases' })
  async listKnowledgeBases(@CurrentTenant() tenantId: string) {
    return this.knowledgeService.getKnowledgeBases(tenantId);
  }

  @Post('knowledge-bases')
  @RequirePermission('ai:write')
  @ApiOperation({ summary: 'Create a knowledge base' })
  async createKnowledgeBase(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateKnowledgeBaseDto,
  ) {
    return this.knowledgeService.createKnowledgeBase(tenantId, dto);
  }

  @Get('knowledge-bases/:id')
  @RequirePermission('ai:read')
  @ApiOperation({ summary: 'Get a knowledge base by ID' })
  async getKnowledgeBase(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const kb = await this.knowledgeService.getKnowledgeBaseById(tenantId, id);
    if (!kb) throw new NotFoundException('Knowledge base not found');
    return kb;
  }

  @Patch('knowledge-bases/:id')
  @RequirePermission('ai:write')
  @ApiOperation({ summary: 'Update a knowledge base' })
  async updateKnowledgeBase(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateKnowledgeBaseDto>,
  ) {
    return this.knowledgeService.updateKnowledgeBase(tenantId, id, dto);
  }

  @Delete('knowledge-bases/:id')
  @RequirePermission('ai:delete')
  @ApiOperation({ summary: 'Delete a knowledge base and all its documents' })
  async deleteKnowledgeBase(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.knowledgeService.deleteKnowledgeBase(tenantId, id);
    if (!deleted) throw new NotFoundException('Knowledge base not found');
    return { success: true };
  }

  // ─── Documents ────────────────────────────────────────────────

  @Post('knowledge-bases/:id/documents')
  @RequirePermission('ai:write')
  @ApiOperation({ summary: 'Add a document to a knowledge base' })
  async createDocument(
    @CurrentTenant() tenantId: string,
    @Param('id') knowledgeBaseId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.knowledgeService.createDocument(tenantId, knowledgeBaseId, dto);
  }

  @Get('knowledge-bases/:id/documents')
  @RequirePermission('ai:read')
  @ApiOperation({ summary: 'List documents in a knowledge base' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listDocuments(
    @CurrentTenant() tenantId: string,
    @Param('id') knowledgeBaseId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.knowledgeService.getDocuments(
      tenantId,
      knowledgeBaseId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Delete('documents/:id')
  @RequirePermission('ai:delete')
  @ApiOperation({ summary: 'Delete a document and its chunks' })
  async deleteDocument(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.knowledgeService.deleteDocument(tenantId, id);
    if (!deleted) throw new NotFoundException('Document not found');
    return { success: true };
  }

  @Post('documents/:id/process')
  @RequirePermission('ai:write')
  @ApiOperation({ summary: 'Trigger embedding processing for a document' })
  async processDocument(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.knowledgeService.processDocument(tenantId, id);
    return { success: true, message: 'Document processing enqueued' };
  }

  // ─── RAG Query ────────────────────────────────────────────────

  @Post('query')
  @RequirePermission('ai:read')
  @ApiOperation({ summary: 'Test a RAG query and get answer with sources' })
  async queryRag(
    @CurrentTenant() tenantId: string,
    @Body() dto: QueryRagDto,
  ) {
    const chunks = await this.ragService.retrieve(
      tenantId,
      dto.query,
      dto.limit || 5,
      dto.knowledgeBaseId,
    );
    const answer = await this.ragService.generateAnswer(dto.query, chunks);
    return {
      answer: answer.answer,
      confidence: answer.confidence,
      sources: chunks.map((c) => ({
        chunkId: c.id,
        content: c.content,
        distance: c.distance,
        documentId: c.documentId,
        knowledgeBaseId: c.knowledgeBaseId,
      })),
    };
  }

  // ─── Conversation AI Logs ────────────────────────────────────

  @Get('logs')
  @RequirePermission('ai:read')
  @ApiOperation({ summary: 'Get AI pipeline logs for a conversation' })
  @ApiQuery({ name: 'conversationId', required: true })
  async getLogs(
    @CurrentTenant() tenantId: string,
    @Query('conversationId') conversationId: string,
  ) {
    const fork = this.em.fork();
    return fork.find(
      AiConversationLogEntity,
      { tenantId, conversationId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  // ─── Feedback ─────────────────────────────────────────────────

  @Post('feedback')
  @RequirePermission('ai:write')
  @ApiOperation({ summary: 'Submit feedback on a knowledge chunk' })
  async submitFeedback(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: SubmitFeedbackDto,
  ) {
    const fork = this.em.fork();
    const feedback = fork.create(KnowledgeFeedbackEntity, {
      tenantId,
      chunkId: dto.chunkId,
      conversationId: dto.conversationId,
      rating: dto.rating,
      comment: dto.comment,
      createdBy: user.sub,
    } as any);
    await fork.persistAndFlush(feedback);
    return feedback;
  }
}
