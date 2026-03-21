import { Migration } from '@mikro-orm/migrations';

/**
 * Modules migration — creates tables for Contacts, WhatsApp, and Inbox modules.
 *
 * Depends on Migration_001_Foundation (tenants, users, teams).
 *
 * RLS hardening:
 * - ENABLE + FORCE ROW LEVEL SECURITY on all TENANT_DIRECT tables
 * - current_setting('app.current_tenant_id', true) — returns NULL if not set (safe: no rows returned)
 * - TENANT_FK tables (contact_tags, segment_contacts) have no RLS — protected by FK cascades
 */
export class Migration_002_Modules extends Migration {
  async up(): Promise<void> {
    // ========================================
    // CONTACTS MODULE
    // ========================================

    // Contacts
    this.addSql(`
      CREATE TABLE contacts (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        whatsapp_id VARCHAR(100),
        avatar_url TEXT,
        status VARCHAR(20) DEFAULT 'active'
          CHECK (status IN ('active', 'inactive', 'blocked')),
        consent_status VARCHAR(20) DEFAULT 'unknown'
          CHECK (consent_status IN ('granted', 'denied', 'unknown')),
        funnel_stage VARCHAR(20) DEFAULT 'lead'
          CHECK (funnel_stage IN ('lead', 'prospect', 'customer', 'churned')),
        source VARCHAR(50),
        custom_fields JSONB DEFAULT '{}',
        last_contacted_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
      CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
      CREATE INDEX idx_contacts_phone ON contacts(phone);
      CREATE INDEX idx_contacts_email ON contacts(email);
      CREATE INDEX idx_contacts_whatsapp_id ON contacts(whatsapp_id);
      CREATE INDEX idx_contacts_tenant_funnel ON contacts(tenant_id, funnel_stage);
      CREATE INDEX idx_contacts_tenant_deleted ON contacts(tenant_id, deleted_at);
    `);

    // Tags
    this.addSql(`
      CREATE TABLE tags (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, name)
      );
    `);

    // Contact tags (TENANT_FK — no RLS, protected by FK)
    this.addSql(`
      CREATE TABLE contact_tags (
        contact_id VARCHAR(26) NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        tag_id VARCHAR(26) NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (contact_id, tag_id)
      );
    `);

    // Custom field definitions
    this.addSql(`
      CREATE TABLE custom_field_definitions (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100),
        field_type VARCHAR(20)
          CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select')),
        options JSONB DEFAULT '[]',
        is_required BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Segments
    this.addSql(`
      CREATE TABLE segments (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100),
        description TEXT,
        rules JSONB NOT NULL DEFAULT '[]',
        contact_count INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Segment contacts (TENANT_FK — no RLS, protected by FK)
    this.addSql(`
      CREATE TABLE segment_contacts (
        segment_id VARCHAR(26) NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
        contact_id VARCHAR(26) NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (segment_id, contact_id)
      );
    `);

    // ========================================
    // WHATSAPP MODULE
    // ========================================

    // WhatsApp accounts
    this.addSql(`
      CREATE TABLE whatsapp_accounts (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        phone_number_id VARCHAR(100) NOT NULL UNIQUE,
        waba_id VARCHAR(100),
        display_phone VARCHAR(50),
        verified_name VARCHAR(255),
        quality_rating VARCHAR(10) DEFAULT 'GREEN'
          CHECK (quality_rating IN ('GREEN', 'YELLOW', 'RED')),
        messaging_tier VARCHAR(20) DEFAULT '1K'
          CHECK (messaging_tier IN ('1K', '10K', '100K', 'UNLIMITED')),
        status VARCHAR(20) DEFAULT 'active',
        capabilities JSONB DEFAULT '{}',
        access_token TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // WhatsApp templates
    this.addSql(`
      CREATE TABLE whatsapp_templates (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        template_id VARCHAR(100),
        name VARCHAR(255),
        language VARCHAR(10) DEFAULT 'pt_BR',
        category VARCHAR(20)
          CHECK (category IN ('marketing', 'utility', 'authentication')),
        status VARCHAR(20)
          CHECK (status IN ('approved', 'pending', 'rejected')),
        components JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Webhook events
    this.addSql(`
      CREATE TABLE webhook_events (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        processed BOOLEAN DEFAULT false,
        processed_at TIMESTAMPTZ,
        error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_webhook_events_tenant_processed ON webhook_events(tenant_id, processed, created_at);
    `);

    // ========================================
    // INBOX MODULE
    // ========================================

    // SLA policies (created before conversations since conversations reference sla_policy_id)
    this.addSql(`
      CREATE TABLE sla_policies (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100),
        first_response_time_mins INT,
        resolution_time_mins INT,
        priority VARCHAR(20)
          CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Conversations
    this.addSql(`
      CREATE TABLE conversations (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id VARCHAR(26) NOT NULL REFERENCES contacts(id),
        channel VARCHAR(20) NOT NULL
          CHECK (channel IN ('whatsapp', 'email', 'webchat', 'telegram', 'instagram')),
        channel_id VARCHAR(100),
        type VARCHAR(20) DEFAULT 'direct'
          CHECK (type IN ('direct', 'channel', 'group')),
        status VARCHAR(20) DEFAULT 'open'
          CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
        priority VARCHAR(20) DEFAULT 'medium'
          CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        assigned_to VARCHAR(26),
        team_id VARCHAR(26),
        sla_policy_id VARCHAR(26),
        sla_breached BOOLEAN DEFAULT false,
        session_expires_at TIMESTAMPTZ,
        last_message_at TIMESTAMPTZ,
        message_count INT DEFAULT 0,
        unread_count INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
      CREATE INDEX idx_conversations_tenant_status ON conversations(tenant_id, status);
      CREATE INDEX idx_conversations_tenant_assigned ON conversations(tenant_id, assigned_to);
      CREATE INDEX idx_conversations_tenant_contact ON conversations(tenant_id, contact_id);
      CREATE INDEX idx_conversations_tenant_last_msg ON conversations(tenant_id, last_message_at DESC);
    `);

    // Messages
    this.addSql(`
      CREATE TABLE messages (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        conversation_id VARCHAR(26) NOT NULL REFERENCES conversations(id),
        sender_type VARCHAR(20) NOT NULL
          CHECK (sender_type IN ('contact', 'agent', 'bot', 'system')),
        sender_id VARCHAR(26),
        content_type VARCHAR(20) NOT NULL
          CHECK (content_type IN ('text', 'image', 'video', 'audio', 'document', 'template', 'interactive', 'location', 'sticker', 'reaction')),
        content JSONB NOT NULL DEFAULT '{}',
        external_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
        error_code VARCHAR(50),
        idempotency_key VARCHAR(255),
        source VARCHAR(20) DEFAULT 'webhook'
          CHECK (source IN ('webhook', 'import', 'migration')),
        imported BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_messages_tenant_conv_created ON messages(tenant_id, conversation_id, created_at DESC);
      CREATE INDEX idx_messages_external_id ON messages(external_id);
      CREATE INDEX idx_messages_idempotency ON messages(idempotency_key);
      CREATE UNIQUE INDEX idx_messages_tenant_idempotency_unique ON messages(tenant_id, idempotency_key)
        WHERE idempotency_key IS NOT NULL;
    `);

    // Internal notes
    this.addSql(`
      CREATE TABLE internal_notes (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        conversation_id VARCHAR(26) REFERENCES conversations(id),
        user_id VARCHAR(26) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Quick replies
    this.addSql(`
      CREATE TABLE quick_replies (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        title VARCHAR(100),
        content TEXT NOT NULL,
        shortcut VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ========================================
    // RLS Policies — Hardened
    // ========================================
    const tenantTables = [
      'contacts',
      'tags',
      'custom_field_definitions',
      'segments',
      'whatsapp_accounts',
      'whatsapp_templates',
      'webhook_events',
      'conversations',
      'messages',
      'internal_notes',
      'sla_policies',
      'quick_replies',
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
    // Remove RLS policies
    const tenantTables = [
      'quick_replies',
      'sla_policies',
      'internal_notes',
      'messages',
      'conversations',
      'webhook_events',
      'whatsapp_templates',
      'whatsapp_accounts',
      'segments',
      'custom_field_definitions',
      'tags',
      'contacts',
    ];

    for (const table of tenantTables) {
      this.addSql(`DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table};`);
      this.addSql(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
    }

    // Drop tables in reverse dependency order
    this.addSql(`DROP TABLE IF EXISTS quick_replies;`);
    this.addSql(`DROP TABLE IF EXISTS internal_notes;`);
    this.addSql(`DROP TABLE IF EXISTS messages;`);
    this.addSql(`DROP TABLE IF EXISTS conversations;`);
    this.addSql(`DROP TABLE IF EXISTS sla_policies;`);
    this.addSql(`DROP TABLE IF EXISTS webhook_events;`);
    this.addSql(`DROP TABLE IF EXISTS whatsapp_templates;`);
    this.addSql(`DROP TABLE IF EXISTS whatsapp_accounts;`);
    this.addSql(`DROP TABLE IF EXISTS segment_contacts;`);
    this.addSql(`DROP TABLE IF EXISTS segments;`);
    this.addSql(`DROP TABLE IF EXISTS custom_field_definitions;`);
    this.addSql(`DROP TABLE IF EXISTS contact_tags;`);
    this.addSql(`DROP TABLE IF EXISTS tags;`);
    this.addSql(`DROP TABLE IF EXISTS contacts;`);
  }
}
