import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BoardEntity } from './entities/board.entity';
import { ColumnEntity } from './entities/column.entity';
import { SwimlaneEntity } from './entities/swimlane.entity';
import { CardEntity } from './entities/card.entity';
import { CardHistoryEntity } from './entities/card-history.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';

export interface CardFilters {
  columnId?: string;
  swimlaneId?: string;
  assignedTo?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface BoardMetrics {
  columnsMetrics: Array<{
    columnId: string;
    columnName: string;
    cardCount: number;
    wipLimit: number;
    wipExceeded: boolean;
    avgDwellTimeMs: number | null;
  }>;
  totalCards: number;
}

@Injectable()
export class KanbanService {
  constructor(private readonly em: EntityManager) {}

  // ─── Boards ──────────────────────────────────────────────────────

  async createBoard(tenantId: string, dto: CreateBoardDto): Promise<BoardEntity> {
    const board = this.em.create(BoardEntity, {
      ...dto,
      tenantId,
    } as any);
    await this.em.persistAndFlush(board);
    return board;
  }

  async getBoards(tenantId: string): Promise<BoardEntity[]> {
    return this.em.find(BoardEntity, { tenantId }, { populate: ['columns', 'swimlanes'] });
  }

  async getBoardById(tenantId: string, id: string): Promise<BoardEntity> {
    const board = await this.em.findOne(
      BoardEntity,
      { id, tenantId },
      { populate: ['columns', 'swimlanes'] },
    );
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async updateBoard(tenantId: string, id: string, dto: UpdateBoardDto): Promise<BoardEntity> {
    const board = await this.getBoardById(tenantId, id);
    this.em.assign(board, dto);
    await this.em.flush();
    return board;
  }

  async deleteBoard(tenantId: string, id: string): Promise<void> {
    const board = await this.getBoardById(tenantId, id);
    await this.em.removeAndFlush(board);
  }

  // ─── Columns ─────────────────────────────────────────────────────

  async createColumn(
    tenantId: string,
    boardId: string,
    data: { name: string; position?: number; wipLimit?: number; color?: string; isTerminal?: boolean },
  ): Promise<ColumnEntity> {
    const board = await this.getBoardById(tenantId, boardId);

    // Auto-position at the end if not specified
    if (data.position === undefined) {
      const maxPos = await this.em
        .createQueryBuilder(ColumnEntity, 'c')
        .select('max(c.position) as maxPos')
        .where({ board, tenantId })
        .execute('get');
      data.position = ((maxPos as any)?.maxPos ?? -1) + 1;
    }

    const column = this.em.create(ColumnEntity, {
      ...data,
      board,
      tenantId,
    } as any);
    await this.em.persistAndFlush(column);
    return column;
  }

  async updateColumn(
    tenantId: string,
    id: string,
    data: Partial<{ name: string; position: number; wipLimit: number; color: string; isTerminal: boolean }>,
  ): Promise<ColumnEntity> {
    const column = await this.em.findOne(ColumnEntity, { id, tenantId });
    if (!column) throw new NotFoundException('Column not found');
    this.em.assign(column, data);
    await this.em.flush();
    return column;
  }

  async deleteColumn(tenantId: string, id: string): Promise<void> {
    const column = await this.em.findOne(ColumnEntity, { id, tenantId });
    if (!column) throw new NotFoundException('Column not found');

    // Check for cards in this column
    const cardCount = await this.em.count(CardEntity, { column, tenantId });
    if (cardCount > 0) {
      throw new BadRequestException('Cannot delete column that contains cards. Move or delete cards first.');
    }

    await this.em.removeAndFlush(column);
  }

  async reorderColumns(tenantId: string, boardId: string, columnIds: string[]): Promise<ColumnEntity[]> {
    const board = await this.getBoardById(tenantId, boardId);
    const columns = await this.em.find(ColumnEntity, { board, tenantId });

    const columnMap = new Map(columns.map((c) => [c.id, c]));

    for (let i = 0; i < columnIds.length; i++) {
      const col = columnMap.get(columnIds[i]);
      if (!col) throw new NotFoundException(`Column ${columnIds[i]} not found`);
      col.position = i;
    }

    await this.em.flush();
    return this.em.find(ColumnEntity, { board, tenantId }, { orderBy: { position: 'ASC' } });
  }

  // ─── Swimlanes ───────────────────────────────────────────────────

  async createSwimlane(
    tenantId: string,
    boardId: string,
    data: { name: string; position?: number },
  ): Promise<SwimlaneEntity> {
    const board = await this.getBoardById(tenantId, boardId);

    if (data.position === undefined) {
      const maxPos = await this.em
        .createQueryBuilder(SwimlaneEntity, 's')
        .select('max(s.position) as maxPos')
        .where({ board, tenantId })
        .execute('get');
      data.position = ((maxPos as any)?.maxPos ?? -1) + 1;
    }

    const swimlane = this.em.create(SwimlaneEntity, {
      ...data,
      board,
      tenantId,
    } as any);
    await this.em.persistAndFlush(swimlane);
    return swimlane;
  }

  async updateSwimlane(
    tenantId: string,
    id: string,
    data: Partial<{ name: string; position: number }>,
  ): Promise<SwimlaneEntity> {
    const swimlane = await this.em.findOne(SwimlaneEntity, { id, tenantId });
    if (!swimlane) throw new NotFoundException('Swimlane not found');
    this.em.assign(swimlane, data);
    await this.em.flush();
    return swimlane;
  }

  async deleteSwimlane(tenantId: string, id: string): Promise<void> {
    const swimlane = await this.em.findOne(SwimlaneEntity, { id, tenantId });
    if (!swimlane) throw new NotFoundException('Swimlane not found');
    await this.em.removeAndFlush(swimlane);
  }

  // ─── Cards ───────────────────────────────────────────────────────

  async createCard(tenantId: string, dto: CreateCardDto, userId?: string): Promise<CardEntity> {
    const board = await this.getBoardById(tenantId, dto.boardId);
    const column = await this.em.findOneOrFail(ColumnEntity, { id: dto.columnId, tenantId });

    let swimlane: SwimlaneEntity | undefined;
    if (dto.swimlaneId) {
      swimlane = (await this.em.findOne(SwimlaneEntity, { id: dto.swimlaneId, tenantId })) ?? undefined;
    }

    // Auto-position at end if not specified
    let position = dto.position;
    if (position === undefined) {
      const maxPos = await this.em
        .createQueryBuilder(CardEntity, 'card')
        .select('max(card.position) as maxPos')
        .where({ column, tenantId })
        .execute('get');
      position = ((maxPos as any)?.maxPos ?? -1) + 1;
    }

    const card = this.em.create(CardEntity, {
      tenantId,
      board,
      column,
      swimlane,
      conversationId: dto.conversationId,
      contactId: dto.contactId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      assignedTo: dto.assignedTo,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      position,
      metadata: dto.metadata ?? {},
    } as any);

    await this.em.persistAndFlush(card);

    // Log initial placement
    const history = this.em.create(CardHistoryEntity, {
      tenantId,
      card,
      toColumnId: column.id,
      movedBy: userId,
      movedAt: new Date(),
    } as any);
    await this.em.persistAndFlush(history);

    return card;
  }

  async updateCard(tenantId: string, id: string, dto: UpdateCardDto): Promise<CardEntity> {
    const card = await this.em.findOne(CardEntity, { id, tenantId });
    if (!card) throw new NotFoundException('Card not found');

    const assignData: Record<string, unknown> = { ...dto };

    if (dto.swimlaneId) {
      assignData.swimlane = await this.em.findOneOrFail(SwimlaneEntity, { id: dto.swimlaneId, tenantId });
      delete assignData.swimlaneId;
    }

    if (dto.dueDate) {
      assignData.dueDate = new Date(dto.dueDate);
    }

    this.em.assign(card, assignData);
    await this.em.flush();
    return card;
  }

  async moveCard(tenantId: string, cardId: string, dto: MoveCardDto, userId?: string): Promise<CardEntity> {
    const card = await this.em.findOne(CardEntity, { id: cardId, tenantId }, { populate: ['column'] });
    if (!card) throw new NotFoundException('Card not found');

    const fromColumn = card.column;
    const toColumn = await this.em.findOneOrFail(ColumnEntity, { id: dto.columnId, tenantId });

    // Calculate dwell time in the previous column
    const lastHistory = await this.em.findOne(
      CardHistoryEntity,
      { card, toColumnId: fromColumn.id, tenantId },
      { orderBy: { movedAt: 'DESC' } },
    );
    const dwellTimeMs = lastHistory
      ? Date.now() - lastHistory.movedAt.getTime()
      : undefined;

    // Update card
    card.column = toColumn;
    if (dto.position !== undefined) {
      card.position = dto.position;
    }
    if (dto.swimlaneId) {
      card.swimlane = (await this.em.findOne(SwimlaneEntity, { id: dto.swimlaneId, tenantId })) ?? undefined;
    }

    // Record history
    const history = this.em.create(CardHistoryEntity, {
      tenantId,
      card,
      fromColumnId: fromColumn.id,
      toColumnId: toColumn.id,
      movedBy: userId,
      movedAt: new Date(),
      dwellTimeMs,
    } as any);

    this.em.persist(history);
    await this.em.flush();

    return card;
  }

  async deleteCard(tenantId: string, id: string): Promise<void> {
    const card = await this.em.findOne(CardEntity, { id, tenantId });
    if (!card) throw new NotFoundException('Card not found');
    await this.em.removeAndFlush(card);
  }

  async getCardsByBoard(tenantId: string, boardId: string, filters: CardFilters = {}): Promise<{
    data: CardEntity[];
    total: number;
  }> {
    const { columnId, swimlaneId, assignedTo, priority, page = 1, limit = 50 } = filters;

    const where: Record<string, unknown> = {
      tenantId,
      board: boardId,
    };

    if (columnId) where.column = columnId;
    if (swimlaneId) where.swimlane = swimlaneId;
    if (assignedTo) where.assignedTo = assignedTo;
    if (priority) where.priority = priority;

    const [data, total] = await Promise.all([
      this.em.find(CardEntity, where, {
        populate: ['column', 'swimlane'],
        orderBy: { position: 'ASC' },
        limit,
        offset: (page - 1) * limit,
      }),
      this.em.count(CardEntity, where),
    ]);

    return { data, total };
  }

  // ─── Metrics ─────────────────────────────────────────────────────

  async getBoardMetrics(tenantId: string, boardId: string): Promise<BoardMetrics> {
    const board = await this.getBoardById(tenantId, boardId);
    const columns = await this.em.find(ColumnEntity, { board, tenantId }, { orderBy: { position: 'ASC' } });

    const columnsMetrics = await Promise.all(
      columns.map(async (col) => {
        const cardCount = await this.em.count(CardEntity, { column: col, tenantId });

        // Average dwell time: from card-history entries that left this column
        const avgResult = await this.em
          .createQueryBuilder(CardHistoryEntity, 'h')
          .select('avg(h.dwell_time_ms) as avgDwell')
          .where({ fromColumnId: col.id, tenantId, dwellTimeMs: { $ne: null } })
          .execute('get');

        return {
          columnId: col.id,
          columnName: col.name,
          cardCount,
          wipLimit: col.wipLimit,
          wipExceeded: col.wipLimit > 0 && cardCount > col.wipLimit,
          avgDwellTimeMs: (avgResult as any)?.avgDwell ? Number((avgResult as any).avgDwell) : null,
        };
      }),
    );

    const totalCards = columnsMetrics.reduce((sum, c) => sum + c.cardCount, 0);

    return { columnsMetrics, totalCards };
  }

  // ─── Card History / Cycle Time ───────────────────────────────────

  async getCardHistory(tenantId: string, cardId: string): Promise<CardHistoryEntity[]> {
    return this.em.find(
      CardHistoryEntity,
      { card: cardId, tenantId },
      { orderBy: { movedAt: 'ASC' } },
    );
  }

  async calculateCycleTime(tenantId: string, cardId: string): Promise<number | null> {
    const history = await this.getCardHistory(tenantId, cardId);
    if (history.length < 2) return null;

    // Find the first move into a non-terminal column
    const columns = await this.em.find(ColumnEntity, { tenantId });
    const terminalColumnIds = new Set(columns.filter((c) => c.isTerminal).map((c) => c.id));

    const firstNonTerminal = history.find(
      (h) => h.toColumnId && !terminalColumnIds.has(h.toColumnId),
    );
    const firstTerminal = history.find(
      (h) => h.toColumnId && terminalColumnIds.has(h.toColumnId),
    );

    if (!firstNonTerminal || !firstTerminal) return null;

    return firstTerminal.movedAt.getTime() - firstNonTerminal.movedAt.getTime();
  }
}
