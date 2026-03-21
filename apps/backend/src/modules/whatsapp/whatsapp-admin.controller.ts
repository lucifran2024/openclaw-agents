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
import { EntityManager } from '@mikro-orm/postgresql';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { TemplateService } from './template.service';
import {
  WhatsAppAccountEntity,
  AccountStatus,
  QualityRating,
} from './whatsapp-account.entity';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('whatsapp')
export class WhatsAppAdminController {
  constructor(
    private readonly em: EntityManager,
    private readonly templateService: TemplateService,
  ) {}

  @Get('accounts')
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'List WhatsApp accounts' })
  async listAccounts(@CurrentTenant() tenantId: string) {
    return this.em.find(
      WhatsAppAccountEntity,
      { tenantId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  @Post('accounts')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Create a WhatsApp account' })
  async createAccount(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      wabaId: string;
      phoneNumberId: string;
      phoneNumber: string;
      displayName: string;
      accessTokenEncrypted: string;
      webhookSecret?: string;
      status?: AccountStatus;
      messagingTier?: string;
      qualityRating?: QualityRating;
      capabilities?: Record<string, unknown>;
    },
  ) {
    const account = this.em.create(WhatsAppAccountEntity, {
      tenantId,
      ...body,
    } as any);

    await this.em.persistAndFlush(account);
    return account;
  }

  @Patch('accounts/:id')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Update a WhatsApp account' })
  async updateAccount(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      displayName?: string;
      phoneNumber?: string;
      webhookSecret?: string;
      accessTokenEncrypted?: string;
      status?: AccountStatus;
      messagingTier?: string;
      qualityRating?: QualityRating;
      capabilities?: Record<string, unknown>;
    },
  ) {
    const account = await this.em.findOne(WhatsAppAccountEntity, { tenantId, id });
    if (!account) throw new NotFoundException('WhatsApp account not found');

    this.em.assign(account, body);
    await this.em.flush();
    return account;
  }

  @Get('templates')
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'List synced WhatsApp templates' })
  @ApiQuery({ name: 'accountId', required: false })
  async listTemplates(
    @CurrentTenant() tenantId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.templateService.findAll(tenantId, accountId);
  }

  @Post('accounts/:id/sync-templates')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Sync WhatsApp templates from Meta' })
  async syncTemplates(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const synced = await this.templateService.syncTemplates(tenantId, id);
    return { synced };
  }
}
