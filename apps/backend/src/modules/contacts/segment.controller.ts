import {
  Controller,
  Get,
  Post,
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
import { SegmentService } from './segment.service';

@ApiTags('Segments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('segments')
export class SegmentController {
  constructor(private readonly segmentService: SegmentService) {}

  @Get()
  @RequirePermission('segments:read')
  @ApiOperation({ summary: 'List all segments' })
  async findAll(@CurrentTenant() tenantId: string) {
    return this.segmentService.findAll(tenantId);
  }

  @Post()
  @RequirePermission('segments:write')
  @ApiOperation({ summary: 'Create a new segment' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() body: { name: string; rules: Record<string, unknown>[]; isDynamic?: boolean },
  ) {
    return this.segmentService.create(tenantId, body.name, body.rules, body.isDynamic);
  }

  @Post(':id/compute')
  @RequirePermission('segments:write')
  @ApiOperation({ summary: 'Compute segment contact count' })
  async compute(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const segment = await this.segmentService.computeSegment(tenantId, id);
    if (!segment) throw new NotFoundException('Segment not found');
    return segment;
  }
}
