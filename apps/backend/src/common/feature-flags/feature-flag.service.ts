import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface FlagValue {
  enabled: boolean;
  percentage: number;
  allowlist: string[];
}

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
    });
  }

  async isEnabled(tenantId: string, flagName: string): Promise<boolean> {
    try {
      const key = `ff:${tenantId}:${flagName}`;
      const raw = await this.redis.get(key);

      if (!raw) {
        // Check global flag
        const globalRaw = await this.redis.get(`ff:global:${flagName}`);
        if (!globalRaw) return false;
        return this.evaluateFlag(JSON.parse(globalRaw), tenantId);
      }

      return this.evaluateFlag(JSON.parse(raw), tenantId);
    } catch (error) {
      this.logger.error(`Error checking flag ${flagName}: ${(error as Error).message}`);
      return false;
    }
  }

  private evaluateFlag(flag: FlagValue, tenantId: string): boolean {
    if (!flag.enabled) return false;
    if (flag.allowlist?.includes(tenantId)) return true;
    if (flag.percentage >= 100) return true;
    if (flag.percentage <= 0) return false;

    // Deterministic hash based on tenant ID
    const hash = this.hashString(`${tenantId}`) % 100;
    return hash < flag.percentage;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  async setFlag(tenantId: string, flagName: string, value: FlagValue): Promise<void> {
    const key = tenantId === 'global' ? `ff:global:${flagName}` : `ff:${tenantId}:${flagName}`;
    await this.redis.set(key, JSON.stringify(value));
  }
}
