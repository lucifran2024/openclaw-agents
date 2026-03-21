import {
  Controller,
  Get,
  Post,
  Patch,
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
import { CampaignService, CampaignFilters } from './campaign.service';
import { SuppressionService } from './suppression.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignStatus } from './entities/campaign.entity';
import { CampaignMessageStatus } from './entities/campaign-message.entity';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly suppressionService: SuppressionService,
  ) {}

  @Get()
  @RequirePermission('campaigns:read')
  @ApiOperation({ summary: 'List campaigns with pagination and filters' })
  @ApiQuery({ name: 'status', required: false, enum: CampaignStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: CampaignStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: CampaignFilters = {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };
    return this.campaignService.getCampaigns(tenantId, filters);
  }

  @Post()
  @RequirePermission('campaigns:write')
  @ApiOperation({ summary: 'Create a new campaign draft' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignService.createCampaign(tenantId, user.sub, dto);
  }

  @Get('opt-outs')
  @RequirePermission('campaigns:read')
  @ApiOperation({ summary: 'List opt-outs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'channel', required: false })
  async getOptOuts(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('channel') channel?: string,
  ) {
    return this.suppressionService.getOptOuts(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      channel,
    });
  }

  @Get(':id')
  @RequirePermission('campaigns:read')
  @ApiOperation({ summary: 'Get campaign detail with stats' })
  async findById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const campaign = await this.campaignService.getCampaignById(tenantId, id);
    const stats = await this.campaignService.getCampaignStats(tenantId, id);
    return { ...campaign, stats };
  }

  @Patch(':id')
  @RequirePermission('campaigns:write')
  @ApiOperation({ summary: 'Update a draft campaign' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignService.updateCampaign(tenantId, id, dto);
  }

  @Post(':id/start')
  @RequirePermission('campaigns:execute')
  @ApiOperation({ summary: 'Start a campaign' })
  async start(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.campaignService.startCampaign(tenantId, id);
  }

  @Post(':id/pause')
  @RequirePermission('campaigns:execute')
  @ApiOperation({ summary: 'Pause a running campaign' })
  async pause(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.campaignService.pauseCampaign(tenantId, id);
  }

  @Post(':id/cancel')
  @RequirePermission('campaigns:execute')
  @ApiOperation({ summary: 'Cancel a campaign' })
  async cancel(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.campaignService.cancelCampaign(tenantId, id);
  }

  @Get(':id/messages')
  @RequirePermission('campaigns:read')
  @ApiOperation({ summary: 'Get campaign message results' })
  @ApiQuery({ name: 'status', required: false, enum: CampaignMessageStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMessages(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Query('status') status?: CampaignMessageStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.campaignService.getCampaignMessages(tenantId, id, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
