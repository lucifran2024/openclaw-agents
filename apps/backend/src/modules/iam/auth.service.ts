import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { RefreshTokenEntity } from './refresh-token.entity';
import { TenantService } from '../tenant/tenant.service';
import { generateId } from '@repo/shared';
import type { JwtClaims } from '@repo/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
  ) {}

  async login(email: string, password: string) {
    // Find user across all tenants (login doesn't know tenant yet)
    const user = await this.em.findOne(
      (await import('./user.entity')).UserEntity,
      { email },
    );

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await this.userService.validatePassword(user, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Update last login
    user.lastLogin = new Date();
    await this.em.flush();

    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    // Find valid refresh token
    const stored = await this.em.findOne(RefreshTokenEntity, {
      tokenHash: refreshToken, // simplified - in production hash and compare
      revokedAt: null,
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token (rotation)
    stored.revokedAt = new Date();

    const user = await this.userService.findById(stored.userId);
    const permissions = this.userService.getPermissions(user.role);
    const tokens = await this.generateTokens(user, permissions);

    await this.em.flush();
    return tokens;
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    tenantName: string;
    vertical?: string;
  }) {
    const slug = data.tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const tenant = await this.tenantService.create({
      name: data.tenantName,
      slug,
      vertical: data.vertical,
    });

    const user = await this.userService.create({
      tenantId: tenant.id,
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'owner',
    });

    return {
      ...(await this.createSession(user)),
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }

  async createSession(user: any) {
    const permissions = this.userService.getPermissions(user.role);
    const tokens = await this.generateTokens(user, permissions);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  private async generateTokens(user: any, permissions: string[]) {
    const payload: Omit<JwtClaims, 'iat' | 'exp'> = {
      sub: user.id,
      tid: user.tenantId,
      email: user.email,
      role: user.role,
      permissions,
      teams: user.teams || [],
      units: user.units || [],
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = generateId();
    const refreshEntity = this.em.create(RefreshTokenEntity, {
      userId: user.id,
      tokenHash: refreshToken, // In production: hash this
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    } as any);
    this.em.persist(refreshEntity);
    await this.em.flush();

    return { accessToken, refreshToken };
  }
}
