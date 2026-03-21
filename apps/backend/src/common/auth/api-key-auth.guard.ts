import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiKeyStrategy } from './api-key.strategy';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeyStrategy: ApiKeyStrategy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = await this.apiKeyStrategy.validate(request);

    request.user = {
      sub: auth.apiKeyId,
      userId: auth.apiKeyId,
      tid: auth.tenantId,
      role: 'api-key',
      email: `${auth.prefix}@api-key.local`,
      permissions: auth.permissions,
      teams: [],
      units: [],
    };

    return true;
  }
}
