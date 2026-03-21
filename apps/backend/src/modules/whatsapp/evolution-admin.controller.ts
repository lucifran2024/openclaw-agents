import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { EvolutionApiAdapter } from './evolution-api.adapter';
import {
  WhatsAppAccountEntity,
  WhatsAppProvider,
  AccountStatus,
} from './whatsapp-account.entity';

@ApiTags('WhatsApp Evolution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('whatsapp/evolution')
export class EvolutionAdminController {
  private readonly logger = new Logger(EvolutionAdminController.name);

  constructor(
    private readonly em: EntityManager,
    private readonly evolutionAdapter: EvolutionApiAdapter,
    private readonly configService: ConfigService,
  ) {}

  @Post('instances')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Create a new Evolution API instance and connect via QR' })
  async createInstance(
    @CurrentTenant() tenantId: string,
    @Body() body: { displayName: string; phoneNumber?: string },
  ) {
    if (!body.displayName) {
      throw new BadRequestException('displayName is required');
    }

    // Generate a unique instance name from tenant + display name
    const instanceName = `${tenantId}_${body.displayName.replace(/\s+/g, '_').toLowerCase()}`.substring(0, 100);

    // Check if instance already exists for this tenant
    const existing = await this.em.findOne(WhatsAppAccountEntity, {
      tenantId,
      evolutionInstanceName: instanceName,
    } as any);

    if (existing) {
      throw new BadRequestException('An instance with this name already exists');
    }

    // Build the webhook URL
    const backendUrl = this.configService.get('BACKEND_URL') || this.configService.get('backend.url') || '';
    const webhookUrl = `${backendUrl}/api/v1/whatsapp/evolution-webhook`;

    // Create instance on Evolution API
    let result: { instanceName: string; status: string };
    try {
      result = await this.evolutionAdapter.createInstance(instanceName, webhookUrl);
    } catch (error) {
      this.logger.error(`Failed to create Evolution instance on API: ${(error as Error).message}`);
      throw new BadRequestException(`Failed to create instance: ${(error as Error).message}`);
    }

    // Save account to database
    try {
      const account = this.em.create(WhatsAppAccountEntity, {
        tenantId,
        provider: WhatsAppProvider.EVOLUTION,
        evolutionInstanceName: instanceName,
        wabaId: `evo_${instanceName}`,
        phoneNumberId: instanceName,
        phoneNumber: body.phoneNumber || '',
        displayName: body.displayName,
        accessTokenEncrypted: 'evolution', // Not used for Evolution, but field is required
        status: AccountStatus.PENDING,
      } as any);

      await this.em.persistAndFlush(account);

      this.logger.log(`Created Evolution instance: ${instanceName} for tenant ${tenantId}`);

      return {
        id: account.id,
        instanceName,
        status: result.status,
        message: 'Instance created. Use GET /whatsapp/evolution/instances/:id/qr to get the QR code.',
      };
    } catch (error) {
      this.logger.error(`Failed to save Evolution account to DB: ${(error as Error).message}`, (error as Error).stack);
      // Try to cleanup the instance we created on Evolution API
      try { await this.evolutionAdapter.deleteInstance(instanceName); } catch { /* ignore cleanup errors */ }
      throw new BadRequestException(`Failed to save account: ${(error as Error).message}`);
    }
  }

  @Get('instances/:id/qr')
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'Get QR code for an Evolution instance' })
  async getQrCode(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const account = await this.em.findOne(WhatsAppAccountEntity, {
      tenantId,
      id,
      provider: WhatsAppProvider.EVOLUTION,
    } as any);

    if (!account) throw new NotFoundException('Evolution instance not found');

    const qr = await this.evolutionAdapter.getQrCode(account.evolutionInstanceName!);

    return {
      instanceName: account.evolutionInstanceName,
      qrCode: qr.qrCode,
      pairingCode: qr.pairingCode,
    };
  }

  @Get('instances/:id/status')
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'Get connection status of an Evolution instance' })
  async getStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const account = await this.em.findOne(WhatsAppAccountEntity, {
      tenantId,
      id,
      provider: WhatsAppProvider.EVOLUTION,
    } as any);

    if (!account) throw new NotFoundException('Evolution instance not found');

    const status = await this.evolutionAdapter.getConnectionStatus(account.evolutionInstanceName!);

    // Auto-update account status if connection changed
    if (status.connected && account.status !== AccountStatus.ACTIVE) {
      account.status = AccountStatus.ACTIVE;
      if (status.phoneNumber) account.phoneNumber = status.phoneNumber;
      await this.em.flush();
    } else if (!status.connected && account.status === AccountStatus.ACTIVE) {
      account.status = AccountStatus.INACTIVE;
      await this.em.flush();
    }

    return {
      id: account.id,
      instanceName: account.evolutionInstanceName,
      displayName: account.displayName,
      phoneNumber: account.phoneNumber,
      accountStatus: account.status,
      connection: status,
    };
  }

  @Get('instances')
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'List all Evolution API instances for tenant' })
  async listInstances(@CurrentTenant() tenantId: string) {
    const accounts = await this.em.find(
      WhatsAppAccountEntity,
      { tenantId, provider: WhatsAppProvider.EVOLUTION } as any,
      { orderBy: { createdAt: 'DESC' } },
    );

    return accounts;
  }

  @Delete('instances/:id')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Delete an Evolution instance and disconnect' })
  async deleteInstance(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const account = await this.em.findOne(WhatsAppAccountEntity, {
      tenantId,
      id,
      provider: WhatsAppProvider.EVOLUTION,
    } as any);

    if (!account) throw new NotFoundException('Evolution instance not found');

    // Try to logout and delete from Evolution API
    try {
      await this.evolutionAdapter.logoutInstance(account.evolutionInstanceName!);
      await this.evolutionAdapter.deleteInstance(account.evolutionInstanceName!);
    } catch (error) {
      this.logger.warn(`Failed to cleanup Evolution instance: ${(error as Error).message}`);
    }

    await this.em.removeAndFlush(account);

    return { deleted: true };
  }

  @Post('instances/:id/reconnect')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Reconnect an Evolution instance (generate new QR)' })
  async reconnect(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const account = await this.em.findOne(WhatsAppAccountEntity, {
      tenantId,
      id,
      provider: WhatsAppProvider.EVOLUTION,
    } as any);

    if (!account) throw new NotFoundException('Evolution instance not found');

    // Logout first, then get new QR
    try {
      await this.evolutionAdapter.logoutInstance(account.evolutionInstanceName!);
    } catch {
      // Ignore logout errors
    }

    account.status = AccountStatus.PENDING;
    await this.em.flush();

    const qr = await this.evolutionAdapter.getQrCode(account.evolutionInstanceName!);

    return {
      instanceName: account.evolutionInstanceName,
      qrCode: qr.qrCode,
      pairingCode: qr.pairingCode,
      status: 'pending',
    };
  }
}
