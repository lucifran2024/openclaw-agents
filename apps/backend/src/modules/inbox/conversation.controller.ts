import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant, CurrentUser } from '../../common/auth/tenant.decorator';
import { ConversationService, ConversationFilters } from './conversation.service';
import { MessageService } from './message.service';
import { InternalNoteEntity } from './internal-note.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CreateConversationDto,
  UpdateConversationDto,
  CreateMessageDto,
  CreateNoteDto,
} from './dto';
import { ConversationChannel, ConversationStatus } from './conversation.entity';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly em: EntityManager,
  ) {}

  @Get()
  @RequirePermission('conversations:read')
  @ApiOperation({ summary: 'List conversations with filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('teamId') teamId?: string,
    @Query('channel') channel?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: ConversationFilters = {
      status: status as ConversationFilters['status'],
      assignedTo,
      teamId,
      channel: channel as ConversationChannel,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };
    return this.conversationService.findAll(tenantId, filters);
  }

  @Get(':id')
  @RequirePermission('conversations:read')
  @ApiOperation({ summary: 'Get conversation by ID' })
  async findById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const conversation = await this.conversationService.findById(tenantId, id);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  @Post()
  @RequirePermission('conversations:write')
  @ApiOperation({ summary: 'Create a new conversation' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('conversations:write')
  @ApiOperation({ summary: 'Update conversation (assign, status, priority)' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    const conversation = await this.conversationService.findById(tenantId, id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (dto.assignedTo !== undefined) {
      await this.conversationService.assign(tenantId, id, dto.assignedTo);
    }

    if (dto.status !== undefined) {
      await this.conversationService.updateStatus(tenantId, id, dto.status);
    }

    if (dto.priority !== undefined || dto.teamId !== undefined) {
      this.em.assign(conversation, {
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.teamId !== undefined && { teamId: dto.teamId }),
      });
      await this.em.flush();
    }

    return this.conversationService.findById(tenantId, id);
  }

  @Post(':id/messages')
  @RequirePermission('conversations:write')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  async sendMessage(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    const conversation = await this.conversationService.findById(tenantId, id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const message = await this.messageService.create(tenantId, {
      conversationId: id,
      senderType: dto.senderType,
      senderId: dto.senderId,
      contentType: dto.contentType,
      content: dto.content,
      externalId: dto.externalId,
      idempotencyKey: dto.idempotencyKey,
    });

    const now = new Date();
    await this.conversationService.incrementMessageCount(tenantId, id);
    await this.conversationService.updateLastMessageAt(tenantId, id, now);

    return message;
  }

  @Get(':id/messages')
  @RequirePermission('conversations:read')
  @ApiOperation({ summary: 'List messages in a conversation (newest first)' })
  @ApiQuery({ name: 'before', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listMessages(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    const conversation = await this.conversationService.findById(tenantId, id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    return this.messageService.findByConversation(tenantId, id, {
      before,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post(':id/notes')
  @RequirePermission('conversations:write')
  @ApiOperation({ summary: 'Create an internal note' })
  async createNote(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateNoteDto,
  ) {
    const conversation = await this.conversationService.findById(tenantId, id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const note = this.em.create(InternalNoteEntity, {
      tenantId,
      conversationId: id,
      userId: user.sub,
      content: dto.content,
      mentionedUsers: dto.mentionedUsers ?? [],
    } as any);
    await this.em.persistAndFlush(note);
    return note;
  }

  @Get(':id/notes')
  @RequirePermission('conversations:read')
  @ApiOperation({ summary: 'List internal notes for a conversation' })
  async listNotes(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const conversation = await this.conversationService.findById(tenantId, id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    return this.em.find(
      InternalNoteEntity,
      { tenantId, conversationId: id },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  @Post(':id/transfer')
  @RequirePermission('conversations:write')
  @ApiOperation({ summary: 'Transfer conversation to another agent' })
  async transfer(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('toUserId') toUserId: string,
    @Body('fromUserId') fromUserId?: string,
  ) {
    const conversation = await this.conversationService.transfer(
      tenantId,
      id,
      toUserId,
      fromUserId,
    );
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }
}
