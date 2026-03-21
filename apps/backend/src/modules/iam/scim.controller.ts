import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../../common/auth/api-key-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { EntityManager } from '@mikro-orm/postgresql';
import { generateId } from '@repo/shared';
import { UserService } from './user.service';

@ApiTags('SCIM')
@UseGuards(ApiKeyAuthGuard, RbacGuard)
@Controller('scim/v2')
export class ScimController {
  constructor(
    private readonly userService: UserService,
    private readonly em: EntityManager,
  ) {}

  @Get('Users')
  @RequirePermission('team:read')
  @ApiOperation({ summary: 'List tenant users in SCIM 2.0 format' })
  async listUsers(@CurrentTenant() tenantId: string) {
    const users = await this.userService.findByTenant(tenantId);

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: users.length,
      Resources: users.map((user) => ({
        id: user.id,
        userName: user.email,
        displayName: user.name,
        active: user.status === 'active',
        emails: [{ value: user.email, primary: true }],
        roles: [{ value: user.role }],
        groups: user.teams.map((teamId) => ({ value: teamId })),
      })),
    };
  }

  @Post('Users')
  @RequirePermission('team:write')
  @ApiOperation({ summary: 'Provision a user through SCIM 2.0' })
  async createUser(
    @CurrentTenant() tenantId: string,
    @Body() body: Record<string, any>,
  ) {
    const email = String(body.userName || body.emails?.[0]?.value || '').trim();
    const name =
      String(
        body.displayName ||
          body.name?.formatted ||
          [body.name?.givenName, body.name?.familyName].filter(Boolean).join(' ') ||
          email.split('@')[0],
      ).trim();

    const existing = email
      ? await this.userService.findByEmail(tenantId, email)
      : null;

    if (existing) {
      const updated = await this.userService.update(tenantId, existing.id, {
        name,
        role: body.roles?.[0]?.value || existing.role,
        status: body.active === false ? 'inactive' : 'active',
        teams: (body.groups || []).map((group: { value: string }) => group.value),
      });

      if (!updated) {
        throw new NotFoundException('User not found');
      }

      return {
        id: updated.id,
        userName: updated.email,
        displayName: updated.name,
        active: updated.status === 'active',
      };
    }

    const user = await this.userService.create({
      tenantId,
      email,
      password: generateId(),
      name,
      role: body.roles?.[0]?.value || 'agent',
      status: body.active === false ? 'inactive' : 'active',
      teams: (body.groups || []).map((group: { value: string }) => group.value),
    });

    return {
      id: user.id,
      userName: user.email,
      displayName: user.name,
      active: user.status === 'active',
    };
  }

  @Patch('Users/:id')
  @RequirePermission('team:write')
  @ApiOperation({ summary: 'Update a provisioned user through SCIM 2.0' })
  async patchUser(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    const payload = this.extractScimPatchPayload(body);
    const user = await this.userService.update(tenantId, id, payload);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      userName: user.email,
      displayName: user.name,
      active: user.status === 'active',
    };
  }

  @Delete('Users/:id')
  @RequirePermission('team:write')
  @ApiOperation({ summary: 'Deprovision a user through SCIM 2.0' })
  async deleteUser(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const user = await this.userService.update(tenantId, id, {
      status: 'inactive',
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { deleted: true };
  }

  @Get('Groups')
  @RequirePermission('team:read')
  @ApiOperation({ summary: 'List tenant teams in SCIM 2.0 group format' })
  async listGroups(@CurrentTenant() tenantId: string) {
    const groups = await this.em.getConnection().execute<any[]>(
      `SELECT id, name
       FROM teams
       WHERE tenant_id = ?
       ORDER BY name ASC`,
      [tenantId],
    );

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: groups.length,
      Resources: groups.map((group) => ({
        id: String(group.id),
        displayName: String(group.name),
      })),
    };
  }

  private extractScimPatchPayload(body: Record<string, any>) {
    const patch: Record<string, any> = {};
    const operations = Array.isArray(body.Operations) ? body.Operations : [];

    for (const operation of operations) {
      const path = String(operation.path || '').toLowerCase();
      const value = operation.value;

      if (path === 'active') {
        patch.status = value === false ? 'inactive' : 'active';
      }

      if (path === 'displayname' || path === 'name.formatted') {
        patch.name = String(value);
      }

      if (path === 'roles') {
        patch.role = value?.[0]?.value;
      }

      if (path === 'groups') {
        patch.teams = (value || []).map((group: { value: string }) => group.value);
      }

      if (!path && value && typeof value === 'object') {
        if (value.active !== undefined) {
          patch.status = value.active === false ? 'inactive' : 'active';
        }
        if (value.displayName) {
          patch.name = value.displayName;
        }
        if (value.roles?.[0]?.value) {
          patch.role = value.roles[0].value;
        }
        if (Array.isArray(value.groups)) {
          patch.teams = value.groups.map((group: { value: string }) => group.value);
        }
      }
    }

    return patch;
  }
}
