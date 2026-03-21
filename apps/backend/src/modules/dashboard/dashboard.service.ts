import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { MaterializedKpiEntity, PeriodType } from './entities/materialized-kpi.entity';
import { WidgetLayoutEntity, WidgetConfig } from './entities/widget-layout.entity';
import { BoardEntity } from '../kanban/entities/board.entity';
import { ColumnEntity } from '../kanban/entities/column.entity';

export interface KpiFilters {
  metrics: string[];
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  dimensions?: Record<string, string>;
}

export interface DateRangeFilters {
  startDate: string;
  endDate: string;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { widgetId: 'open-conversations', type: 'stat', x: 0, y: 0, w: 3, h: 2, config: { metric: 'open_conversations' } },
  { widgetId: 'avg-frt', type: 'stat', x: 3, y: 0, w: 3, h: 2, config: { metric: 'frt' } },
  { widgetId: 'avg-art', type: 'stat', x: 6, y: 0, w: 3, h: 2, config: { metric: 'art' } },
  { widgetId: 'sla-compliance', type: 'gauge', x: 9, y: 0, w: 3, h: 2, config: { metric: 'sla_compliance' } },
  { widgetId: 'throughput-chart', type: 'line_chart', x: 0, y: 2, w: 6, h: 4, config: { metric: 'throughput' } },
  { widgetId: 'csat-chart', type: 'line_chart', x: 6, y: 2, w: 6, h: 4, config: { metric: 'csat' } },
];

@Injectable()
export class DashboardService {
  constructor(private readonly em: EntityManager) {}

  async getKpis(
    tenantId: string,
    filters: KpiFilters,
  ): Promise<MaterializedKpiEntity[]> {
    const qb = this.em.createQueryBuilder(MaterializedKpiEntity, 'k');
    qb.where({
      tenantId,
      metric: { $in: filters.metrics },
      periodType: filters.periodType,
      periodStart: { $gte: new Date(filters.startDate) },
      periodEnd: { $lte: new Date(filters.endDate) },
    });

    if (filters.dimensions) {
      for (const [key, value] of Object.entries(filters.dimensions)) {
        qb.andWhere({ [`dimensions->'${key}'`]: value });
      }
    }

    return qb.orderBy({ periodStart: 'ASC' }).getResultList();
  }

  async getOverview(tenantId: string): Promise<Record<string, any>> {
    const conn = this.em.getConnection();

    const [conversationCounts] = await conn.execute<any[]>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'open') AS "openConversations",
         COUNT(*) FILTER (WHERE status = 'pending') AS "pendingConversations"
       FROM conversations
       WHERE tenant_id = ?`,
      [tenantId],
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [messageCounts] = await conn.execute<any[]>(
      `SELECT COUNT(*) AS "todayMessages"
       FROM messages
       WHERE tenant_id = ? AND created_at >= ?`,
      [tenantId, todayStart],
    );

    const [responseTimes] = await conn.execute<any[]>(
      `SELECT
         COALESCE(AVG(first_response_time_seconds), 0) AS "avgFrt",
         COALESCE(AVG(avg_response_time_seconds), 0) AS "avgArt"
       FROM conversations
       WHERE tenant_id = ? AND status IN ('open', 'pending', 'resolved')
         AND first_response_time_seconds IS NOT NULL
         AND created_at >= ?`,
      [tenantId, todayStart],
    );

    const [slaCounts] = await conn.execute<any[]>(
      `SELECT
         CASE WHEN COUNT(*) = 0 THEN 100
         ELSE ROUND(
           COUNT(*) FILTER (WHERE sla_breached = false)::numeric / COUNT(*)::numeric * 100,
           2
         )
         END AS "slaCompliance"
       FROM conversations
       WHERE tenant_id = ? AND created_at >= ?`,
      [tenantId, todayStart],
    );

    return {
      openConversations: parseInt(conversationCounts?.openConversations ?? '0', 10),
      pendingConversations: parseInt(conversationCounts?.pendingConversations ?? '0', 10),
      avgFrt: parseFloat(responseTimes?.avgFrt ?? '0'),
      avgArt: parseFloat(responseTimes?.avgArt ?? '0'),
      slaCompliance: parseFloat(slaCounts?.slaCompliance ?? '100'),
      todayMessages: parseInt(messageCounts?.todayMessages ?? '0', 10),
    };
  }

  async getWidgetLayout(
    tenantId: string,
    userId: string,
  ): Promise<WidgetLayoutEntity> {
    let layout = await this.em.findOne(WidgetLayoutEntity, {
      tenantId,
      userId,
    });

    if (!layout) {
      layout = this.em.create(WidgetLayoutEntity, {
        tenantId,
        userId,
        layoutName: 'default',
        widgets: DEFAULT_WIDGETS,
        isDefault: true,
      } as any);
      await this.em.persistAndFlush(layout);
    }

    return layout;
  }

  async saveWidgetLayout(
    tenantId: string,
    userId: string,
    widgets: WidgetConfig[],
    layoutName?: string,
  ): Promise<WidgetLayoutEntity> {
    let layout = await this.em.findOne(WidgetLayoutEntity, {
      tenantId,
      userId,
    });

    if (layout) {
      layout.widgets = widgets;
      if (layoutName) {
        layout.layoutName = layoutName;
      }
      layout.isDefault = false;
    } else {
      layout = this.em.create(WidgetLayoutEntity, {
        tenantId,
        userId,
        layoutName: layoutName ?? 'default',
        widgets,
        isDefault: false,
      } as any);
      this.em.persist(layout);
    }

    await this.em.flush();
    return layout;
  }

  async getCfdData(
    tenantId: string,
    boardId: string,
    range: DateRangeFilters,
  ) {
    const columns = await this.getBoardColumns(tenantId, boardId);
    const endDate = new Date(range.endDate);

    if (!columns.length) {
      return { boardId, columns: [], data: [] };
    }

    const rows = await this.em.getConnection().execute<any[]>(
      `SELECT
         h.card_id AS "cardId",
         h.to_column_id AS "toColumnId",
         h.moved_at AS "movedAt"
       FROM kanban_card_history h
       INNER JOIN kanban_cards c ON c.id = h.card_id
       WHERE h.tenant_id = ?
         AND c.board_id = ?
         AND h.moved_at <= ?
       ORDER BY h.moved_at ASC`,
      [tenantId, boardId, endDate],
    );

    const events = rows.map((row) => ({
      cardId: String(row.cardId),
      toColumnId: String(row.toColumnId),
      movedAt: new Date(row.movedAt),
    }));
    const cardState = new Map<string, string>();
    const snapshots = this.buildDailySeries(range.startDate, range.endDate);
    let eventIndex = 0;

    const data = snapshots.map((snapshotDate) => {
      const cutoff = new Date(snapshotDate);
      cutoff.setHours(23, 59, 59, 999);

      while (eventIndex < events.length && events[eventIndex].movedAt <= cutoff) {
        cardState.set(events[eventIndex].cardId, events[eventIndex].toColumnId);
        eventIndex += 1;
      }

      const point: Record<string, string | number> = {
        date: this.toDateLabel(snapshotDate),
      };

      for (const column of columns) {
        point[column.id] = 0;
      }

      for (const columnId of cardState.values()) {
        if (typeof point[columnId] === 'number') {
          point[columnId] = (point[columnId] as number) + 1;
        }
      }

      return point;
    });

    return {
      boardId,
      columns: columns.map((column) => ({
        id: column.id,
        name: column.name,
        color: column.color,
      })),
      data,
    };
  }

  async getCycleTimeDistribution(tenantId: string, boardId: string) {
    await this.assertBoardExists(tenantId, boardId);

    const rows = await this.em.getConnection().execute<any[]>(
      `SELECT
         c.id AS "cardId",
         MIN(CASE WHEN col.is_terminal = false THEN h.moved_at END) AS "startAt",
         MIN(CASE WHEN col.is_terminal = true THEN h.moved_at END) AS "endAt"
       FROM kanban_cards c
       INNER JOIN kanban_card_history h ON h.card_id = c.id AND h.tenant_id = c.tenant_id
       INNER JOIN kanban_columns col ON col.id = h.to_column_id AND col.tenant_id = c.tenant_id
       WHERE c.tenant_id = ?
         AND c.board_id = ?
       GROUP BY c.id`,
      [tenantId, boardId],
    );

    const cycleTimesHours = rows
      .map((row) => {
        if (!row.startAt || !row.endAt) {
          return null;
        }

        const startAt = new Date(row.startAt).getTime();
        const endAt = new Date(row.endAt).getTime();
        if (endAt <= startAt) {
          return null;
        }

        return (endAt - startAt) / (1000 * 60 * 60);
      })
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);

    const buckets = [
      { label: 'Ate 4h', count: 0, test: (value: number) => value <= 4 },
      { label: '4h a 24h', count: 0, test: (value: number) => value > 4 && value <= 24 },
      { label: '1 a 3 dias', count: 0, test: (value: number) => value > 24 && value <= 72 },
      { label: '3 a 7 dias', count: 0, test: (value: number) => value > 72 && value <= 168 },
      { label: '7+ dias', count: 0, test: (value: number) => value > 168 },
    ];

    for (const value of cycleTimesHours) {
      const bucket = buckets.find((candidate) => candidate.test(value));
      if (bucket) {
        bucket.count += 1;
      }
    }

    return {
      boardId,
      buckets: buckets.map(({ label, count }) => ({ label, count })),
      stats: {
        avgHours: this.round(this.average(cycleTimesHours)),
        p50Hours: this.round(this.percentile(cycleTimesHours, 0.5)),
        p90Hours: this.round(this.percentile(cycleTimesHours, 0.9)),
        totalCards: cycleTimesHours.length,
      },
    };
  }

  async getAgentPerformance(tenantId: string, range: DateRangeFilters) {
    const { startDate, endDate } = this.getRangeBounds(range);

    const rows = await this.em.getConnection().execute<any[]>(
      `SELECT
         c.assigned_to AS "agentId",
         COALESCE(u.name, 'Agente sem cadastro') AS "agentName",
         COALESCE(u.email, '') AS "agentEmail",
         COUNT(*) FILTER (WHERE c.status IN ('resolved', 'closed')) AS "resolvedCount",
         COUNT(*) FILTER (WHERE c.status IN ('open', 'pending')) AS "openCount",
         COALESCE(ROUND(AVG(c.first_response_time_seconds))::int, 0) AS "avgFrtSeconds",
         COALESCE(ROUND(AVG(c.avg_response_time_seconds))::int, 0) AS "avgArtSeconds"
       FROM conversations c
       LEFT JOIN users u ON u.id = c.assigned_to AND u.tenant_id = c.tenant_id
       WHERE c.tenant_id = ?
         AND c.assigned_to IS NOT NULL
         AND c.created_at >= ?
         AND c.created_at <= ?
       GROUP BY c.assigned_to, u.name, u.email
       ORDER BY "resolvedCount" DESC, "avgFrtSeconds" ASC, "avgArtSeconds" ASC
       LIMIT 20`,
      [tenantId, startDate, endDate],
    );

    return rows.map((row) => ({
      agentId: String(row.agentId),
      agentName: String(row.agentName),
      agentEmail: String(row.agentEmail),
      resolvedCount: parseInt(row.resolvedCount ?? '0', 10),
      openCount: parseInt(row.openCount ?? '0', 10),
      avgFrtSeconds: parseInt(row.avgFrtSeconds ?? '0', 10),
      avgArtSeconds: parseInt(row.avgArtSeconds ?? '0', 10),
    }));
  }

  async getChannelBreakdown(tenantId: string, range: DateRangeFilters) {
    const { startDate, endDate } = this.getRangeBounds(range);

    const rows = await this.em.getConnection().execute<any[]>(
      `SELECT
         c.channel AS "channel",
         COUNT(DISTINCT c.id) AS "conversations",
         COUNT(m.id) AS "messages"
       FROM conversations c
       LEFT JOIN messages m
         ON m.conversation_id = c.id
         AND m.tenant_id = c.tenant_id
         AND m.created_at >= ?
         AND m.created_at <= ?
       WHERE c.tenant_id = ?
         AND c.created_at >= ?
         AND c.created_at <= ?
       GROUP BY c.channel
       ORDER BY "conversations" DESC, "messages" DESC`,
      [startDate, endDate, tenantId, startDate, endDate],
    );

    return rows.map((row) => ({
      channel: String(row.channel),
      conversations: parseInt(row.conversations ?? '0', 10),
      messages: parseInt(row.messages ?? '0', 10),
    }));
  }

  async getNpsData(tenantId: string, range: DateRangeFilters) {
    const currentRange = this.getRangeBounds(range);
    const durationMs = currentRange.endDate.getTime() - currentRange.startDate.getTime();
    const previousRange = {
      startDate: new Date(currentRange.startDate.getTime() - durationMs),
      endDate: new Date(currentRange.endDate.getTime() - durationMs),
    };

    const [current, previous] = await Promise.all([
      this.getNpsSnapshot(tenantId, currentRange),
      this.getNpsSnapshot(tenantId, previousRange),
    ]);

    return {
      ...current,
      trend: this.round(current.score - previous.score),
    };
  }

  private async assertBoardExists(tenantId: string, boardId: string) {
    const board = await this.em.findOne(BoardEntity, { id: boardId, tenantId });
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  private async getBoardColumns(tenantId: string, boardId: string) {
    await this.assertBoardExists(tenantId, boardId);

    return this.em.find(
      ColumnEntity,
      { tenantId, board: boardId },
      { orderBy: { position: 'ASC' } },
    );
  }

  private buildDailySeries(startDate: string, endDate: string) {
    const dates: Date[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    const limit = new Date(endDate);
    limit.setHours(0, 0, 0, 0);

    while (cursor <= limit) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
  }

  private getRangeBounds(range: DateRangeFilters) {
    return {
      startDate: new Date(range.startDate),
      endDate: new Date(range.endDate),
    };
  }

  private toDateLabel(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private average(values: number[]) {
    if (!values.length) {
      return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private percentile(values: number[], percentile: number) {
    if (!values.length) {
      return 0;
    }

    const index = Math.max(0, Math.ceil(values.length * percentile) - 1);
    return values[Math.min(values.length - 1, index)];
  }

  private round(value: number) {
    return Math.round(value * 10) / 10;
  }

  private async getNpsSnapshot(
    tenantId: string,
    range: { startDate: Date; endDate: Date },
  ) {
    const [row] = await this.em.getConnection().execute<any[]>(
      `SELECT
         COUNT(*) FILTER (WHERE csat_score >= 9) AS "promoters",
         COUNT(*) FILTER (WHERE csat_score BETWEEN 7 AND 8) AS "passives",
         COUNT(*) FILTER (WHERE csat_score <= 6) AS "detractors"
       FROM conversations
       WHERE tenant_id = ?
         AND csat_score IS NOT NULL
         AND created_at >= ?
         AND created_at <= ?`,
      [tenantId, range.startDate, range.endDate],
    );

    const promoters = parseInt(row?.promoters ?? '0', 10);
    const passives = parseInt(row?.passives ?? '0', 10);
    const detractors = parseInt(row?.detractors ?? '0', 10);
    const totalResponses = promoters + passives + detractors;
    const score =
      totalResponses === 0 ? 0 : ((promoters - detractors) / totalResponses) * 100;

    return {
      score: this.round(score),
      promoters,
      passives,
      detractors,
      totalResponses,
    };
  }
}
