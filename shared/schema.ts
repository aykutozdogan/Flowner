import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, uuid, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["tenant_admin", "designer", "approver", "user"]);
export const processStatusEnum = pgEnum("process_status", ["running", "completed", "cancelled", "suspended"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "completed", "cancelled", "assigned"]);
export const formStatusEnum = pgEnum("form_status", ["draft", "published", "archived"]);
export const workflowStatusEnum = pgEnum("workflow_status", ["draft", "published", "archived"]);

// Tenants table
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  settings: jsonb("settings").default({}),
  branding: jsonb("branding").default({}),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantEmailIdx: index("users_tenant_email_idx").on(table.tenant_id, table.email),
  tenantIdIdx: index("users_tenant_id_idx").on(table.tenant_id),
}));

// Forms table
export const forms = pgTable("forms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 50 }).default("1.0.0").notNull(),
  status: formStatusEnum("status").default("draft").notNull(),
  schema: jsonb("schema").notNull(),
  created_by: uuid("created_by").references(() => users.id).notNull(),
  published_at: timestamp("published_at"),
  is_deleted: boolean("is_deleted").default(false).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantStatusIdx: index("forms_tenant_status_idx").on(table.tenant_id, table.status),
  tenantDeletedIdx: index("forms_tenant_deleted_idx").on(table.tenant_id, table.is_deleted),
}));

// Workflows table
export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 50 }).default("1.0.0").notNull(),
  status: workflowStatusEnum("status").default("draft").notNull(),
  bpmn_xml: text("bpmn_xml").notNull(),
  config: jsonb("config").default({}),
  created_by: uuid("created_by").references(() => users.id).notNull(),
  published_at: timestamp("published_at"),
  is_deleted: boolean("is_deleted").default(false).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantStatusIdx: index("workflows_tenant_status_idx").on(table.tenant_id, table.status),
  tenantDeletedIdx: index("workflows_tenant_deleted_idx").on(table.tenant_id, table.is_deleted),
}));

// Process Instances table
export const processInstances = pgTable("process_instances", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  workflow_id: uuid("workflow_id").references(() => workflows.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: processStatusEnum("status").default("running").notNull(),
  variables: jsonb("variables").default({}),
  started_by: uuid("started_by").references(() => users.id).notNull(),
  started_at: timestamp("started_at").default(sql`now()`).notNull(),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantStatusIdx: index("process_instances_tenant_status_idx").on(table.tenant_id, table.status),
  workflowIdx: index("process_instances_workflow_idx").on(table.workflow_id),
  startedByIdx: index("process_instances_started_by_idx").on(table.started_by),
}));

// Task Instances table
export const taskInstances = pgTable("task_instances", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  process_id: uuid("process_id").references(() => processInstances.id).notNull(),
  task_key: varchar("task_key", { length: 255 }).notNull(), // BPMN element ID
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  form_id: uuid("form_id").references(() => forms.id),
  assignee_id: uuid("assignee_id").references(() => users.id),
  status: taskStatusEnum("status").default("pending").notNull(),
  priority: integer("priority").default(1).notNull(),
  due_date: timestamp("due_date"),
  form_data: jsonb("form_data").default({}),
  outcome: varchar("outcome", { length: 100 }),
  completed_by: uuid("completed_by").references(() => users.id),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantStatusIdx: index("task_instances_tenant_status_idx").on(table.tenant_id, table.status),
  processIdx: index("task_instances_process_idx").on(table.process_id),
  assigneeIdx: index("task_instances_assignee_idx").on(table.assignee_id),
  assigneeStatusIdx: index("task_instances_assignee_status_idx").on(table.assignee_id, table.status),
}));

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  user_id: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity_type: varchar("entity_type", { length: 100 }).notNull(),
  entity_id: uuid("entity_id"),
  details: jsonb("details").default({}),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  trace_id: varchar("trace_id", { length: 100 }),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantCreatedIdx: index("audit_logs_tenant_created_idx").on(table.tenant_id, table.created_at),
  userCreatedIdx: index("audit_logs_user_created_idx").on(table.user_id, table.created_at),
  entityIdx: index("audit_logs_entity_idx").on(table.entity_type, table.entity_id),
}));

// File Attachments table
export const fileAttachments = pgTable("file_attachments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  process_id: uuid("process_id").references(() => processInstances.id),
  task_id: uuid("task_id").references(() => taskInstances.id),
  filename: varchar("filename", { length: 255 }).notNull(),
  original_name: varchar("original_name", { length: 255 }).notNull(),
  mime_type: varchar("mime_type", { length: 100 }).notNull(),
  file_size: integer("file_size").notNull(),
  file_path: text("file_path").notNull(),
  uploaded_by: uuid("uploaded_by").references(() => users.id).notNull(),
  is_deleted: boolean("is_deleted").default(false).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantProcessIdx: index("file_attachments_tenant_process_idx").on(table.tenant_id, table.process_id),
  tenantTaskIdx: index("file_attachments_tenant_task_idx").on(table.tenant_id, table.task_id),
  uploadedByIdx: index("file_attachments_uploaded_by_idx").on(table.uploaded_by),
}));

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  forms: many(forms),
  workflows: many(workflows),
  processInstances: many(processInstances),
  taskInstances: many(taskInstances),
  auditLogs: many(auditLogs),
  fileAttachments: many(fileAttachments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenant_id],
    references: [tenants.id],
  }),
  createdForms: many(forms),
  createdWorkflows: many(workflows),
  startedProcesses: many(processInstances),
  assignedTasks: many(taskInstances, { relationName: "assignedTasks" }),
  completedTasks: many(taskInstances, { relationName: "completedTasks" }),
  auditLogs: many(auditLogs),
  uploadedFiles: many(fileAttachments),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [forms.tenant_id],
    references: [tenants.id],
  }),
  createdBy: one(users, {
    fields: [forms.created_by],
    references: [users.id],
  }),
  taskInstances: many(taskInstances),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [workflows.tenant_id],
    references: [tenants.id],
  }),
  createdBy: one(users, {
    fields: [workflows.created_by],
    references: [users.id],
  }),
  processInstances: many(processInstances),
}));

export const processInstancesRelations = relations(processInstances, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [processInstances.tenant_id],
    references: [tenants.id],
  }),
  workflow: one(workflows, {
    fields: [processInstances.workflow_id],
    references: [workflows.id],
  }),
  startedBy: one(users, {
    fields: [processInstances.started_by],
    references: [users.id],
  }),
  taskInstances: many(taskInstances),
  fileAttachments: many(fileAttachments),
}));

export const taskInstancesRelations = relations(taskInstances, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [taskInstances.tenant_id],
    references: [tenants.id],
  }),
  processInstance: one(processInstances, {
    fields: [taskInstances.process_id],
    references: [processInstances.id],
  }),
  form: one(forms, {
    fields: [taskInstances.form_id],
    references: [forms.id],
  }),
  assignee: one(users, {
    fields: [taskInstances.assignee_id],
    references: [users.id],
    relationName: "assignedTasks",
  }),
  completedBy: one(users, {
    fields: [taskInstances.completed_by],
    references: [users.id],
    relationName: "completedTasks",
  }),
  fileAttachments: many(fileAttachments),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenant_id],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [auditLogs.user_id],
    references: [users.id],
  }),
}));

export const fileAttachmentsRelations = relations(fileAttachments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [fileAttachments.tenant_id],
    references: [tenants.id],
  }),
  processInstance: one(processInstances, {
    fields: [fileAttachments.process_id],
    references: [processInstances.id],
  }),
  taskInstance: one(taskInstances, {
    fields: [fileAttachments.task_id],
    references: [taskInstances.id],
  }),
  uploadedBy: one(users, {
    fields: [fileAttachments.uploaded_by],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_login: true,
});

export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  created_at: true,
  updated_at: true,
  published_at: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  created_at: true,
  updated_at: true,
  published_at: true,
});

export const insertProcessInstanceSchema = createInsertSchema(processInstances).omit({
  id: true,
  created_at: true,
  updated_at: true,
  started_at: true,
  completed_at: true,
});

export const insertTaskInstanceSchema = createInsertSchema(taskInstances).omit({
  id: true,
  created_at: true,
  updated_at: true,
  completed_at: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  created_at: true,
});

export const insertFileAttachmentSchema = createInsertSchema(fileAttachments).omit({
  id: true,
  created_at: true,
});

// Type exports
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type ProcessInstance = typeof processInstances.$inferSelect;
export type InsertProcessInstance = z.infer<typeof insertProcessInstanceSchema>;

export type TaskInstance = typeof taskInstances.$inferSelect;
export type InsertTaskInstance = z.infer<typeof insertTaskInstanceSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type FileAttachment = typeof fileAttachments.$inferSelect;
export type InsertFileAttachment = z.infer<typeof insertFileAttachmentSchema>;

// Additional types for API responses
export type UserWithTenant = User & {
  tenant: Tenant;
};

export type ProcessInstanceWithDetails = ProcessInstance & {
  workflow: Workflow;
  startedBy: User;
  taskInstances: TaskInstance[];
};

export type TaskInstanceWithDetails = TaskInstance & {
  processInstance: ProcessInstance;
  form?: Form;
  assignee?: User;
  completedBy?: User;
};
