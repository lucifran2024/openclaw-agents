import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { MaterializedKpiEntity, PeriodType } from './entities/materialized-kpi.entity';
import { generateId } from '@repo/shared';

@Injectable()
export class KpiMaterializationService {
  private readonly logger = new Logger(KpiMaterializationService.name);

  constructor(private readonly em: EntityManager) {}

  async materializeHourly(tenantId: string): Promise<void> {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMinutes(0, 0, 0);
    const periodStart = new Date(periodEnd);
    periodStart.setHours(periodStart.getHours() - 1);

    const conn = this.em.getConnection();

    // First Response Time (FRT) - average seconds to first response
    const [frtResult] = await conn.execute<any[]>(
      `SELECT COALESCE(AVG(first_response_time_seconds), 0) AS value
       FROM conversations
       WHERE tenant_id = ?
         AND first_response_time_seconds IS NOT NULL
         AND created_at >= ? AND created_at < ?`,
      [tenantId, periodStart, periodEnd],
    );

    // Average Response Time (ART)
    const [artResult] = await conn.execute<any[]>(
      `SELECT COALESCE(AVG(avg_response_time_seconds), 0) AS value
       FROM conversations
       WHERE tenant_id = ?
         AND avg_response_time_seconds IS NOT NULL
         AND created_at >= ? AND created_at < ?`,
      [tenantId, periodStart, periodEnd],
    );

    // SLA Compliance
    const [slaResult] = await conn.execute<any[]>(
      `SELECT
         CASE WHEN COUNT(*) = 0 THEN 100
         ELSE ROUND(
           COUNT(*) FILTER (WHERE sla_breached = false)::numeric / COUNT(*)::numeric * 100,
           2
         )
         END AS value
       FROM conversations
       WHERE tenant_id = ?
         AND created_at >= ? AND created_at < ?`,
      [tenantId, periodStart, periodEnd],
    );

    // Throughput - messages processed per hour
    const [throughputResult] = await conn.execute<any[]>(
      `SELECT COUNT(*) AS value
       FROM messages
       WHERE tenant_id = ?
         AND created_at >= ? AND created_at < ?`,
      [tenantId, periodStart, periodEnd],
    );

    const metrics = [
      { metric: 'frt', value: parseFloat(frtResult?.value ?? '0') },
      { metric: 'art', value: parseFloat(artResult?.value ?? '0') },
      { metric: 'sla_compliance', value: parseFloat(slaResult?.value ?? '100') },
      { metric: 'throughput', value: parseInt(throughputResult?.value ?? '0', 10) },
    ];

    await this.upsertMetrics(tenantId, metrics, periodStart, periodEnd, PeriodType.HOURLY);

    this.logger.log(`Materialized hourly KPIs for tenant ${tenantId}`);
  }

  async materializeDaily(tenantId: string): Promise<void> {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setHours(0, 0, 0, 0);
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 1);

    const conn = this.em.getConnection();

    // First Contact Resolution (FCR) - resolved in single interaction
    const [fcrResult] = await conn.execute<any[]>(
      `SELECT
         CASE WHEN COUNT(*) = 0 THEN 0
         ELSE ROUND(
           COUNT(*) FILTER (WHERE status = 'resolved' AND message_count <= 2)::numeric
           / NULLIF(COUNT(*) FILTER (WHERE status = 'resolved'), 0)::numeric * 100,
           2
         )
         END AS value
       FROM conversations
       WHERE tenant_id = ?
         AND resolved_at >= ? AND resolved_at < ?`,
      [tenantId, periodStart, periodEnd],
    );

    // CSAT - average satisfaction score
    const [csatResult] = await conn.execute<any[]>(
      `SELECT COALESCE(AVG(csat_score), 0) AS value
       FROM conversations
       WHERE tenant_id = ?
         AND csat_score IS NOT NULL
         AND created_at >= ? AND created_at < ?`,
      [tenantId, periodStart, periodEnd],
    );

    // AI Deflection - conversations handled entirely by bot
    const [aiDeflectionResult] = await conn.execute<any[]>(
      `SELECT
         CASE WHEN COUNT(*) = 0 THEN 0
         ELSE ROUND(
           COUNT(*) FILTER (WHERE assigned_to IS NULL AND status = 'resolved')::numeric
           / COUNT(*)::numeric * 100,
           2
         )
         END AS value
       FROM conversations
       WHERE tenant_id = ?
         AND created_at >= ? AND created_at < ?`,
      [tenantId, periodStart, periodEnd],
    );

    // Agent Utilization - active conversations per agent
    const [utilizationResult] = await conn.execute<any[]>(
      `SELECT
         CASE WHEN COUNT(DISTINCT assigned_to) = 0 THEN 0
         ELSE ROUND(
           COUNT(*)::numeric / COUNT(DISTINCT assigned_to)::numeric,
           2
         )
         END AS value
       FROM conversations
       WHERE tenant_id = ?
         AND assigned_to IS NOT NULL
         AND status IN ('open', 'pending')
         AND created_at >= ? AND created_at < ?`,
      [tenantId, periodStart, periodEnd],
    );

    const metrics = [
      { metric: 'fcr', value: parseFloat(fcrResult?.value ?? '0') },
      { metric: 'csat', value: parseFloat(csatResult?.value ?? '0') },
      { metric: 'ai_deflection', value: parseFloat(aiDeflectionResult?.value ?? '0') },
      { metric: 'agent_utilization', value: parseFloat(utilizationResult?.value ?? '0') },
    ];

    await this.upsertMetrics(tenantId, metrics, periodStart, periodEnd, PeriodType.DAILY);

    this.logger.log(`Materialized daily KPIs for tenant ${tenantId}`);
  }

  private async upsertMetrics(
    tenantId: string,
    metrics: { metric: string; value: number }[],
    periodStart: Date,
    periodEnd: Date,
    periodType: PeriodType,
  ): Promise<void> {
    for (const { metric, value } of metrics) {
      const existing = await this.em.findOne(MaterializedKpiEntity, {
        tenantId,
        metric,
        periodType,
        periodStart,
      });

      if (existing) {
        existing.value = value;
      } else {
        const entity = this.em.create(MaterializedKpiEntity, {
          id: generateId(),
          tenantId,
          metric,
          value,
          dimensions: {},
          periodStart,
          periodEnd,
          periodType,
        } as any);
        this.em.persist(entity);
      }
    }

    await this.em.flush();
  }
}
