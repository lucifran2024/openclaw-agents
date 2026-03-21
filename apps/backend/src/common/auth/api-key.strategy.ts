import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeyService } from '../../modules/iam/api-key.service';

@Injectable()
export class ApiKeyStrategy {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async validate(request: Request) {
    const apiKey = request.header('x-api-key');
    if (!apiKey) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    return this.apiKeyService.validateApiKey(apiKey);
  }
}
