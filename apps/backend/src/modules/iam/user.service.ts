import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.entity';
import { ROLE_PERMISSIONS } from '@repo/shared';

@Injectable()
export class UserService {
  constructor(private readonly em: EntityManager) {}

  async create(data: {
    tenantId: string;
    email: string;
    password: string;
    name: string;
    role?: string;
    status?: string;
    teams?: string[];
    units?: string[];
  }): Promise<UserEntity> {
    const existing = await this.em.findOne(UserEntity, {
      tenantId: data.tenantId,
      email: data.email,
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = this.em.create(UserEntity, {
      tenantId: data.tenantId,
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role || 'agent',
      status: data.status || 'active',
      teams: data.teams || [],
      units: data.units || [],
    } as any);

    await this.em.persistAndFlush(user);
    return user;
  }

  async findByEmail(tenantId: string, email: string): Promise<UserEntity | null> {
    return this.em.findOne(UserEntity, { tenantId, email });
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.em.findOne(UserEntity, { id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByTenant(tenantId: string): Promise<UserEntity[]> {
    return this.em.find(UserEntity, { tenantId }, { orderBy: { createdAt: 'DESC' } });
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      role: string;
      status: string;
      teams: string[];
      units: string[];
    }>,
  ): Promise<UserEntity | null> {
    const user = await this.em.findOne(UserEntity, { tenantId, id });
    if (!user) return null;

    this.em.assign(user, data);
    await this.em.flush();
    return user;
  }

  async validatePassword(user: UserEntity, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  getPermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role] || [];
  }
}
