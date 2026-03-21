import { Migration } from '@mikro-orm/migrations';

export class Migration_010_EvolutionApiProvider extends Migration {
  async up(): Promise<void> {
    // Add provider column to whatsapp_accounts
    this.addSql(`
      ALTER TABLE whatsapp_accounts
      ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'meta';
    `);

    // Add evolution_instance_name column for Evolution API instances
    this.addSql(`
      ALTER TABLE whatsapp_accounts
      ADD COLUMN evolution_instance_name VARCHAR(255) NULL;
    `);

    // Index for provider-based lookups
    this.addSql(`
      CREATE INDEX whatsapp_accounts_provider_idx
      ON whatsapp_accounts(tenant_id, provider);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS whatsapp_accounts_provider_idx;`);
    this.addSql(`ALTER TABLE whatsapp_accounts DROP COLUMN IF EXISTS evolution_instance_name;`);
    this.addSql(`ALTER TABLE whatsapp_accounts DROP COLUMN IF EXISTS provider;`);
  }
}
