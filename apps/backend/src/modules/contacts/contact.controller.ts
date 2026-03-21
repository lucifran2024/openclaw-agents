import {
  Controller,
  Get,
  Post,
  Patch,
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
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { ContactService, ContactFilters } from './contact.service';
import { CreateContactDto, UpdateContactDto } from './dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @RequirePermission('contacts:read')
  @ApiOperation({ summary: 'List contacts with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tags', required: false, isArray: true })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string[],
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: ContactFilters = {
      search,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      status: status as ContactFilters['status'],
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };
    return this.contactService.findAll(tenantId, filters);
  }

  @Post()
  @RequirePermission('contacts:write')
  @ApiOperation({ summary: 'Create a new contact' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateContactDto,
  ) {
    const { tags, ...contactData } = dto;
    const contact = await this.contactService.create(tenantId, contactData);

    if (tags && tags.length > 0) {
      await this.contactService.addTags(tenantId, contact.id, tags);
    }

    return contact;
  }

  @Get(':id')
  @RequirePermission('contacts:read')
  @ApiOperation({ summary: 'Get contact by ID' })
  async findById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const contact = await this.contactService.findById(tenantId, id);
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  @Patch(':id')
  @RequirePermission('contacts:write')
  @ApiOperation({ summary: 'Update a contact' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    const contact = await this.contactService.update(tenantId, id, dto);
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  @Delete(':id')
  @RequirePermission('contacts:delete')
  @ApiOperation({ summary: 'Soft delete a contact' })
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.contactService.softDelete(tenantId, id);
    if (!deleted) throw new NotFoundException('Contact not found');
    return { success: true };
  }

  @Post(':id/tags')
  @RequirePermission('contacts:write')
  @ApiOperation({ summary: 'Add tags to a contact' })
  async addTags(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('tagIds') tagIds: string[],
  ) {
    await this.contactService.addTags(tenantId, id, tagIds);
    return { success: true };
  }

  @Delete(':id/tags/:tagId')
  @RequirePermission('contacts:write')
  @ApiOperation({ summary: 'Remove a tag from a contact' })
  async removeTag(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    await this.contactService.removeTags(tenantId, id, [tagId]);
    return { success: true };
  }
}
