import { Migration } from '@mikro-orm/migrations';

/**
 * AI Chatbot, Bot Builder, Reports & Billing migration — creates tables for
 * knowledge management, AI conversation logging, bot flow builder, report
 * generation/export, and subscription billing with usage tracking.
 *
 * Depends on Migration_001_Foundation (tenants, users) and Migration_002_Modules (contacts, conversations).
 *
 * RLS hardening:
 * - ENABLE + FORCE ROW LEVEL SECURITY on all 18 TENANT_DIRECT tables
 * - current_setting('app.current_tenant_id', true) — returns NULL if not set (safe: no rows returned)
 */
export class Migration_005_AiBotReportsBilling extends Migration {
  async up(): Promise<void> {
    // ========================================
    // AI CHATBOT MODULE
    // ========================================

    // Knowledge bases
    this.addSql(`
      CREATE TABLE knowledge_bases (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active'
          CHECK (status IN ('active', 'inactive')),
        document_count INT DEFAULT 0,
        chunk_count INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Knowledge documents
    this.addSql(`
      CREATE TABLE knowledge_documents (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        knowledge_base_id VARCHAR(26) NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
        title VARCHAR(500),
        content TEXT,
        source_url TEXT,
        source_type VARCHAR(20)
          CHECK (source_type IN ('manual', 'upload', 'url', 'conversation')),
        mime_type VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
        chunk_count INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_knowledge_documents_base ON knowledge_documents(knowledge_base_id);
    `);

    // Knowledge chunks
    this.addSql(`
      CREATE TABLE knowledge_chunks (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        document_id VARCHAR(26) NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
        knowledge_base_id VARCHAR(26) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        token_count INT NOT NULL,
        chunk_index INT NOT NULL,
        embedding vector(1536),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_knowledge_chunks_tenant_base ON knowledge_chunks(tenant_id, knowledge_base_id);
      CREATE INDEX idx_knowledge_chunks_document ON knowledge_chunks(document_id);
    `);

    // AI conversation logs
    this.addSql(`
      CREATE TABLE ai_conversation_logs (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        conversation_id VARCHAR(26),
        message_id VARCHAR(26),
        pipeline JSONB NOT NULL DEFAULT '{}',
        input_text TEXT NOT NULL,
        output_text TEXT,
        confidence DOUBLE PRECISION,
        was_escalated BOOLEAN DEFAULT false,
        response_time_ms INT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_ai_conversation_logs_tenant_conversation ON ai_conversation_logs(tenant_id, conversation_id);
    `);

    // Knowledge feedback
    this.addSql(`
      CREATE TABLE knowledge_feedback (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        chunk_id VARCHAR(26) NOT NULL,
        conversation_id VARCHAR(26),
        rating VARCHAR(20) NOT NULL
          CHECK (rating IN ('helpful', 'not_helpful', 'wrong')),
        comment TEXT,
        created_by VARCHAR(26),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_knowledge_feedback_chunk ON knowledge_feedback(chunk_id);
    `);

    // ========================================
    // BOT BUILDER MODULE
    // ========================================

    // Bot flows
    this.addSql(`
      CREATE TABLE bot_flows (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'draft'
          CHECK (status IN ('draft', 'published', 'archived')),
        version INT DEFAULT 1,
        trigger_type VARCHAR(30)
          CHECK (trigger_type IN ('keyword', 'webhook', 'schedule', 'manual', 'conversation_start')),
        trigger_config JSONB DEFAULT '{}',
        published_at TIMESTAMPTZ,
        created_by VARCHAR(26),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_bot_flows_tenant ON bot_flows(tenant_id);
    `);

    // Bot flow nodes
    this.addSql(`
      CREATE TABLE bot_flow_nodes (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        flow_id VARCHAR(26) NOT NULL REFERENCES bot_flows(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL
          CHECK (type IN ('start', 'message', 'question', 'condition', 'action', 'delay', 'api_call', 'ai_response', 'assign_agent', 'end')),
        data JSONB DEFAULT '{}',
        position JSONB DEFAULT '{"x":0,"y":0}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_bot_flow_nodes_flow ON bot_flow_nodes(flow_id);
    `);

    // Bot flow edges
    this.addSql(`
      CREATE TABLE bot_flow_edges (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        flow_id VARCHAR(26) NOT NULL REFERENCES bot_flows(id) ON DELETE CASCADE,
        source_node_id VARCHAR(26) NOT NULL,
        target_node_id VARCHAR(26) NOT NULL,
        source_handle VARCHAR(100),
        label VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_bot_flow_edges_flow ON bot_flow_edges(flow_id);
    `);

    // Bot flow sessions
    this.addSql(`
      CREATE TABLE bot_flow_sessions (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        flow_id VARCHAR(26) NOT NULL REFERENCES bot_flows(id),
        conversation_id VARCHAR(26) NOT NULL,
        contact_id VARCHAR(26) NOT NULL,
        current_node_id VARCHAR(26),
        status VARCHAR(20) DEFAULT 'active'
          CHECK (status IN ('active', 'completed', 'failed', 'expired')),
        variables JSONB DEFAULT '{}',
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_bot_flow_sessions_tenant_flow ON bot_flow_sessions(tenant_id, flow_id);
      CREATE INDEX idx_bot_flow_sessions_tenant_conversation ON bot_flow_sessions(tenant_id, conversation_id);
    `);

    // ========================================
    // REPORTS MODULE
    // ========================================

    // Saved reports
    this.addSql(`
      CREATE TABLE saved_reports (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(30) NOT NULL
          CHECK (type IN ('conversations', 'agents', 'campaigns', 'appointments', 'contacts')),
        filters JSONB DEFAULT '{}',
        schedule JSONB,
        created_by VARCHAR(26),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_saved_reports_tenant ON saved_reports(tenant_id);
    `);

    // Report snapshots
    this.addSql(`
      CREATE TABLE report_snapshots (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        report_id VARCHAR(26) NOT NULL REFERENCES saved_reports(id) ON DELETE CASCADE,
        data JSONB,
        format VARCHAR(10) NOT NULL
          CHECK (format IN ('json', 'csv', 'xlsx')),
        file_url TEXT,
        generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_report_snapshots_report ON report_snapshots(report_id);
    `);

    // Export jobs
    this.addSql(`
      CREATE TABLE export_jobs (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        filters JSONB DEFAULT '{}',
        format VARCHAR(10) NOT NULL
          CHECK (format IN ('csv', 'xlsx', 'pdf')),
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        file_url TEXT,
        error TEXT,
        progress INT DEFAULT 0,
        created_by VARCHAR(26),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_export_jobs_tenant_status ON export_jobs(tenant_id, status);
    `);

    // ========================================
    // BILLING MODULE
    // ========================================

    // Subscriptions
    this.addSql(`
      CREATE TABLE subscriptions (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        plan_id VARCHAR(26) NOT NULL,
        status VARCHAR(20) DEFAULT 'trialing'
          CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        trial_ends_at TIMESTAMPTZ,
        external_id VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id)
      );
      CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
    `);

    // Usage records
    this.addSql(`
      CREATE TABLE usage_records (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        metric VARCHAR(50) NOT NULL,
        value NUMERIC(12,2) NOT NULL DEFAULT 0,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, metric, period_start)
      );
      CREATE INDEX idx_usage_records_tenant_metric_period ON usage_records(tenant_id, metric, period_start);
    `);

    // ========================================
    // RLS Policies — Hardened
    // ========================================
    const tenantTables = [
      'knowledge_bases',
      'knowledge_documents',
      'knowledge_chunks',
      'ai_conversation_logs',
      'knowledge_feedback',
      'bot_flows',
      'bot_flow_nodes',
      'bot_flow_edges',
      'bot_flow_sessions',
      'saved_reports',
      'report_snapshots',
      'export_jobs',
      'subscriptions',
      'usage_records',
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
      'usage_records',
      'subscriptions',
      'export_jobs',
      'report_snapshots',
      'saved_reports',
      'bot_flow_sessions',
      'bot_flow_edges',
      'bot_flow_nodes',
      'bot_flows',
      'knowledge_feedback',
      'ai_conversation_logs',
      'knowledge_chunks',
      'knowledge_documents',
      'knowledge_bases',
    ];

    for (const table of tenantTables) {
      this.addSql(`DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table};`);
      this.addSql(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
    }

    // Drop tables in reverse dependency order
    this.addSql(`DROP TABLE IF EXISTS usage_records;`);
    this.addSql(`DROP TABLE IF EXISTS subscriptions;`);
    this.addSql(`DROP TABLE IF EXISTS export_jobs;`);
    this.addSql(`DROP TABLE IF EXISTS report_snapshots;`);
    this.addSql(`DROP TABLE IF EXISTS saved_reports;`);
    this.addSql(`DROP TABLE IF EXISTS bot_flow_sessions;`);
    this.addSql(`DROP TABLE IF EXISTS bot_flow_edges;`);
    this.addSql(`DROP TABLE IF EXISTS bot_flow_nodes;`);
    this.addSql(`DROP TABLE IF EXISTS bot_flows;`);
    this.addSql(`DROP TABLE IF EXISTS knowledge_feedback;`);
    this.addSql(`DROP TABLE IF EXISTS ai_conversation_logs;`);
    this.addSql(`DROP TABLE IF EXISTS knowledge_chunks;`);
    this.addSql(`DROP TABLE IF EXISTS knowledge_documents;`);
    this.addSql(`DROP TABLE IF EXISTS knowledge_bases;`);
  }
}
