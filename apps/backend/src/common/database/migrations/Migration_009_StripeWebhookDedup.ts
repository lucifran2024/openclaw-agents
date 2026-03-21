import { Migration } from '@mikro-orm/migrations';

export class Migration_009_StripeWebhookDedup extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE stripe_webhook_events (
        id VARCHAR(26) PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(120) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'processing',
        attempts INTEGER NOT NULL DEFAULT 1,
        processed_at TIMESTAMPTZ NULL,
        last_error TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    this.addSql(`
      CREATE UNIQUE INDEX stripe_webhook_events_event_id_unique
      ON stripe_webhook_events(event_id);
    `);

    this.addSql(`
      CREATE INDEX stripe_webhook_events_status_idx
      ON stripe_webhook_events(status);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS stripe_webhook_events;`);
  }
}
