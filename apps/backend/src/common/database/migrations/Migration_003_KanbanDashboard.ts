import { Migration } from '@mikro-orm/migrations';

/**
 * Kanban & Dashboard migration — creates tables for Kanban boards/cards and Dashboard KPIs/widgets.
 *
 * Depends on Migration_001_Foundation (tenants, users) and Migration_002_Modules (conversations, contacts).
 *
 * RLS hardening:
 * - ENABLE + FORCE ROW LEVEL SECURITY on all 8 TENANT_DIRECT tables
 * - current_setting('app.current_tenant_id', true) — returns NULL if not set (safe: no rows returned)
 */
export class Migration_003_KanbanDashboard extends Migration {
  async up(): Promise<void> {
    // ========================================
    // KANBAN MODULE
    // ========================================

    // Kanban boards
    this.addSql(`
      CREATE TABLE kanban_boards (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) DEFAULT 'custom'
          CHECK (type IN ('sales', 'support', 'custom')),
        description TEXT,
        is_default BOOLEAN DEFAULT false,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_kanban_boards_tenant ON kanban_boards(tenant_id);
    `);

    // Kanban columns
    this.addSql(`
      CREATE TABLE kanban_columns (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        board_id VARCHAR(26) NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        position INT NOT NULL DEFAULT 0,
        wip_limit INT DEFAULT 0,
        color VARCHAR(7),
        is_terminal BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_kanban_columns_board_position ON kanban_columns(board_id, position);
    `);

    // Kanban swimlanes
    this.addSql(`
      CREATE TABLE kanban_swimlanes (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        board_id VARCHAR(26) NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Kanban cards
    this.addSql(`
      CREATE TABLE kanban_cards (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        board_id VARCHAR(26) NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
        column_id VARCHAR(26) NOT NULL REFERENCES kanban_columns(id),
        swimlane_id VARCHAR(26) REFERENCES kanban_swimlanes(id),
        conversation_id VARCHAR(26),
        contact_id VARCHAR(26),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'medium'
          CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        assigned_to VARCHAR(26),
        due_date TIMESTAMPTZ,
        position INT NOT NULL DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_kanban_cards_tenant_board ON kanban_cards(tenant_id, board_id);
      CREATE INDEX idx_kanban_cards_column_position ON kanban_cards(column_id, position);
      CREATE INDEX idx_kanban_cards_tenant_assigned ON kanban_cards(tenant_id, assigned_to);
    `);

    // Kanban card history
    this.addSql(`
      CREATE TABLE kanban_card_history (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        card_id VARCHAR(26) NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
        from_column_id VARCHAR(26),
        to_column_id VARCHAR(26),
        moved_by VARCHAR(26),
        moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        dwell_time_ms BIGINT
      );
      CREATE INDEX idx_kanban_card_history_card_moved ON kanban_card_history(card_id, moved_at DESC);
    `);

    // Kanban automations
    this.addSql(`
      CREATE TABLE kanban_automations (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        board_id VARCHAR(26) NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        trigger VARCHAR(30)
          CHECK (trigger IN ('card_enters_column', 'card_exits_column', 'wip_exceeded', 'due_date_passed')),
        trigger_config JSONB DEFAULT '{}',
        action VARCHAR(30)
          CHECK (action IN ('move_card', 'assign_agent', 'send_notification', 'update_priority')),
        action_config JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ========================================
    // DASHBOARD MODULE
    // ========================================

    // Materialized KPIs
    this.addSql(`
      CREATE TABLE materialized_kpis (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        metric VARCHAR(50) NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        dimensions JSONB DEFAULT '{}',
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        period_type VARCHAR(20) NOT NULL
          CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_materialized_kpis_tenant_metric ON materialized_kpis(tenant_id, metric, period_type, period_start);
      CREATE INDEX idx_materialized_kpis_tenant_period ON materialized_kpis(tenant_id, period_start DESC);
    `);

    // Widget layouts
    this.addSql(`
      CREATE TABLE widget_layouts (
        id VARCHAR(26) PRIMARY KEY,
        tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR(26) NOT NULL,
        layout_name VARCHAR(100) DEFAULT 'default',
        widgets JSONB DEFAULT '[]',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_widget_layouts_tenant_user ON widget_layouts(tenant_id, user_id);
    `);

    // ========================================
    // RLS Policies — Hardened
    // ========================================
    const tenantTables = [
      'kanban_boards',
      'kanban_columns',
      'kanban_swimlanes',
      'kanban_cards',
      'kanban_card_history',
      'kanban_automations',
      'materialized_kpis',
      'widget_layouts',
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
      'widget_layouts',
      'materialized_kpis',
      'kanban_automations',
      'kanban_card_history',
      'kanban_cards',
      'kanban_swimlanes',
      'kanban_columns',
      'kanban_boards',
    ];

    for (const table of tenantTables) {
      this.addSql(`DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table};`);
      this.addSql(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
    }

    // Drop tables in reverse dependency order
    this.addSql(`DROP TABLE IF EXISTS widget_layouts;`);
    this.addSql(`DROP TABLE IF EXISTS materialized_kpis;`);
    this.addSql(`DROP TABLE IF EXISTS kanban_automations;`);
    this.addSql(`DROP TABLE IF EXISTS kanban_card_history;`);
    this.addSql(`DROP TABLE IF EXISTS kanban_cards;`);
    this.addSql(`DROP TABLE IF EXISTS kanban_swimlanes;`);
    this.addSql(`DROP TABLE IF EXISTS kanban_columns;`);
    this.addSql(`DROP TABLE IF EXISTS kanban_boards;`);
  }
}
