import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SavedReportEntity, ReportType } from './entities/saved-report.entity';
import { ReportSnapshotEntity, SnapshotFormat } from './entities/report-snapshot.entity';

export interface ReportFilters {
  type?: ReportType;
  page?: number;
  limit?: number;
}

export interface CreateReportDto {
  name: string;
  type: ReportType;
  filters?: Record<string, unknown>;
  schedule?: { cron: string; format: string; recipients: string[] };
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly em: EntityManager) {}

  async getReports(
    tenantId: string,
    filters: ReportFilters = {},
  ): Promise<{ data: SavedReportEntity[]; total: number }> {
    const { type, page = 1, limit = 20 } = filters;

    const where: Record<string, unknown> = { tenantId };
    if (type) where.type = type;

    const [data, total] = await this.em.findAndCount(SavedReportEntity, where, {
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });

    return { data, total };
  }

  async getReportById(tenantId: string, id: string): Promise<SavedReportEntity> {
    const report = await this.em.findOne(SavedReportEntity, { id, tenantId });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async createReport(
    tenantId: string,
    userId: string,
    dto: CreateReportDto,
  ): Promise<SavedReportEntity> {
    const report = this.em.create(SavedReportEntity, {
      tenantId,
      name: dto.name,
      type: dto.type,
      filters: dto.filters ?? {},
      schedule: dto.schedule,
      createdBy: userId,
    } as any);

    await this.em.persistAndFlush(report);
    this.logger.log(`Report created: ${report.id} by user ${userId}`);
    return report;
  }

  async deleteReport(tenantId: string, id: string): Promise<void> {
    const report = await this.getReportById(tenantId, id);
    await this.em.removeAndFlush(report);
    this.logger.log(`Report deleted: ${id}`);
  }

  async generateReport(
    tenantId: string,
    reportId: string,
  ): Promise<Record<string, unknown>> {
    const report = await this.getReportById(tenantId, reportId);

    let data: Record<string, unknown>;

    switch (report.type) {
      case ReportType.CONVERSATIONS:
        data = await this.getConversationReport(tenantId, report.filters);
        break;
      case ReportType.AGENTS:
        data = await this.getAgentReport(tenantId, report.filters);
        break;
      case ReportType.CAMPAIGNS:
        data = await this.getCampaignReport(tenantId, report.filters);
        break;
      case ReportType.APPOINTMENTS:
        data = await this.getAppointmentReport(tenantId, report.filters);
        break;
      case ReportType.CONTACTS:
        data = await this.getContactReport(tenantId, report.filters);
        break;
      default:
        data = {};
    }

    // Save snapshot
    const snapshot = this.em.create(ReportSnapshotEntity, {
      tenantId,
      reportId,
      data,
      format: SnapshotFormat.JSON,
      generatedAt: new Date(),
    } as any);

    await this.em.persistAndFlush(snapshot);

    return data;
  }

  async getConversationReport(
    tenantId: string,
    filters: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const knex = this.em.getKnex();

    const dateFrom = (filters.dateFrom as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = (filters.dateTo as string) || new Date().toISOString();

    const totalConversations = await knex('conversations')
      .where('tenant_id', tenantId)
      .whereBetween('created_at', [dateFrom, dateTo])
      .count('id as count')
      .first();

    const byStatus = await knex('conversations')
      .where('tenant_id', tenantId)
      .whereBetween('created_at', [dateFrom, dateTo])
      .select('status')
      .count('id as count')
      .groupBy('status');

    const avgResponseTime = await knex('conversations')
      .where('tenant_id', tenantId)
      .whereBetween('created_at', [dateFrom, dateTo])
      .whereNotNull('first_response_at')
      .select(
        knex.raw(
          'AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))) as avg_seconds',
        ),
      )
      .first();

    return {
      period: { from: dateFrom, to: dateTo },
      totalConversations: parseInt(String(totalConversations?.count ?? '0'), 10),
      byStatus: byStatus.map((r) => ({
        status: r.status,
        count: parseInt(String(r.count), 10),
      })),
      avgResponseTimeSeconds: parseFloat(String(avgResponseTime?.avg_seconds ?? '0')),
    };
  }

  async getAgentReport(
    tenantId: string,
    filters: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const knex = this.em.getKnex();

    const dateFrom = (filters.dateFrom as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = (filters.dateTo as string) || new Date().toISOString();

    const agentStats = await knex('conversations')
      .where('tenant_id', tenantId)
      .whereBetween('created_at', [dateFrom, dateTo])
      .whereNotNull('assigned_to')
      .select('assigned_to')
      .count('id as total_conversations')
      .groupBy('assigned_to');

    return {
      period: { from: dateFrom, to: dateTo },
      agents: agentStats.map((r) => ({
        agentId: r.assigned_to,
        totalConversations: parseInt(String(r.total_conversations), 10),
      })),
    };
  }

  async getCampaignReport(
    tenantId: string,
    filters: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const knex = this.em.getKnex();

    const dateFrom = (filters.dateFrom as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = (filters.dateTo as string) || new Date().toISOString();

    const campaigns = await knex('campaigns')
      .where('tenant_id', tenantId)
      .whereBetween('created_at', [dateFrom, dateTo])
      .select('id', 'name', 'status', 'stats', 'created_at', 'started_at', 'completed_at');

    const byStatus = await knex('campaigns')
      .where('tenant_id', tenantId)
      .whereBetween('created_at', [dateFrom, dateTo])
      .select('status')
      .count('id as count')
      .groupBy('status');

    return {
      period: { from: dateFrom, to: dateTo },
      totalCampaigns: campaigns.length,
      byStatus: byStatus.map((r) => ({
        status: r.status,
        count: parseInt(String(r.count), 10),
      })),
      campaigns,
    };
  }

  private async getAppointmentReport(
    tenantId: string,
    filters: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const knex = this.em.getKnex();

    const dateFrom = (filters.dateFrom as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = (filters.dateTo as string) || new Date().toISOString();

    const totalAppointments = await knex('appointments')
      .where('tenant_id', tenantId)
      .whereBetween('created_at', [dateFrom, dateTo])
      .count('id as count')
      .first();

    const byStatus = await knex('appointments')
      .where('tenant_id', tenantId)
      .whereBetween('created_at', [dateFrom, dateTo])
      .select('status')
      .count('id as count')
      .groupBy('status');

    return {
      period: { from: dateFrom, to: dateTo },
      totalAppointments: parseInt(String(totalAppointments?.count ?? '0'), 10),
      byStatus: byStatus.map((r) => ({
        status: r.status,
        count: parseInt(String(r.count), 10),
      })),
    };
  }

  private async getContactReport(
    tenantId: string,
    filters: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const knex = this.em.getKnex();

    const dateFrom = (filters.dateFrom as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = (filters.dateTo as string) || new Date().toISOString();

    const totalContacts = await knex('contacts')
      .where('tenant_id', tenantId)
      .whereNull('deleted_at')
      .count('id as count')
      .first();

    const newContacts = await knex('contacts')
      .where('tenant_id', tenantId)
      .whereNull('deleted_at')
      .whereBetween('created_at', [dateFrom, dateTo])
      .count('id as count')
      .first();

    return {
      period: { from: dateFrom, to: dateTo },
      totalContacts: parseInt(String(totalContacts?.count ?? '0'), 10),
      newContacts: parseInt(String(newContacts?.count ?? '0'), 10),
    };
  }
}
