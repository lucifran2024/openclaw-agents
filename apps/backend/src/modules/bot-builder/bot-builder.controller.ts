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
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant, CurrentUser } from '../../common/auth/tenant.decorator';
import { FlowService } from './flow.service';
import { FlowEngineService } from './flow-engine.service';
import { FlowValidatorService } from './flow-validator.service';
import { CreateFlowDto, UpdateFlowDto, SaveCanvasDto } from './dto';
import { FlowStatus } from './entities/bot-flow.entity';

@ApiTags('Bot Builder')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('bot-builder')
export class BotBuilderController {
  constructor(
    private readonly flowService: FlowService,
    private readonly flowEngine: FlowEngineService,
    private readonly flowValidator: FlowValidatorService,
  ) {}

  // ── Flows ────────────────────────────────────────────────────

  @Get('flows')
  @RequirePermission('bot-builder:read')
  @ApiOperation({ summary: 'List bot flows' })
  @ApiQuery({ name: 'status', required: false, enum: FlowStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listFlows(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: FlowStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.flowService.findAll(tenantId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('flows')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Create a new bot flow' })
  async createFlow(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateFlowDto,
  ) {
    return this.flowService.create(tenantId, dto, user.sub);
  }

  @Get('flows/:id')
  @RequirePermission('bot-builder:read')
  @ApiOperation({ summary: 'Get a bot flow by ID' })
  async getFlow(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const flow = await this.flowService.findById(tenantId, id);
    if (!flow) throw new NotFoundException('Flow not found');
    return flow;
  }

  @Patch('flows/:id')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Update a bot flow' })
  async updateFlow(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFlowDto,
  ) {
    return this.flowService.update(tenantId, id, dto);
  }

  @Delete('flows/:id')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Delete a bot flow' })
  async deleteFlow(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.flowService.delete(tenantId, id);
    return { success: true };
  }

  @Post('flows/:id/publish')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Validate and publish a bot flow' })
  async publishFlow(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.flowService.publishFlow(tenantId, id);
  }

  @Post('flows/:id/archive')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Archive a bot flow' })
  async archiveFlow(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.flowService.archiveFlow(tenantId, id);
  }

  @Post('flows/:id/duplicate')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Duplicate a bot flow with all nodes and edges' })
  async duplicateFlow(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.flowService.duplicateFlow(tenantId, id, user.sub);
  }

  @Post('flows/:id/validate')
  @RequirePermission('bot-builder:read')
  @ApiOperation({ summary: 'Validate a bot flow without publishing' })
  async validateFlow(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.flowValidator.validateFlow(tenantId, id);
  }

  // ── Canvas ───────────────────────────────────────────────────

  @Put('flows/:id/canvas')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Save full canvas (nodes + edges) in one call' })
  async saveCanvas(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: SaveCanvasDto,
  ) {
    return this.flowService.saveCanvas(tenantId, id, dto);
  }

  // ── Nodes ────────────────────────────────────────────────────

  @Post('flows/:id/nodes')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Bulk upsert nodes for a flow' })
  async bulkUpsertNodes(
    @CurrentTenant() tenantId: string,
    @Param('id') flowId: string,
    @Body() nodes: Array<{
      id?: string;
      type: string;
      data?: Record<string, unknown>;
      position: { x: number; y: number };
    }>,
  ) {
    return this.flowService.bulkUpsertNodes(tenantId, flowId, nodes);
  }

  @Delete('nodes/:id')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Delete a node' })
  async deleteNode(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.flowService.deleteNode(tenantId, id);
    return { success: true };
  }

  // ── Edges ────────────────────────────────────────────────────

  @Post('flows/:id/edges')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Bulk upsert edges for a flow' })
  async bulkUpsertEdges(
    @CurrentTenant() tenantId: string,
    @Param('id') flowId: string,
    @Body() edges: Array<{
      id?: string;
      sourceNodeId: string;
      targetNodeId: string;
      sourceHandle?: string;
      label?: string;
    }>,
  ) {
    return this.flowService.bulkUpsertEdges(tenantId, flowId, edges);
  }

  @Delete('edges/:id')
  @RequirePermission('bot-builder:write')
  @ApiOperation({ summary: 'Delete an edge' })
  async deleteEdge(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.flowService.deleteEdge(tenantId, id);
    return { success: true };
  }

  // ── Sessions ─────────────────────────────────────────────────

  @Get('flows/:id/sessions')
  @RequirePermission('bot-builder:read')
  @ApiOperation({ summary: 'List sessions for a flow' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listSessions(
    @CurrentTenant() tenantId: string,
    @Param('id') flowId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.flowService.getFlowSessions(tenantId, flowId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('sessions/:id')
  @RequirePermission('bot-builder:read')
  @ApiOperation({ summary: 'Get a session by ID' })
  async getSession(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const session = await this.flowService.getSession(tenantId, id);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
