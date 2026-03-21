import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { createHash } from 'crypto';
import { generateId } from '@repo/shared';
import { ApiKeyEntity } from './api-key.entity';

@Injectable()
export class ApiKeyService {
  constructor(private readonly em: EntityManager) {}

  async createApiKey(
    tenantId: string,
    name: string,
    permissions: string[],
    createdBy?: string,
    expiresAt?: Date,
  ) {
    const secret = `omni_${generateId()}${generateId().toLowerCase()}`;
    const entity = this.em.create(ApiKeyEntity, {
      tenantId,
      name,
      keyHash: this.hashKey(secret),
      prefix: secret.slice(0, 8),
      permissions,
      expiresAt,
      createdBy,
    } as any);

    await this.em.persistAndFlush(entity);

    return {
      secret,
      apiKey: this.serializeApiKey(entity),
    };
  }

  async validateApiKey(key: string) {
    const apiKey = await this.em.findOne(ApiKeyEntity, {
      keyHash: this.hashKey(key),
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key expired');
    }

    apiKey.lastUsedAt = new Date();
    await this.em.flush();

    return {
      apiKeyId: apiKey.id,
      tenantId: apiKey.tenantId,
      permissions: apiKey.permissions,
      prefix: apiKey.prefix,
    };
  }

  async revokeApiKey(tenantId: string, keyId: string) {
    const apiKey = await this.em.findOne(ApiKeyEntity, { tenantId, id: keyId });
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.em.removeAndFlush(apiKey);
    return { revoked: true };
  }

  async listApiKeys(tenantId: string) {
    const keys = await this.em.find(
      ApiKeyEntity,
      { tenantId },
      { orderBy: { createdAt: 'DESC' } },
    );

    return keys.map((key) => this.serializeApiKey(key));
  }

  private hashKey(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private serializeApiKey(entity: ApiKeyEntity) {
    return {
      id: entity.id,
      name: entity.name,
      prefix: entity.prefix,
      permissions: entity.permissions,
      lastUsedAt: entity.lastUsedAt,
      expiresAt: entity.expiresAt,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
    };
  }
}
