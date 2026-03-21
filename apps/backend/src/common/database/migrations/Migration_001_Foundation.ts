import { Migration } from '@mikro-orm/migrations';

/**
 * Foundation migration — creates core tables for Tenant, IAM, and RLS policies.
 *
 * RLS hardening:
 * - ENABLE + FORCE ROW LEVEL SECURITY on all tenant tables
 * - current_setting('app.current_tenant_id', true) — returns NULL if not set (safe: no rows returned)
 * - SET LOCAL must be called inside explicit transaction (PgBouncer transaction mode)
 */
export class Migration_001_Foundation extends Migration {
  async up(): Promise<void> {
    // ========================================
    // Extensions
    // ========================================
    this.addSql(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    this.addSql(`CREATE EXTENSION IF NOT EXISTS "vector";`);

    // ========================================
    // GLOBAL tables (no tenant_id, no RLS)
    // ========================================

    // Tenants
    this.addSql(`
      CREATE TABLE tenants (
        id VARCHAR(26) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        plan_id VARCHAR(26),
        status VARCHAR(20) NOT NULL DEFAULT 'trial'
          CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
        vertical VARCHAR(20) NOT NULL DEFAULT 'general'
          CHECK (vertical IN ('clinic', 'salon', 'restaurant', 'ecommerce', 'services', 'general')),
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Plans (global catalog)
    this.addSql(`
      CREATE TABLE plans (
        id VARCHAR(26) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        tier VARCHAR(20) NOT NULL,
        limits JSONB NOT NULL DEFAULT '{}',
        price_monthly NUMERIC(10,2),
        price_yearly NUMERIC(10,2),
        features JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Refresh tokens (global — lookup by token_hash)
    this.addSql(`
      CREATE TABLE refresh_tokens (
        id VARCHAR(26) PRIMARY KEY,
        user_id VARCHAR(26) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
      CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
    `);

    // ========================================
    // TENANT_DIRECT tables (tenant_id + RLS)
    // ========================================

    // Users
    this.addSql(`
      CREATE TABLE users (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role_id VARCHAR(26),
        role VARCHAR(20) NOT NULL DEFAULT 'agent'
          CHECK (role IN ('owner', 'admin', 'supervisor', 'agent', 'viewer')),
        status VARCHAR(20) NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'inactive', 'invited')),
        teams JSONB NOT NULL DEFAULT '[]',
        units JSONB NOT NULL DEFAULT '[]',
        mfa_secret VARCHAR(255),
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, email)
      );
      CREATE INDEX idx_users_tenant ON users(tenant_id);
      CREATE INDEX idx_users_email ON users(email);
    `);

    // Roles
    this.addSql(`
      CREATE TABLE roles (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        permissions JSONB NOT NULL DEFAULT '[]',
        is_system BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_roles_tenant ON roles(tenant_id);
    `);

    // Teams
    this.addSql(`
      CREATE TABLE teams (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_teams_tenant ON teams(tenant_id);
    `);

    // Team members (TENANT_FK — no RLS, protected by FK)
    this.addSql(`
      CREATE TABLE team_members (
        team_id VARCHAR(26) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id VARCHAR(26) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (team_id, user_id)
      );
    `);

    // Units
    this.addSql(`
      CREATE TABLE units (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_units_tenant ON units(tenant_id);
    `);

    // Audit logs
    this.addSql(`
      CREATE TABLE audit_logs (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR(26) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(26) NOT NULL,
        old_value JSONB,
        new_value JSONB,
        ip VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_audit_tenant_date ON audit_logs(tenant_id, created_at DESC);
      CREATE INDEX idx_audit_entity ON audit_logs(tenant_id, entity_type, entity_id);
    `);

    // ========================================
    // RLS Policies — Hardened
    // ========================================
    // Pattern: ENABLE + FORCE + current_setting(_, true)
    // true parameter: returns NULL if setting not found (instead of error)
    // When NULL: USING clause evaluates to false → zero rows returned (safe)

    const tenantTables = ['users', 'roles', 'teams', 'units', 'audit_logs'];

    for (const table of tenantTables) {
      this.addSql(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      this.addSql(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`);
      this.addSql(`
        CREATE POLICY tenant_isolation_${table} ON ${table}
          USING (tenant_id = current_setting('app.current_tenant_id', true)::varchar)
          WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::varchar);
      `);
    }

    // ========================================
    // Superadmin bypass policy
    // ========================================
    // The application connects as a specific role.
    // For super admin operations (tenant listing, etc.),
    // use a separate connection or SET LOCAL to a special value.
    // The RLS policies above use FORCE, which means even table owners
    // are subject to them — this is intentional for defense in depth.
  }

  async down(): Promise<void> {
    const tenantTables = ['audit_logs', 'units', 'teams', 'roles', 'users'];
    for (const table of tenantTables) {
      this.addSql(`DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table};`);
      this.addSql(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
    }

    this.addSql(`DROP TABLE IF EXISTS team_members;`);
    this.addSql(`DROP TABLE IF EXISTS audit_logs;`);
    this.addSql(`DROP TABLE IF EXISTS units;`);
    this.addSql(`DROP TABLE IF EXISTS teams;`);
    this.addSql(`DROP TABLE IF EXISTS roles;`);
    this.addSql(`DROP TABLE IF EXISTS users;`);
    this.addSql(`DROP TABLE IF EXISTS refresh_tokens;`);
    this.addSql(`DROP TABLE IF EXISTS plans;`);
    this.addSql(`DROP TABLE IF EXISTS tenants;`);
  }
}
