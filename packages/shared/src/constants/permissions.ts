export const PERMISSIONS = {
  // Inbox
  INBOX_READ: 'inbox:read',
  INBOX_WRITE: 'inbox:write',
  INBOX_ASSIGN: 'inbox:assign',
  INBOX_TRANSFER: 'inbox:transfer',

  // Contacts
  CONTACTS_READ: 'contacts:read',
  CONTACTS_WRITE: 'contacts:write',
  CONTACTS_DELETE: 'contacts:delete',
  CONTACTS_IMPORT: 'contacts:import',

  // Kanban
  KANBAN_READ: 'kanban:read',
  KANBAN_WRITE: 'kanban:write',
  KANBAN_ADMIN: 'kanban:admin',

  // Campaigns
  CAMPAIGNS_READ: 'campaigns:read',
  CAMPAIGNS_WRITE: 'campaigns:write',
  CAMPAIGNS_SEND: 'campaigns:send',

  // Scheduling
  SCHEDULING_READ: 'scheduling:read',
  SCHEDULING_WRITE: 'scheduling:write',
  SCHEDULING_ADMIN: 'scheduling:admin',

  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  // Team
  TEAM_READ: 'team:read',
  TEAM_WRITE: 'team:write',

  // Billing
  BILLING_READ: 'billing:read',
  BILLING_WRITE: 'billing:write',

  // AI
  AI_READ: 'ai:read',
  AI_WRITE: 'ai:write',
  AI_ADMIN: 'ai:admin',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: Object.values(PERMISSIONS),
  admin: Object.values(PERMISSIONS).filter(
    (p) => p !== PERMISSIONS.BILLING_WRITE,
  ),
  supervisor: [
    PERMISSIONS.INBOX_READ, PERMISSIONS.INBOX_WRITE, PERMISSIONS.INBOX_ASSIGN, PERMISSIONS.INBOX_TRANSFER,
    PERMISSIONS.CONTACTS_READ, PERMISSIONS.CONTACTS_WRITE,
    PERMISSIONS.KANBAN_READ, PERMISSIONS.KANBAN_WRITE,
    PERMISSIONS.CAMPAIGNS_READ, PERMISSIONS.CAMPAIGNS_WRITE, PERMISSIONS.CAMPAIGNS_SEND,
    PERMISSIONS.SCHEDULING_READ, PERMISSIONS.SCHEDULING_WRITE,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.TEAM_READ,
  ],
  agent: [
    PERMISSIONS.INBOX_READ, PERMISSIONS.INBOX_WRITE,
    PERMISSIONS.CONTACTS_READ,
    PERMISSIONS.KANBAN_READ, PERMISSIONS.KANBAN_WRITE,
    PERMISSIONS.SCHEDULING_READ, PERMISSIONS.SCHEDULING_WRITE,
  ],
  viewer: [
    PERMISSIONS.INBOX_READ,
    PERMISSIONS.CONTACTS_READ,
    PERMISSIONS.KANBAN_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.SCHEDULING_READ,
  ],
};
