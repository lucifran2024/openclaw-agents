import { Injectable } from '@nestjs/common';

const CircuitBreaker = require('opossum');

type BreakerHandler = (fn: () => Promise<unknown>) => Promise<unknown>;

@Injectable()
export class CircuitBreakerService {
  private readonly breakers = new Map<string, any>();

  private readonly options = {
    volumeThreshold: 5,
    rollingCountTimeout: 30_000,
    rollingCountBuckets: 6,
    resetTimeout: 60_000,
    errorThresholdPercentage: 50,
  };

  async execute<T>(
    name: 'whatsapp-cloud-api' | 'openai-api' | 'external-webhook' | string,
    action: () => Promise<T>,
  ): Promise<T> {
    const breaker = this.getBreaker(name);
    return breaker.fire(action) as Promise<T>;
  }

  private getBreaker(name: string) {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker((fn: BreakerHandler extends never ? never : () => Promise<unknown>) => fn(), this.options);
      this.breakers.set(name, breaker);
    }

    return this.breakers.get(name);
  }
}
