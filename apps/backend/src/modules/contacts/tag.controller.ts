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
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { TagService } from './tag.service';

@ApiTags('Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @RequirePermission('tags:read')
  @ApiOperation({ summary: 'List all tags' })
  async findAll(@CurrentTenant() tenantId: string) {
    return this.tagService.findAll(tenantId);
  }

  @Post()
  @RequirePermission('tags:write')
  @ApiOperation({ summary: 'Create a new tag' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() body: { name: string; color?: string },
  ) {
    return this.tagService.create(tenantId, body.name, body.color);
  }

  @Patch(':id')
  @RequirePermission('tags:write')
  @ApiOperation({ summary: 'Update a tag' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; color?: string },
  ) {
    const tag = await this.tagService.update(tenantId, id, body);
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  @Delete(':id')
  @RequirePermission('tags:delete')
  @ApiOperation({ summary: 'Delete a tag' })
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.tagService.delete(tenantId, id);
    if (!deleted) throw new NotFoundException('Tag not found');
    return { success: true };
  }
}
