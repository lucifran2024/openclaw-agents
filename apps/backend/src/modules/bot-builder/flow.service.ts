import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { generateId } from '@repo/shared';
import { BotFlowEntity, FlowStatus } from './entities/bot-flow.entity';
import { BotFlowNodeEntity, NodeType } from './entities/bot-flow-node.entity';
import { BotFlowEdgeEntity } from './entities/bot-flow-edge.entity';
import { BotFlowSessionEntity } from './entities/bot-flow-session.entity';
import { FlowValidatorService } from './flow-validator.service';
import { CreateFlowDto, UpdateFlowDto, SaveCanvasDto } from './dto';

@Injectable()
export class FlowService {
  constructor(
    private readonly em: EntityManager,
    private readonly flowValidator: FlowValidatorService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateFlowDto,
    userId: string,
  ): Promise<BotFlowEntity> {
    const flow = this.em.create(BotFlowEntity, {
      ...dto,
      tenantId,
      createdBy: userId,
    } as any);
    await this.em.persistAndFlush(flow);
    return flow;
  }

  async findAll(
    tenantId: string,
    filters: { status?: FlowStatus; page?: number; limit?: number } = {},
  ): Promise<{ data: BotFlowEntity[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters;
    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;

    const [data, total] = await this.em.findAndCount(BotFlowEntity, where, {
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });

    return { data, total };
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<BotFlowEntity | null> {
    return this.em.findOne(BotFlowEntity, { id, tenantId });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateFlowDto,
  ): Promise<BotFlowEntity> {
    const flow = await this.em.findOne(BotFlowEntity, { id, tenantId });
    if (!flow) throw new NotFoundException('Flow not found');

    this.em.assign(flow, dto);
    await this.em.flush();
    return flow;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const flow = await this.em.findOne(BotFlowEntity, { id, tenantId });
    if (!flow) throw new NotFoundException('Flow not found');

    // Delete related nodes, edges, sessions
    await this.em.nativeDelete(BotFlowEdgeEntity, { tenantId, flowId: id });
    await this.em.nativeDelete(BotFlowNodeEntity, { tenantId, flowId: id });
    await this.em.nativeDelete(BotFlowSessionEntity, { tenantId, flowId: id });
    await this.em.removeAndFlush(flow);
  }

  async publishFlow(tenantId: string, id: string): Promise<BotFlowEntity> {
    const flow = await this.em.findOne(BotFlowEntity, { id, tenantId });
    if (!flow) throw new NotFoundException('Flow not found');

    const validation = await this.flowValidator.validateFlow(tenantId, id);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Flow validation failed',
        errors: validation.errors,
      });
    }

    flow.status = FlowStatus.PUBLISHED;
    flow.version += 1;
    flow.publishedAt = new Date();
    await this.em.flush();
    return flow;
  }

  async archiveFlow(tenantId: string, id: string): Promise<BotFlowEntity> {
    const flow = await this.em.findOne(BotFlowEntity, { id, tenantId });
    if (!flow) throw new NotFoundException('Flow not found');

    flow.status = FlowStatus.ARCHIVED;
    await this.em.flush();
    return flow;
  }

  async duplicateFlow(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<BotFlowEntity> {
    const flow = await this.em.findOne(BotFlowEntity, { id, tenantId });
    if (!flow) throw new NotFoundException('Flow not found');

    const nodes = await this.em.find(BotFlowNodeEntity, {
      tenantId,
      flowId: id,
    });
    const edges = await this.em.find(BotFlowEdgeEntity, {
      tenantId,
      flowId: id,
    });

    // Create new flow
    const newFlow = this.em.create(BotFlowEntity, {
      tenantId,
      name: `${flow.name} (copy)`,
      description: flow.description,
      triggerType: flow.triggerType,
      triggerConfig: { ...flow.triggerConfig },
      status: FlowStatus.DRAFT,
      version: 1,
      createdBy: userId,
    } as any);

    // Map old node IDs to new node IDs
    const nodeIdMap = new Map<string, string>();

    const newNodes = nodes.map((node) => {
      const newNodeId = generateId();
      nodeIdMap.set(node.id, newNodeId);

      return this.em.create(BotFlowNodeEntity, {
        id: newNodeId,
        tenantId,
        flowId: newFlow.id,
        type: node.type,
        data: { ...node.data },
        position: { ...node.position },
      } as any);
    });

    const newEdges = edges.map((edge) => {
      return this.em.create(BotFlowEdgeEntity, {
        tenantId,
        flowId: newFlow.id,
        sourceNodeId: nodeIdMap.get(edge.sourceNodeId) || edge.sourceNodeId,
        targetNodeId: nodeIdMap.get(edge.targetNodeId) || edge.targetNodeId,
        sourceHandle: edge.sourceHandle,
        label: edge.label,
      } as any);
    });

    this.em.persist(newFlow);
    newNodes.forEach((n) => this.em.persist(n));
    newEdges.forEach((e) => this.em.persist(e));
    await this.em.flush();

    return newFlow;
  }

  // ── Canvas (bulk nodes + edges) ──────────────────────────────

  async saveCanvas(
    tenantId: string,
    flowId: string,
    dto: SaveCanvasDto,
  ): Promise<{ nodes: BotFlowNodeEntity[]; edges: BotFlowEdgeEntity[] }> {
    const flow = await this.em.findOne(BotFlowEntity, {
      id: flowId,
      tenantId,
    });
    if (!flow) throw new NotFoundException('Flow not found');

    // Delete existing nodes and edges for this flow
    await this.em.nativeDelete(BotFlowEdgeEntity, { tenantId, flowId });
    await this.em.nativeDelete(BotFlowNodeEntity, { tenantId, flowId });

    // Mapping from client-side IDs to persisted IDs
    const nodeIdMap = new Map<string, string>();

    const nodes = dto.nodes.map((n) => {
      const nodeId = n.id || generateId();
      nodeIdMap.set(n.id || nodeId, nodeId);

      return this.em.create(BotFlowNodeEntity, {
        id: nodeId,
        tenantId,
        flowId,
        type: n.type,
        data: n.data || {},
        position: n.position,
      } as any);
    });

    const edges = dto.edges.map((e) => {
      return this.em.create(BotFlowEdgeEntity, {
        id: e.id || generateId(),
        tenantId,
        flowId,
        sourceNodeId: nodeIdMap.get(e.sourceNodeId) || e.sourceNodeId,
        targetNodeId: nodeIdMap.get(e.targetNodeId) || e.targetNodeId,
        sourceHandle: e.sourceHandle,
        label: e.label,
      } as any);
    });

    nodes.forEach((n) => this.em.persist(n));
    edges.forEach((e) => this.em.persist(e));
    await this.em.flush();

    return { nodes, edges };
  }

  // ── Nodes CRUD ───────────────────────────────────────────────

  async bulkUpsertNodes(
    tenantId: string,
    flowId: string,
    nodesData: Array<{
      id?: string;
      type: string;
      data?: Record<string, unknown>;
      position: { x: number; y: number };
    }>,
  ): Promise<BotFlowNodeEntity[]> {
    const flow = await this.em.findOne(BotFlowEntity, {
      id: flowId,
      tenantId,
    });
    if (!flow) throw new NotFoundException('Flow not found');

    const results: BotFlowNodeEntity[] = [];

    for (const nodeData of nodesData) {
      if (nodeData.id) {
        const existing = await this.em.findOne(BotFlowNodeEntity, {
          id: nodeData.id,
          tenantId,
          flowId,
        });
        if (existing) {
          this.em.assign(existing, {
            type: nodeData.type as NodeType,
            data: nodeData.data || {},
            position: nodeData.position,
          });
          results.push(existing);
          continue;
        }
      }

      const node = this.em.create(BotFlowNodeEntity, {
        id: nodeData.id || generateId(),
        tenantId,
        flowId,
        type: nodeData.type,
        data: nodeData.data || {},
        position: nodeData.position,
      } as any);
      this.em.persist(node);
      results.push(node);
    }

    await this.em.flush();
    return results;
  }

  async deleteNode(tenantId: string, nodeId: string): Promise<void> {
    const node = await this.em.findOne(BotFlowNodeEntity, {
      id: nodeId,
      tenantId,
    });
    if (!node) throw new NotFoundException('Node not found');

    // Remove edges connected to this node
    await this.em.nativeDelete(BotFlowEdgeEntity, {
      tenantId,
      $or: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
    });
    await this.em.removeAndFlush(node);
  }

  // ── Edges CRUD ───────────────────────────────────────────────

  async bulkUpsertEdges(
    tenantId: string,
    flowId: string,
    edgesData: Array<{
      id?: string;
      sourceNodeId: string;
      targetNodeId: string;
      sourceHandle?: string;
      label?: string;
    }>,
  ): Promise<BotFlowEdgeEntity[]> {
    const flow = await this.em.findOne(BotFlowEntity, {
      id: flowId,
      tenantId,
    });
    if (!flow) throw new NotFoundException('Flow not found');

    const results: BotFlowEdgeEntity[] = [];

    for (const edgeData of edgesData) {
      if (edgeData.id) {
        const existing = await this.em.findOne(BotFlowEdgeEntity, {
          id: edgeData.id,
          tenantId,
          flowId,
        });
        if (existing) {
          this.em.assign(existing, {
            sourceNodeId: edgeData.sourceNodeId,
            targetNodeId: edgeData.targetNodeId,
            sourceHandle: edgeData.sourceHandle,
            label: edgeData.label,
          });
          results.push(existing);
          continue;
        }
      }

      const edge = this.em.create(BotFlowEdgeEntity, {
        id: edgeData.id || generateId(),
        tenantId,
        flowId,
        sourceNodeId: edgeData.sourceNodeId,
        targetNodeId: edgeData.targetNodeId,
        sourceHandle: edgeData.sourceHandle,
        label: edgeData.label,
      } as any);
      this.em.persist(edge);
      results.push(edge);
    }

    await this.em.flush();
    return results;
  }

  async deleteEdge(tenantId: string, edgeId: string): Promise<void> {
    const edge = await this.em.findOne(BotFlowEdgeEntity, {
      id: edgeId,
      tenantId,
    });
    if (!edge) throw new NotFoundException('Edge not found');

    await this.em.removeAndFlush(edge);
  }

  // ── Sessions ─────────────────────────────────────────────────

  async getFlowSessions(
    tenantId: string,
    flowId: string,
    filters: { page?: number; limit?: number } = {},
  ): Promise<{ data: BotFlowSessionEntity[]; total: number }> {
    const { page = 1, limit = 20 } = filters;

    const [data, total] = await this.em.findAndCount(
      BotFlowSessionEntity,
      { tenantId, flowId },
      {
        orderBy: { createdAt: 'DESC' },
        limit,
        offset: (page - 1) * limit,
      },
    );

    return { data, total };
  }

  async getSession(
    tenantId: string,
    sessionId: string,
  ): Promise<BotFlowSessionEntity | null> {
    return this.em.findOne(BotFlowSessionEntity, {
      id: sessionId,
      tenantId,
    });
  }
}
