import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant, CurrentUser } from '../../common/auth/tenant.decorator';
import { QuickReplyService } from './quick-reply.service';

@ApiTags('Quick Replies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('quick-replies')
export class QuickReplyController {
  constructor(private readonly quickReplyService: QuickReplyService) {}

  @Get()
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'List quick replies' })
  async findAll(@CurrentTenant() tenantId: string) {
    return this.quickReplyService.findAll(tenantId);
  }

  @Post()
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Create quick reply' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { shortcut: string; content: string },
  ) {
    return this.quickReplyService.create(tenantId, user.sub, body);
  }

  @Patch(':id')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Update quick reply' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { shortcut?: string; content?: string },
  ) {
    const reply = await this.quickReplyService.update(tenantId, id, body);
    if (!reply) throw new NotFoundException('Quick reply not found');
    return reply;
  }

  @Delete(':id')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Delete quick reply' })
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.quickReplyService.delete(tenantId, id);
    if (!deleted) throw new NotFoundException('Quick reply not found');
    return { success: true };
  }
}
