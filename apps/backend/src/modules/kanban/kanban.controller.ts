import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant, CurrentUser } from '../../common/auth/tenant.decorator';
import { KanbanService, CardFilters } from './kanban.service';
import {
  CreateBoardDto,
  UpdateBoardDto,
  CreateCardDto,
  UpdateCardDto,
  MoveCardDto,
} from './dto';

@ApiTags('Kanban')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('kanban')
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  // ─── Boards ──────────────────────────────────────────────────────

  @Get('boards')
  @RequirePermission('kanban:read')
  @ApiOperation({ summary: 'List all boards for tenant' })
  async getBoards(@CurrentTenant() tenantId: string) {
    return this.kanbanService.getBoards(tenantId);
  }

  @Post('boards')
  @RequirePermission('kanban:write')
  @ApiOperation({ summary: 'Create a new board' })
  async createBoard(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateBoardDto,
  ) {
    return this.kanbanService.createBoard(tenantId, dto);
  }

  @Get('boards/:id')
  @RequirePermission('kanban:read')
  @ApiOperation({ summary: 'Get board by ID with columns and swimlanes' })
  async getBoardById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.kanbanService.getBoardById(tenantId, id);
  }

  @Patch('boards/:id')
  @RequirePermission('kanban:write')
  @ApiOperation({ summary: 'Update a board' })
  async updateBoard(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.kanbanService.updateBoard(tenantId, id, dto);
  }

  @Delete('boards/:id')
  @RequirePermission('kanban:delete')
  @ApiOperation({ summary: 'Delete a board' })
  async deleteBoard(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.kanbanService.deleteBoard(tenantId, id);
    return { success: true };
  }

  // ─── Columns ─────────────────────────────────────────────────────

  @Post('boards/:boardId/columns')
  @RequirePermission('kanban:write')
  @ApiOperation({ summary: 'Add a column to a board' })
  async createColumn(
    @CurrentTenant() tenantId: string,
    @Param('boardId') boardId: string,
    @Body() body: { name: string; position?: number; wipLimit?: number; color?: string; isTerminal?: boolean },
  ) {
    return this.kanbanService.createColumn(tenantId, boardId, body);
  }

  @Patch('columns/:id')
  @RequirePermission('kanban:write')
  @ApiOperation({ summary: 'Update a column' })
  async updateColumn(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; position?: number; wipLimit?: number; color?: string; isTerminal?: boolean },
  ) {
    return this.kanbanService.updateColumn(tenantId, id, body);
  }

  @Delete('columns/:id')
  @RequirePermission('kanban:delete')
  @ApiOperation({ summary: 'Delete a column' })
  async deleteColumn(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.kanbanService.deleteColumn(tenantId, id);
    return { success: true };
  }

  @Put('boards/:boardId/columns/reorder')
  @RequirePermission('kanban:write')
  @ApiOperation({ summary: 'Reorder columns in a board' })
  async reorderColumns(
    @CurrentTenant() tenantId: string,
    @Param('boardId') boardId: string,
    @Body('columnIds') columnIds: string[],
  ) {
    return this.kanbanService.reorderColumns(tenantId, boardId, columnIds);
  }

  // ─── Swimlanes ───────────────────────────────────────────────────

  @Post('boards/:boardId/swimlanes')
  @RequirePermission('kanban:write')
  @ApiOperation({ summary: 'Add a swimlane to a board' })
  async createSwimlane(
    @CurrentTenant() tenantId: string,
    @Param('boardId') boardId: string,
    @Body() body: { name: string; position?: number },
  ) {
    return this.kanbanService.createSwimlane(tenantId, boardId, body);
  }

  @Patch('swimlanes/:id')
  @RequirePermission('kanban:write')
  @ApiOperation({ summary: 'Update a swimlane' })
  async updateSwimlane(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; position?: number },
  ) {
    return this.kanbanService.updateSwimlane(tenantId, id, body);
  }

  @Delete('swimlanes/:id')
  @RequirePermission('kanban:delete')
  @ApiOperation({ summary: 'Delete a swimlane' })
  async deleteSwimlane(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.kanbanService.deleteSwimlane(tenantId, id);
    return { success: true };
  }

  // ─── Cards ───────────────────────────────────────────────────────

  @Post('cards')
  @RequirePermission('kanban:write')
  @ApiOperation({ summary: 'Create a new card' })
  async createCard(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateCardDto,
  ) {
    return this.kanbanService.createCard(tenantId, dto, user.sub);
  }

  @Patch('cards/:id')
  @RequirePermission('kanban:write')
  @ApiOperation({ summary: 'Update a card' })
  async updateCard(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.kanbanService.updateCard(tenantId, id, dto);
  }

  @Post('cards/:id/move')
  @RequirePermission('kanban:write')
  @ApiOperation({ summary: 'Move a card to a different column/position' })
  async moveCard(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: MoveCardDto,
  ) {
    return this.kanbanService.moveCard(tenantId, id, dto, user.sub);
  }

  @Delete('cards/:id')
  @RequirePermission('kanban:delete')
  @ApiOperation({ summary: 'Delete a card' })
  async deleteCard(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.kanbanService.deleteCard(tenantId, id);
    return { success: true };
  }

  @Get('boards/:boardId/cards')
  @RequirePermission('kanban:read')
  @ApiOperation({ summary: 'Get cards for a board with filters' })
  @ApiQuery({ name: 'columnId', required: false })
  @ApiQuery({ name: 'swimlaneId', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCardsByBoard(
    @CurrentTenant() tenantId: string,
    @Param('boardId') boardId: string,
    @Query('columnId') columnId?: string,
    @Query('swimlaneId') swimlaneId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: CardFilters = {
      columnId,
      swimlaneId,
      assignedTo,
      priority,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };
    return this.kanbanService.getCardsByBoard(tenantId, boardId, filters);
  }

  // ─── Metrics ─────────────────────────────────────────────────────

  @Get('boards/:boardId/metrics')
  @RequirePermission('kanban:read')
  @ApiOperation({ summary: 'Get board metrics (cards per column, avg dwell time, WIP status)' })
  async getBoardMetrics(
    @CurrentTenant() tenantId: string,
    @Param('boardId') boardId: string,
  ) {
    return this.kanbanService.getBoardMetrics(tenantId, boardId);
  }

  // ─── Card History ────────────────────────────────────────────────

  @Get('cards/:id/history')
  @RequirePermission('kanban:read')
  @ApiOperation({ summary: 'Get movement history for a card' })
  async getCardHistory(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.kanbanService.getCardHistory(tenantId, id);
  }

  @Get('cards/:id/cycle-time')
  @RequirePermission('kanban:read')
  @ApiOperation({ summary: 'Calculate cycle time for a card' })
  async getCycleTime(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const cycleTimeMs = await this.kanbanService.calculateCycleTime(tenantId, id);
    return { cardId: id, cycleTimeMs };
  }
}
