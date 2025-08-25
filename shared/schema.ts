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
export const workflowVersionStatusEnum = pgEnum("workflow_version_status", ["draft", "published"]);
export const taskTypeEnum = pgEnum("task_type", ["user", "service"]);
export const jobStatusEnum = pgEnum("job_status", ["queued", "running", "done", "dead"]);
export const jobKindEnum = pgEnum("job_kind", ["service_exec", "timer", "retry"]);

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
  key: varchar("key", { length: 255 }).notNull(), // Form key for referencing
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  latest_version: integer("latest_version").default(1).notNull(), // Track latest version number
  status: formStatusEnum("status").default("draft").notNull(),
  created_by: uuid("created_by").references(() => users.id).notNull(),
  is_deleted: boolean("is_deleted").default(false).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantKeyIdx: index("forms_tenant_key_idx").on(table.tenant_id, table.key),
  tenantStatusIdx: index("forms_tenant_status_idx").on(table.tenant_id, table.status),
  tenantDeletedIdx: index("forms_tenant_deleted_idx").on(table.tenant_id, table.is_deleted),
}));

// Form Versions table
export const formVersions = pgTable("form_versions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  form_id: uuid("form_id").references(() => forms.id).notNull(),
  version: integer("version").notNull(),
  status: formStatusEnum("status").default("draft").notNull(),
  schema_json: jsonb("schema_json").notNull(), // Form field definitions
  ui_schema_json: jsonb("ui_schema_json").notNull(), // UI layout and styling
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  published_at: timestamp("published_at"),
  published_by: uuid("published_by").references(() => users.id),
}, (table) => ({
  formVersionIdx: index("form_versions_form_version_idx").on(table.form_id, table.version),
  tenantIdx: index("form_versions_tenant_idx").on(table.tenant_id),
}));

// Form Data table - stores submitted form data
export const formData = pgTable("form_data", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  form_key: varchar("form_key", { length: 255 }).notNull(),
  form_version: integer("form_version").notNull(),
  process_id: uuid("process_id").references(() => processInstances.id),
  task_id: uuid("task_id").references(() => taskInstances.id),
  data_json: jsonb("data_json").notNull(), // Submitted form data
  created_by: uuid("created_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantFormIdx: index("form_data_tenant_form_idx").on(table.tenant_id, table.form_key),
  processTaskIdx: index("form_data_process_task_idx").on(table.process_id, table.task_id),
  createdByIdx: index("form_data_created_by_idx").on(table.created_by),
}));

// Workflows table - keeping existing structure but adding key field
export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 50 }).default("1.0.0").notNull(),
  status: workflowStatusEnum("status").default("draft").notNull(),
  bpmn_xml: text("bpmn_xml").notNull(), // Keep existing field, will store JSON DSL here
  config: jsonb("config").default({}),
  key: varchar("key", { length: 255 }), // Add key field for engine (nullable for backward compatibility)
  created_by: uuid("created_by").references(() => users.id).notNull(),
  published_at: timestamp("published_at"),
  is_deleted: boolean("is_deleted").default(false).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantStatusIdx: index("workflows_tenant_status_idx").on(table.tenant_id, table.status),
  tenantDeletedIdx: index("workflows_tenant_deleted_idx").on(table.tenant_id, table.is_deleted),
  tenantKeyIdx: index("workflows_tenant_key_idx").on(table.tenant_id, table.key),
}));

// Workflow Versions table
export const workflowVersions = pgTable("workflow_versions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  workflow_id: uuid("workflow_id").references(() => workflows.id).notNull(),
  version: integer("version").notNull(),
  definition_json: jsonb("definition_json").notNull(), // JSON DSL format
  status: workflowVersionStatusEnum("status").default("draft").notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  published_by: uuid("published_by").references(() => users.id),
}, (table) => ({
  workflowVersionIdx: index("workflow_versions_workflow_version_idx").on(table.workflow_id, table.version),
  tenantIdx: index("workflow_versions_tenant_idx").on(table.tenant_id),
}));

// Process Instances table - keeping existing structure but adding workflow_version
export const processInstances = pgTable("process_instances", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  workflow_id: uuid("workflow_id").references(() => workflows.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: processStatusEnum("status").default("running").notNull(),
  variables: jsonb("variables").default({}), // Keep existing field name
  workflow_version: integer("workflow_version").default(1), // Add new field (nullable for backward compatibility)
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

// Task Instances table - keeping existing structure but adding engine fields
export const taskInstances = pgTable("task_instances", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  process_id: uuid("process_id").references(() => processInstances.id).notNull(),
  task_key: varchar("task_key", { length: 255 }).notNull(), // Keep existing BPMN element ID
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  form_id: uuid("form_id").references(() => forms.id),
  assignee_id: uuid("assignee_id").references(() => users.id), // Keep existing field name
  status: taskStatusEnum("status").default("pending").notNull(), // Update enum values but keep default
  priority: integer("priority").default(1).notNull(),
  due_date: timestamp("due_date"), // Keep existing field name
  form_data: jsonb("form_data").default({}), // Keep existing field name
  outcome: varchar("outcome", { length: 100 }),
  completed_by: uuid("completed_by").references(() => users.id),
  completed_at: timestamp("completed_at"),
  // Add engine fields
  type: taskTypeEnum("type"), // Add new field (nullable for backward compatibility)
  assignee_role: userRoleEnum("assignee_role"), // Add new field (nullable)
  sla_hours: integer("sla_hours"), // Add new field (nullable)
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantStatusIdx: index("task_instances_tenant_status_idx").on(table.tenant_id, table.status),
  processIdx: index("task_instances_process_idx").on(table.process_id),
  assigneeIdx: index("task_instances_assignee_idx").on(table.assignee_id),
  assigneeStatusIdx: index("task_instances_assignee_status_idx").on(table.assignee_id, table.status),
}));

// Engine Jobs table
export const engineJobs = pgTable("engine_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: uuid("tenant_id").references(() => tenants.id).notNull(),
  process_id: uuid("process_id").references(() => processInstances.id).notNull(),
  task_id: uuid("task_id").references(() => taskInstances.id),
  kind: jobKindEnum("kind").notNull(),
  run_at: timestamp("run_at").default(sql`now()`).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  max_attempts: integer("max_attempts").default(3).notNull(),
  status: jobStatusEnum("status").default("queued").notNull(),
  payload_json: jsonb("payload_json").default({}),
  idempotency_key: varchar("idempotency_key", { length: 255 }),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  tenantIdx: index("engine_jobs_tenant_idx").on(table.tenant_id),
  runAtStatusIdx: index("engine_jobs_run_at_status_idx").on(table.run_at, table.status),
  processIdx: index("engine_jobs_process_idx").on(table.process_id),
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
  formVersions: many(formVersions),
  formData: many(formData),
  workflows: many(workflows),
  workflowVersions: many(workflowVersions),
  processInstances: many(processInstances),
  taskInstances: many(taskInstances),
  engineJobs: many(engineJobs),
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
  versions: many(formVersions),
  taskInstances: many(taskInstances),
}));

export const formVersionsRelations = relations(formVersions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [formVersions.tenant_id],
    references: [tenants.id],
  }),
  form: one(forms, {
    fields: [formVersions.form_id],
    references: [forms.id],
  }),
  publishedBy: one(users, {
    fields: [formVersions.published_by],
    references: [users.id],
  }),
}));

export const formDataRelations = relations(formData, ({ one }) => ({
  tenant: one(tenants, {
    fields: [formData.tenant_id],
    references: [tenants.id],
  }),
  processInstance: one(processInstances, {
    fields: [formData.process_id],
    references: [processInstances.id],
  }),
  taskInstance: one(taskInstances, {
    fields: [formData.task_id],
    references: [taskInstances.id],
  }),
  createdBy: one(users, {
    fields: [formData.created_by],
    references: [users.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [workflows.tenant_id],
    references: [tenants.id],
  }),
  versions: many(workflowVersions),
  processInstances: many(processInstances),
}));

export const workflowVersionsRelations = relations(workflowVersions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [workflowVersions.tenant_id],
    references: [tenants.id],
  }),
  workflow: one(workflows, {
    fields: [workflowVersions.workflow_id],
    references: [workflows.id],
  }),
  publishedBy: one(users, {
    fields: [workflowVersions.published_by],
    references: [users.id],
  }),
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
  engineJobs: many(engineJobs),
}));

export const engineJobsRelations = relations(engineJobs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [engineJobs.tenant_id],
    references: [tenants.id],
  }),
  processInstance: one(processInstances, {
    fields: [engineJobs.process_id],
    references: [processInstances.id],
  }),
  taskInstance: one(taskInstances, {
    fields: [engineJobs.task_id],
    references: [taskInstances.id],
  }),
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
});

export const insertFormVersionSchema = createInsertSchema(formVersions).omit({
  id: true,
  created_at: true,
  published_at: true,
});

export const insertFormDataSchema = createInsertSchema(formData).omit({
  id: true,
  created_at: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  created_at: true,
  published_at: true,
});

export const insertWorkflowVersionSchema = createInsertSchema(workflowVersions).omit({
  id: true,
  created_at: true,
});

export const insertProcessInstanceSchema = createInsertSchema(processInstances).omit({
  id: true,
  started_at: true,
  completed_at: true,
});

export const insertTaskInstanceSchema = createInsertSchema(taskInstances).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertEngineJobSchema = createInsertSchema(engineJobs).omit({
  id: true,
  created_at: true,
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

export type FormVersion = typeof formVersions.$inferSelect;
export type InsertFormVersion = z.infer<typeof insertFormVersionSchema>;

export type FormData = typeof formData.$inferSelect;
export type InsertFormData = z.infer<typeof insertFormDataSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowVersion = typeof workflowVersions.$inferSelect;
export type InsertWorkflowVersion = z.infer<typeof insertWorkflowVersionSchema>;

export type ProcessInstance = typeof processInstances.$inferSelect;
export type InsertProcessInstance = z.infer<typeof insertProcessInstanceSchema>;

export type TaskInstance = typeof taskInstances.$inferSelect;
export type InsertTaskInstance = z.infer<typeof insertTaskInstanceSchema>;

export type EngineJob = typeof engineJobs.$inferSelect;
export type InsertEngineJob = z.infer<typeof insertEngineJobSchema>;

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
