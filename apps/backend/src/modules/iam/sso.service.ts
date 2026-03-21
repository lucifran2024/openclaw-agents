import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/postgresql';
import type { Request } from 'express';
import type { Profile } from 'passport-saml';
import { generateId } from '@repo/shared';
import { TenantEntity } from '../tenant/tenant.entity';
import { TenantService } from '../tenant/tenant.service';
import { AuthService } from './auth.service';
import { SsoConfigEntity } from './sso-config.entity';
import { UserService } from './user.service';

@Injectable()
export class SsoService {
  constructor(
    private readonly em: EntityManager,
    private readonly tenantService: TenantService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async configureSso(
    tenantId: string,
    data: {
      entityId?: string;
      ssoUrl?: string;
      certificate?: string;
      enabled?: boolean;
    },
  ) {
    const tenant = await this.tenantService.findById(tenantId);
    let config = await this.em.findOne(SsoConfigEntity, { tenantId });
    const enabled = data.enabled ?? true;

    if (enabled && (!data.entityId || !data.ssoUrl || !data.certificate)) {
      throw new BadRequestException(
        'entityId, ssoUrl and certificate are required when enabling SSO',
      );
    }

    if (!config) {
      config = this.em.create(SsoConfigEntity, {
        tenantId,
        entityId: data.entityId || '',
        ssoUrl: data.ssoUrl || '',
        certificate: data.certificate || '',
      } as any);
      this.em.persist(config);
    } else {
      if (data.entityId !== undefined) {
        config.entityId = data.entityId;
      }
      if (data.ssoUrl !== undefined) {
        config.ssoUrl = data.ssoUrl;
      }
      if (data.certificate !== undefined) {
        config.certificate = data.certificate;
      }
    }

    tenant.ssoEnabled = enabled;
    await this.em.flush();

    return this.serializeConfig(tenant, config);
  }

  async getSsoConfig(tenantId: string) {
    const tenant = await this.tenantService.findById(tenantId);
    const config = await this.em.findOne(SsoConfigEntity, { tenantId });

    return this.serializeConfig(tenant, config);
  }

  async getSsoContextByIdentifier(identifier: string) {
    const tenant = await this.findTenantByIdentifier(identifier);
    const config = await this.em.findOne(SsoConfigEntity, { tenantId: tenant.id });

    if (!tenant.ssoEnabled || !config) {
      throw new UnauthorizedException('SSO is not configured for this tenant');
    }

    return { tenant, config };
  }

  async handleSamlCallback(req: Request, profile: Profile | null | undefined) {
    const identifier = this.extractTenantIdentifier(req);
    if (!identifier) {
      throw new UnauthorizedException('Missing tenant identifier for SAML callback');
    }

    const { tenant } = await this.getSsoContextByIdentifier(identifier);
    const email = this.extractEmail(profile);

    if (!email) {
      throw new UnauthorizedException('SAML response did not include an email');
    }

    const name = this.extractName(profile, email);
    let user = await this.userService.findByEmail(tenant.id, email);

    if (!user) {
      user = await this.userService.create({
        tenantId: tenant.id,
        email,
        password: generateId(),
        name,
        role: 'agent',
        status: 'active',
      });
    } else {
      user.name = name;
      user.status = 'active';
      user.lastLogin = new Date();
      await this.em.flush();
    }

    return this.authService.createSession(user);
  }

  extractTenantIdentifier(req: Request) {
    const queryTenant = req.query?.tenant;
    if (typeof queryTenant === 'string' && queryTenant) {
      return queryTenant;
    }

    const relayState = (req.body as Record<string, unknown> | undefined)?.RelayState;
    if (typeof relayState === 'string' && relayState) {
      return relayState;
    }

    const queryRelayState = req.query?.RelayState;
    if (typeof queryRelayState === 'string' && queryRelayState) {
      return queryRelayState;
    }

    return undefined;
  }

  private async findTenantByIdentifier(identifier: string) {
    const byId = await this.em.findOne(TenantEntity, { id: identifier });
    if (byId) {
      return byId;
    }

    const bySlug = await this.tenantService.findBySlug(identifier);
    if (bySlug) {
      return bySlug;
    }

    throw new UnauthorizedException('Tenant not found for SSO request');
  }

  private extractEmail(profile: Profile | null | undefined) {
    if (!profile) {
      return undefined;
    }

    const candidates = [
      profile.email,
      profile.mail,
      profile['urn:oid:0.9.2342.19200300.100.1.3'],
    ];

    return candidates.find((candidate): candidate is string => typeof candidate === 'string');
  }

  private extractName(profile: Profile | null | undefined, email: string) {
    if (!profile) {
      return email.split('@')[0];
    }

    const displayName =
      (typeof profile.displayName === 'string' && profile.displayName) ||
      (typeof profile.cn === 'string' && profile.cn) ||
      (typeof profile.nameID === 'string' && profile.nameID);

    return displayName || email.split('@')[0];
  }

  private serializeConfig(tenant: TenantEntity, config: SsoConfigEntity | null) {
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001';
    const tenantIdentifier = tenant.slug || tenant.id;

    return {
      enabled: tenant.ssoEnabled,
      entityId: config?.entityId || '',
      ssoUrl: config?.ssoUrl || '',
      certificate: config?.certificate || '',
      loginUrl: `${backendUrl}/api/v1/sso/login?tenant=${tenantIdentifier}`,
      callbackUrl: `${backendUrl}/api/v1/sso/callback`,
      updatedAt: config?.updatedAt || null,
    };
  }
}
