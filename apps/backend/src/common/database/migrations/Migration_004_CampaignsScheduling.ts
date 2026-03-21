import { Migration } from '@mikro-orm/migrations';

/**
 * Campaigns & Scheduling migration — creates tables for campaign management,
 * message tracking, opt-outs, and appointment scheduling with resources/waitlist.
 *
 * Depends on Migration_001_Foundation (tenants, users) and Migration_002_Modules (contacts, conversations).
 *
 * RLS hardening:
 * - ENABLE + FORCE ROW LEVEL SECURITY on all 10 TENANT_DIRECT tables
 * - current_setting('app.current_tenant_id', true) — returns NULL if not set (safe: no rows returned)
 */
export class Migration_004_CampaignsScheduling extends Migration {
  async up(): Promise<void> {
    // ========================================
    // CAMPAIGNS MODULE
    // ========================================

    // Campaigns
    this.addSql(`
      CREATE TABLE campaigns (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'draft'
          CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
        type VARCHAR(20) DEFAULT 'broadcast'
          CHECK (type IN ('broadcast', 'triggered')),
        template_id VARCHAR(26),
        segment_id VARCHAR(26),
        scheduled_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        settings JSONB DEFAULT '{}',
        stats JSONB DEFAULT '{"sent":0,"delivered":0,"read":0,"failed":0,"optedOut":0}',
        created_by VARCHAR(26),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_campaigns_tenant ON campaigns(tenant_id);
      CREATE INDEX idx_campaigns_tenant_status ON campaigns(tenant_id, status);
      CREATE INDEX idx_campaigns_tenant_scheduled ON campaigns(tenant_id, scheduled_at);
    `);

    // Campaign messages
    this.addSql(`
      CREATE TABLE campaign_messages (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        campaign_id VARCHAR(26) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        contact_id VARCHAR(26) NOT NULL,
        message_id VARCHAR(26),
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'opted_out')),
        error_code VARCHAR(50),
        sent_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        read_at TIMESTAMPTZ,
        idempotency_key VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_campaign_messages_campaign_status ON campaign_messages(campaign_id, status);
      CREATE INDEX idx_campaign_messages_tenant_contact ON campaign_messages(tenant_id, contact_id);
      CREATE UNIQUE INDEX idx_campaign_messages_tenant_idempotency
        ON campaign_messages(tenant_id, idempotency_key)
        WHERE idempotency_key IS NOT NULL;
    `);

    // Campaign suppressions
    this.addSql(`
      CREATE TABLE campaign_suppressions (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id VARCHAR(26) NOT NULL,
        reason VARCHAR(20) NOT NULL
          CHECK (reason IN ('opt_out', 'bounce', 'complaint', 'manual')),
        campaign_id VARCHAR(26),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_campaign_suppressions_tenant_contact ON campaign_suppressions(tenant_id, contact_id);
    `);

    // Opt-outs
    this.addSql(`
      CREATE TABLE opt_outs (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id VARCHAR(26) NOT NULL,
        channel VARCHAR(20) DEFAULT 'whatsapp',
        opted_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_opt_outs_tenant_contact_channel ON opt_outs(tenant_id, contact_id, channel);
      CREATE UNIQUE INDEX idx_opt_outs_tenant_contact_channel_unique
        ON opt_outs(tenant_id, contact_id, channel);
    `);

    // ========================================
    // SCHEDULING MODULE
    // ========================================

    // Service types
    this.addSql(`
      CREATE TABLE service_types (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INT NOT NULL,
        price NUMERIC(10,2),
        color VARCHAR(7),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_service_types_tenant ON service_types(tenant_id);
    `);

    // Resources
    this.addSql(`
      CREATE TABLE resources (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL
          CHECK (type IN ('professional', 'room', 'equipment', 'table')),
        user_id VARCHAR(26),
        service_type_ids JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_resources_tenant ON resources(tenant_id);
    `);

    // Schedule rules
    this.addSql(`
      CREATE TABLE schedule_rules (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        resource_id VARCHAR(26) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        day_of_week INT NOT NULL
          CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time VARCHAR(5) NOT NULL,
        end_time VARCHAR(5) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_schedule_rules_resource_day ON schedule_rules(resource_id, day_of_week);
    `);

    // Schedule exceptions
    this.addSql(`
      CREATE TABLE schedule_exceptions (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        resource_id VARCHAR(26) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time VARCHAR(5),
        end_time VARCHAR(5),
        reason VARCHAR(255),
        type VARCHAR(20) NOT NULL
          CHECK (type IN ('blocked', 'extended', 'holiday')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_schedule_exceptions_resource_date ON schedule_exceptions(resource_id, date);
    `);

    // Appointments
    this.addSql(`
      CREATE TABLE appointments (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id VARCHAR(26) NOT NULL,
        resource_id VARCHAR(26) NOT NULL REFERENCES resources(id),
        service_type_id VARCHAR(26) NOT NULL REFERENCES service_types(id),
        unit_id VARCHAR(26),
        start_at TIMESTAMPTZ NOT NULL,
        end_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled'
          CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
        notes TEXT,
        reminder_sent_at TIMESTAMPTZ,
        confirmed_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        cancel_reason TEXT,
        conversation_id VARCHAR(26),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_appointments_tenant_resource_start ON appointments(tenant_id, resource_id, start_at);
      CREATE INDEX idx_appointments_tenant_contact ON appointments(tenant_id, contact_id);
      CREATE INDEX idx_appointments_tenant_start ON appointments(tenant_id, start_at);
    `);

    // Waitlist
    this.addSql(`
      CREATE TABLE waitlist (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id VARCHAR(26) NOT NULL,
        service_type_id VARCHAR(26) NOT NULL,
        resource_id VARCHAR(26),
        preferred_date_start DATE NOT NULL,
        preferred_date_end DATE NOT NULL,
        preferred_time_start VARCHAR(5),
        preferred_time_end VARCHAR(5),
        status VARCHAR(20) DEFAULT 'waiting'
          CHECK (status IN ('waiting', 'offered', 'booked', 'expired', 'cancelled')),
        offered_at TIMESTAMPTZ,
        offered_appointment_id VARCHAR(26),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_waitlist_tenant_status ON waitlist(tenant_id, status);
    `);

    // ========================================
    // RLS Policies — Hardened
    // ========================================
    const tenantTables = [
      'campaigns',
      'campaign_messages',
      'campaign_suppressions',
      'opt_outs',
      'service_types',
      'resources',
      'schedule_rules',
      'schedule_exceptions',
      'appointments',
      'waitlist',
    ];

    for (const table of tenantTables) {
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
    // Remove RLS policies (reverse order)
    const tenantTables = [
      'waitlist',
      'appointments',
      'schedule_exceptions',
      'schedule_rules',
      'resources',
      'service_types',
      'opt_outs',
      'campaign_suppressions',
      'campaign_messages',
      'campaigns',
    ];

    for (const table of tenantTables) {
      this.addSql(`DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table};`);
      this.addSql(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
    }

    // Drop tables in reverse dependency order
    this.addSql(`DROP TABLE IF EXISTS waitlist;`);
    this.addSql(`DROP TABLE IF EXISTS appointments;`);
    this.addSql(`DROP TABLE IF EXISTS schedule_exceptions;`);
    this.addSql(`DROP TABLE IF EXISTS schedule_rules;`);
    this.addSql(`DROP TABLE IF EXISTS resources;`);
    this.addSql(`DROP TABLE IF EXISTS service_types;`);
    this.addSql(`DROP TABLE IF EXISTS opt_outs;`);
    this.addSql(`DROP TABLE IF EXISTS campaign_suppressions;`);
    this.addSql(`DROP TABLE IF EXISTS campaign_messages;`);
    this.addSql(`DROP TABLE IF EXISTS campaigns;`);
  }
}
