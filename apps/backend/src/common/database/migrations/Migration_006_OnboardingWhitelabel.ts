import { Migration } from '@mikro-orm/migrations';

/**
 * Onboarding + white-label migration.
 *
 * Creates onboarding_configs with tenant-scoped setup progress and theme data.
 * Hardened with ENABLE + FORCE RLS using app.current_tenant_id.
 */
export class Migration_006_OnboardingWhitelabel extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE onboarding_configs (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        vertical VARCHAR(20) NOT NULL DEFAULT 'general'
          CHECK (vertical IN ('clinic', 'salon', 'restaurant', 'ecommerce', 'services', 'general')),
        completed_steps JSONB NOT NULL DEFAULT '[]',
        is_complete BOOLEAN NOT NULL DEFAULT false,
        theme JSONB NOT NULL DEFAULT '{}',
        sample_data_loaded BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id)
      );
      CREATE INDEX idx_onboarding_configs_tenant ON onboarding_configs(tenant_id);
    `);

    this.addSql(`ALTER TABLE onboarding_configs ENABLE ROW LEVEL SECURITY;`);
    this.addSql(`ALTER TABLE onboarding_configs FORCE ROW LEVEL SECURITY;`);
    this.addSql(`
      CREATE POLICY tenant_isolation_onboarding_configs ON onboarding_configs
        USING (tenant_id = current_setting('app.current_tenant_id', true)::varchar)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::varchar);
    `);
  }

  async down(): Promise<void> {
    this.addSql(
      `DROP POLICY IF EXISTS tenant_isolation_onboarding_configs ON onboarding_configs;`,
    );
    this.addSql(`ALTER TABLE onboarding_configs DISABLE ROW LEVEL SECURITY;`);
    this.addSql(`DROP TABLE IF EXISTS onboarding_configs;`);
  }
}
