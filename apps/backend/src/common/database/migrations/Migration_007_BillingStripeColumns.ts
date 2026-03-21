import { Migration } from '@mikro-orm/migrations';

export class Migration_007_BillingStripeColumns extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE subscriptions
        ADD COLUMN stripe_customer_id VARCHAR(255),
        ADD COLUMN stripe_price_id VARCHAR(255),
        ADD COLUMN cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;
    `);

    this.addSql(`
      ALTER TABLE tenants
        ADD COLUMN stripe_customer_id VARCHAR(255);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE subscriptions
        DROP COLUMN IF EXISTS cancel_at_period_end,
        DROP COLUMN IF EXISTS stripe_price_id,
        DROP COLUMN IF EXISTS stripe_customer_id;
    `);

    this.addSql(`
      ALTER TABLE tenants
        DROP COLUMN IF EXISTS stripe_customer_id;
    `);
  }
}
