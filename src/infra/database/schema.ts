import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Enums
export const automationStatusEnum = pgEnum('automation_status', ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']);

export const executionStatusEnum = pgEnum('execution_status', [
  'PENDING',
  'PROCESSING',
  'SUCCESS',
  'FAILED',
  'RETRYING',
  'SKIPPED',
]);

// 1. Users
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authUserId: text('auth_user_id').notNull(),
    email: text('email').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastSignInAt: timestamp('last_sign_in_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('users_auth_user_id_idx').on(table.authUserId),
    uniqueIndex('users_email_idx').on(table.email),
  ]
);

// 2. Organizations
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 3. Organization Members
export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('OWNER'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('organization_members_organization_user_idx').on(table.organizationId, table.userId),
    index('organization_members_user_id_idx').on(table.userId),
  ]
);

// 4. Instagram Accounts
export const instagramAccounts = pgTable(
  'instagram_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    instagramUserId: text('instagram_user_id').notNull(),
    username: text('username').notNull(),
    accountType: text('account_type').notNull().default('UNKNOWN'),
    connectionType: text('connection_type').notNull().default('INSTAGRAM_LOGIN'),
    facebookPageId: text('facebook_page_id'),
    facebookPageName: text('facebook_page_name'),
    encryptedAccessToken: text('encrypted_access_token').notNull(),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('instagram_accounts_organization_instagram_user_idx').on(
      table.organizationId,
      table.instagramUserId
    ),
    index('instagram_accounts_instagram_user_id_idx').on(table.instagramUserId),
  ]
);

// 5. Automations
export const automations = pgTable(
  'automations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    instagramAccountId: uuid('instagram_account_id')
      .notNull()
      .references(() => instagramAccounts.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    status: automationStatusEnum('status').notNull().default('DRAFT'),
    trigger: jsonb('trigger').notNull(),
    action: jsonb('action').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('automations_instagram_account_status_idx').on(table.instagramAccountId, table.status),
    index('automations_organization_id_idx').on(table.organizationId),
  ]
);

// 6. Webhook Events (Deduplication layer 1)
export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
    provider: text('provider').notNull(),
    providerEventId: text('provider_event_id').notNull(),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('webhook_events_provider_event_id_idx').on(table.provider, table.providerEventId),
    index('webhook_events_organization_created_at_idx').on(table.organizationId, table.createdAt.desc()),
  ]
);

// 7. Automation Executions (Deduplication layer 2 & Delivery audit trail)
export const automationExecutions = pgTable(
  'automation_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    automationId: uuid('automation_id')
      .notNull()
      .references(() => automations.id, { onDelete: 'cascade' }),
    sourceEventId: uuid('source_event_id')
      .notNull()
      .references(() => webhookEvents.id, { onDelete: 'restrict' }),
    status: executionStatusEnum('status').notNull().default('PENDING'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    attemptCount: integer('attempt_count').notNull().default(0),
  },
  (table) => [
    uniqueIndex('automation_executions_automation_source_idx').on(table.automationId, table.sourceEventId),
    index('automation_executions_organization_id_idx').on(table.organizationId),
  ]
);
