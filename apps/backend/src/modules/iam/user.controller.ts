import {
  Controller,
  Get,
  Post,
  Patch,
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
import { UserService } from './user.service';
import { generateId } from '@repo/shared';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermission('team:read')
  @ApiOperation({ summary: 'List users in tenant' })
  async list(@CurrentTenant() tenantId: string) {
    return this.userService.findByTenant(tenantId);
  }

  @Post('invite')
  @RequirePermission('team:write')
  @ApiOperation({ summary: 'Invite a new user to tenant' })
  async invite(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      email: string;
      name: string;
      role?: string;
      teams?: string[];
      units?: string[];
    },
  ) {
    return this.userService.create({
      tenantId,
      email: body.email,
      name: body.name,
      role: body.role,
      teams: body.teams,
      units: body.units,
      status: 'invited',
      password: generateId(),
    });
  }

  @Patch(':id')
  @RequirePermission('team:write')
  @ApiOperation({ summary: 'Update a user role, status or team assignments' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      role?: string;
      status?: string;
      teams?: string[];
      units?: string[];
    },
  ) {
    const user = await this.userService.update(tenantId, id, body);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
