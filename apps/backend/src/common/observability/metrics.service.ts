import { Injectable } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [this.registry],
  });

  private readonly whatsappMessagesTotal = new Counter({
    name: 'whatsapp_messages_total',
    help: 'Total WhatsApp messages processed by direction',
    labelNames: ['direction'] as const,
    registers: [this.registry],
  });

  private readonly bullmqJobsTotal = new Counter({
    name: 'bullmq_jobs_total',
    help: 'Total BullMQ jobs processed by queue and status',
    labelNames: ['queue', 'status'] as const,
    registers: [this.registry],
  });

  private readonly activeWebsockets = new Gauge({
    name: 'active_websockets',
    help: 'Current number of active websocket connections',
    registers: [this.registry],
  });

  private readonly ragQueryDuration = new Histogram({
    name: 'rag_query_duration_seconds',
    help: 'RAG query duration in seconds',
    labelNames: ['source'] as const,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'omnichannel_',
    });
  }

  observeHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ) {
    this.httpRequestDuration
      .labels(method, route, String(statusCode))
      .observe(durationSeconds);
  }

  incrementWhatsAppMessages(direction: 'inbound' | 'outbound' = 'outbound') {
    this.whatsappMessagesTotal.labels(direction).inc();
  }

  incrementBullJob(queue: string, status: string) {
    this.bullmqJobsTotal.labels(queue, status).inc();
  }

  setActiveWebsockets(count: number) {
    this.activeWebsockets.set(count);
  }

  observeRagQueryDuration(durationSeconds: number, source = 'default') {
    this.ragQueryDuration.labels(source).observe(durationSeconds);
  }

  async getMetrics() {
    return this.registry.metrics();
  }

  getContentType() {
    return this.registry.contentType;
  }
}
