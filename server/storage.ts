import { 
  tenants, users, forms, workflows, processInstances, taskInstances, auditLogs, fileAttachments,
  type Tenant, type User, type Form, type Workflow, type ProcessInstance, type TaskInstance,
  type InsertTenant, type InsertUser, type InsertForm, type InsertWorkflow,
  type InsertProcessInstance, type InsertTaskInstance, type UserWithTenant
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // Auth & Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string, tenantId: string): Promise<User | undefined>;
  getUserWithTenant(id: string): Promise<UserWithTenant | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;

  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantByDomain(domain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;

  // Forms
  getForms(tenantId: string, filters?: { status?: string; search?: string }): Promise<Form[]>;
  getForm(id: string, tenantId: string): Promise<Form | undefined>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: string, tenantId: string, updates: Partial<InsertForm>): Promise<Form | undefined>;
  publishForm(id: string, tenantId: string, versionNotes?: string): Promise<Form | undefined>;
  deleteForm(id: string, tenantId: string): Promise<boolean>;

  // Workflows
  getWorkflows(tenantId: string, filters?: { status?: string }): Promise<Workflow[]>;
  getWorkflow(id: string, tenantId: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, tenantId: string, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  publishWorkflow(id: string, tenantId: string, versionNotes?: string): Promise<Workflow | undefined>;

  // Process Instances
  getProcessInstances(tenantId: string, filters?: { status?: string; userId?: string }): Promise<ProcessInstance[]>;
  getProcessInstance(id: string, tenantId: string): Promise<ProcessInstance | undefined>;
  createProcessInstance(processInstance: InsertProcessInstance): Promise<ProcessInstance>;
  updateProcessInstance(id: string, tenantId: string, updates: Partial<ProcessInstance>): Promise<ProcessInstance | undefined>;

  // Task Instances
  getTaskInstances(tenantId: string, filters?: { status?: string; assigneeId?: string }): Promise<TaskInstance[]>;
  getTaskInstance(id: string, tenantId: string): Promise<TaskInstance | undefined>;
  createTaskInstance(taskInstance: InsertTaskInstance): Promise<TaskInstance>;
  updateTaskInstance(id: string, tenantId: string, updates: Partial<TaskInstance>): Promise<TaskInstance | undefined>;
  completeTask(id: string, tenantId: string, outcome: string, formData: any, completedBy: string): Promise<TaskInstance | undefined>;

  // Dashboard Analytics
  getDashboardStats(tenantId: string): Promise<{
    activeProcesses: number;
    pendingTasks: number;
    completedToday: number;
    avgDuration: string;
  }>;

  // Audit Logging
  createAuditLog(log: {
    tenant_id: string;
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    details?: any;
    ip_address?: string;
    user_agent?: string;
    trace_id?: string;
  }): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  
  // Auth & Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string, tenantId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.tenant_id, tenantId)));
    return user || undefined;
  }

  async getUserWithTenant(id: string): Promise<UserWithTenant | undefined> {
    const [result] = await db.select()
      .from(users)
      .leftJoin(tenants, eq(users.tenant_id, tenants.id))
      .where(eq(users.id, id));
    
    if (!result || !result.tenants) return undefined;
    
    return {
      ...result.users,
      tenant: result.tenants
    } as UserWithTenant;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users)
      .set({ last_login: sql`now()`, updated_at: sql`now()` })
      .where(eq(users.id, id));
  }

  // Tenants
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
    return tenant || undefined;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  // Forms
  async getForms(tenantId: string, filters?: { status?: string; search?: string }): Promise<Form[]> {
    let query = db.select().from(forms)
      .where(and(
        eq(forms.tenant_id, tenantId),
        eq(forms.is_deleted, false)
      ))
      .orderBy(desc(forms.updated_at));

    if (filters?.status) {
      return await db.select().from(forms)
        .where(and(
          eq(forms.tenant_id, tenantId),
          eq(forms.is_deleted, false),
          eq(forms.status, filters.status as any)
        ))
        .orderBy(desc(forms.updated_at));
    }

    return await query;
  }

  async getForm(id: string, tenantId: string): Promise<Form | undefined> {
    const [form] = await db.select().from(forms)
      .where(and(
        eq(forms.id, id),
        eq(forms.tenant_id, tenantId),
        eq(forms.is_deleted, false)
      ));
    return form || undefined;
  }

  async createForm(form: InsertForm): Promise<Form> {
    const [newForm] = await db.insert(forms).values(form).returning();
    return newForm;
  }

  async updateForm(id: string, tenantId: string, updates: Partial<InsertForm>): Promise<Form | undefined> {
    const [updatedForm] = await db.update(forms)
      .set({ ...updates, updated_at: sql`now()` })
      .where(and(
        eq(forms.id, id),
        eq(forms.tenant_id, tenantId),
        eq(forms.is_deleted, false)
      ))
      .returning();
    return updatedForm || undefined;
  }

  async publishForm(id: string, tenantId: string, versionNotes?: string): Promise<Form | undefined> {
    const [publishedForm] = await db.update(forms)
      .set({ 
        status: "published", 
        published_at: sql`now()`,
        updated_at: sql`now()` 
      })
      .where(and(
        eq(forms.id, id),
        eq(forms.tenant_id, tenantId),
        eq(forms.is_deleted, false)
      ))
      .returning();
    return publishedForm || undefined;
  }

  async deleteForm(id: string, tenantId: string): Promise<boolean> {
    const result = await db.update(forms)
      .set({ is_deleted: true, updated_at: sql`now()` })
      .where(and(
        eq(forms.id, id),
        eq(forms.tenant_id, tenantId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  // Workflows
  async getWorkflows(tenantId: string, filters?: { status?: string }): Promise<Workflow[]> {
    let query = db.select().from(workflows)
      .where(and(
        eq(workflows.tenant_id, tenantId),
        eq(workflows.is_deleted, false)
      ))
      .orderBy(desc(workflows.updated_at));

    if (filters?.status) {
      return await db.select().from(workflows)
        .where(and(
          eq(workflows.tenant_id, tenantId),
          eq(workflows.is_deleted, false),
          eq(workflows.status, filters.status as any)
        ))
        .orderBy(desc(workflows.updated_at));
    }

    return await query;
  }

  async getWorkflow(id: string, tenantId: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows)
      .where(and(
        eq(workflows.id, id),
        eq(workflows.tenant_id, tenantId),
        eq(workflows.is_deleted, false)
      ));
    return workflow || undefined;
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db.insert(workflows).values(workflow).returning();
    return newWorkflow;
  }

  async updateWorkflow(id: string, tenantId: string, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [updatedWorkflow] = await db.update(workflows)
      .set({ ...updates, updated_at: sql`now()` })
      .where(and(
        eq(workflows.id, id),
        eq(workflows.tenant_id, tenantId),
        eq(workflows.is_deleted, false)
      ))
      .returning();
    return updatedWorkflow || undefined;
  }

  async publishWorkflow(id: string, tenantId: string, versionNotes?: string): Promise<Workflow | undefined> {
    const [publishedWorkflow] = await db.update(workflows)
      .set({ 
        status: "published", 
        published_at: sql`now()`,
        updated_at: sql`now()` 
      })
      .where(and(
        eq(workflows.id, id),
        eq(workflows.tenant_id, tenantId),
        eq(workflows.is_deleted, false)
      ))
      .returning();
    return publishedWorkflow || undefined;
  }

  // Process Instances
  async getProcessInstances(tenantId: string, filters?: { status?: string; userId?: string }): Promise<ProcessInstance[]> {
    let query = db.select().from(processInstances)
      .where(eq(processInstances.tenant_id, tenantId))
      .orderBy(desc(processInstances.started_at));

    if (filters?.status && filters?.userId) {
      return await db.select().from(processInstances)
        .where(and(
          eq(processInstances.tenant_id, tenantId),
          eq(processInstances.status, filters.status as any),
          eq(processInstances.started_by, filters.userId)
        ))
        .orderBy(desc(processInstances.started_at));
    }

    if (filters?.status) {
      return await db.select().from(processInstances)
        .where(and(
          eq(processInstances.tenant_id, tenantId),
          eq(processInstances.status, filters.status as any)
        ))
        .orderBy(desc(processInstances.started_at));
    }

    if (filters?.userId) {
      return await db.select().from(processInstances)
        .where(and(
          eq(processInstances.tenant_id, tenantId),
          eq(processInstances.started_by, filters.userId)
        ))
        .orderBy(desc(processInstances.started_at));
    }

    return await query;
  }

  async getProcessInstance(id: string, tenantId: string): Promise<ProcessInstance | undefined> {
    const [processInstance] = await db.select().from(processInstances)
      .where(and(
        eq(processInstances.id, id),
        eq(processInstances.tenant_id, tenantId)
      ));
    return processInstance || undefined;
  }

  async createProcessInstance(processInstance: InsertProcessInstance): Promise<ProcessInstance> {
    const [newProcessInstance] = await db.insert(processInstances).values(processInstance).returning();
    return newProcessInstance;
  }

  async updateProcessInstance(id: string, tenantId: string, updates: Partial<ProcessInstance>): Promise<ProcessInstance | undefined> {
    const [updatedProcessInstance] = await db.update(processInstances)
      .set({ ...updates, updated_at: sql`now()` })
      .where(and(
        eq(processInstances.id, id),
        eq(processInstances.tenant_id, tenantId)
      ))
      .returning();
    return updatedProcessInstance || undefined;
  }

  // Task Instances
  async getTaskInstances(tenantId: string, filters?: { status?: string; assigneeId?: string }): Promise<TaskInstance[]> {
    let query = db.select().from(taskInstances)
      .where(eq(taskInstances.tenant_id, tenantId))
      .orderBy(desc(taskInstances.created_at));

    if (filters?.status && filters?.assigneeId) {
      return await db.select().from(taskInstances)
        .where(and(
          eq(taskInstances.tenant_id, tenantId),
          eq(taskInstances.status, filters.status as any),
          eq(taskInstances.assignee_id, filters.assigneeId)
        ))
        .orderBy(desc(taskInstances.created_at));
    }

    if (filters?.status) {
      return await db.select().from(taskInstances)
        .where(and(
          eq(taskInstances.tenant_id, tenantId),
          eq(taskInstances.status, filters.status as any)
        ))
        .orderBy(desc(taskInstances.created_at));
    }

    if (filters?.assigneeId) {
      return await db.select().from(taskInstances)
        .where(and(
          eq(taskInstances.tenant_id, tenantId),
          eq(taskInstances.assignee_id, filters.assigneeId)
        ))
        .orderBy(desc(taskInstances.created_at));
    }

    return await query;
  }

  async getTaskInstance(id: string, tenantId: string): Promise<TaskInstance | undefined> {
    const [taskInstance] = await db.select().from(taskInstances)
      .where(and(
        eq(taskInstances.id, id),
        eq(taskInstances.tenant_id, tenantId)
      ));
    return taskInstance || undefined;
  }

  async createTaskInstance(taskInstance: InsertTaskInstance): Promise<TaskInstance> {
    const [newTaskInstance] = await db.insert(taskInstances).values(taskInstance).returning();
    return newTaskInstance;
  }

  async updateTaskInstance(id: string, tenantId: string, updates: Partial<TaskInstance>): Promise<TaskInstance | undefined> {
    const [updatedTaskInstance] = await db.update(taskInstances)
      .set({ ...updates, updated_at: sql`now()` })
      .where(and(
        eq(taskInstances.id, id),
        eq(taskInstances.tenant_id, tenantId)
      ))
      .returning();
    return updatedTaskInstance || undefined;
  }

  async completeTask(id: string, tenantId: string, outcome: string, formData: any, completedBy: string): Promise<TaskInstance | undefined> {
    const [completedTask] = await db.update(taskInstances)
      .set({ 
        status: "completed",
        outcome,
        form_data: formData,
        completed_by: completedBy,
        completed_at: sql`now()`,
        updated_at: sql`now()` 
      })
      .where(and(
        eq(taskInstances.id, id),
        eq(taskInstances.tenant_id, tenantId)
      ))
      .returning();
    return completedTask || undefined;
  }

  // Dashboard Analytics
  async getDashboardStats(tenantId: string): Promise<{
    activeProcesses: number;
    pendingTasks: number;
    completedToday: number;
    avgDuration: string;
  }> {
    // Active processes count
    const [activeProcessesResult] = await db
      .select({ count: count() })
      .from(processInstances)
      .where(and(
        eq(processInstances.tenant_id, tenantId),
        eq(processInstances.status, "running")
      ));

    // Pending tasks count
    const [pendingTasksResult] = await db
      .select({ count: count() })
      .from(taskInstances)
      .where(and(
        eq(taskInstances.tenant_id, tenantId),
        eq(taskInstances.status, "pending")
      ));

    // Completed today count
    const [completedTodayResult] = await db
      .select({ count: count() })
      .from(taskInstances)
      .where(and(
        eq(taskInstances.tenant_id, tenantId),
        eq(taskInstances.status, "completed"),
        sql`DATE(completed_at) = CURRENT_DATE`
      ));

    // Average duration (simplified - just return placeholder)
    const avgDuration = "2.4h"; // TODO: Calculate actual average

    return {
      activeProcesses: activeProcessesResult?.count || 0,
      pendingTasks: pendingTasksResult?.count || 0,
      completedToday: completedTodayResult?.count || 0,
      avgDuration
    };
  }

  // Audit Logging
  async createAuditLog(log: {
    tenant_id: string;
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    details?: any;
    ip_address?: string;
    user_agent?: string;
    trace_id?: string;
  }): Promise<void> {
    await db.insert(auditLogs).values(log);
  }
}

export const storage = new DatabaseStorage();
