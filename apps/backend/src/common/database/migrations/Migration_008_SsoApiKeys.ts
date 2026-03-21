import { Migration } from '@mikro-orm/migrations';

export class Migration_008_SsoApiKeys extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE tenants
        ADD COLUMN IF NOT EXISTS sso_enabled BOOLEAN NOT NULL DEFAULT false;
    `);

    this.addSql(`
      ALTER TABLE tenants
        DROP CONSTRAINT IF EXISTS tenants_status_check;
    `);

    this.addSql(`
      ALTER TABLE tenants
        ADD CONSTRAINT tenants_status_check
        CHECK (status IN ('active', 'trial', 'past_due', 'suspended', 'cancelled'));
    `);

    this.addSql(`
      CREATE TABLE sso_configs (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
        entity_id VARCHAR(255) NOT NULL,
        sso_url VARCHAR(500) NOT NULL,
        certificate TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_sso_configs_tenant ON sso_configs(tenant_id);
    `);

    this.addSql(`
      CREATE TABLE api_keys (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        key_hash VARCHAR(64) NOT NULL,
        prefix VARCHAR(16) NOT NULL,
        permissions JSONB NOT NULL DEFAULT '[]',
        last_used_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_by VARCHAR(26),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
      CREATE INDEX idx_api_keys_tenant_prefix ON api_keys(tenant_id, prefix);
    `);

    for (const table of ['sso_configs', 'api_keys']) {
      this.addSql(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      this.addSql(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`);
      this.addSql(`
        CREATE POLICY tenant_isolation_${table} ON ${table}
          USING (tenant_id = current_setting('app.current_tenant_id', true)::varchar)
          WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::varchar);
      `);
    }
  }

  async down(): Promise<void> {
    for (const table of ['api_keys', 'sso_configs']) {
      this.addSql(`DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table};`);
      this.addSql(`DROP TABLE IF EXISTS ${table};`);
    }

    this.addSql(`
      ALTER TABLE tenants
        DROP CONSTRAINT IF EXISTS tenants_status_check;
    `);

    this.addSql(`
      ALTER TABLE tenants
        ADD CONSTRAINT tenants_status_check
        CHECK (status IN ('active', 'trial', 'suspended', 'cancelled'));
    `);

    this.addSql(`
      ALTER TABLE tenants
        DROP COLUMN IF EXISTS sso_enabled;
    `);
  }
}
