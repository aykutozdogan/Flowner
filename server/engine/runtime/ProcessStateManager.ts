import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { processInstances, taskInstances, engineJobs, type ProcessInstance, type TaskInstance } from '@shared/schema';
import type { ProcessVariables } from '../index';

export class ProcessStateManager {
  async createProcessInstance(data: {
    tenantId: string;
    workflowId: string;
    workflowVersion: number;
    name: string;
    variables: ProcessVariables;
    startedBy: string;
  }): Promise<ProcessInstance> {
    const [instance] = await db
      .insert(processInstances)
      .values({
        tenant_id: data.tenantId,
        workflow_id: data.workflowId,
        workflow_version: data.workflowVersion,
        name: data.name,
        status: 'running',
        variables: data.variables,
        started_by: data.startedBy,
      })
      .returning();
    
    return instance;
  }

  async getProcessInstance(processId: string, tenantId: string): Promise<ProcessInstance | null> {
    const [instance] = await db
      .select()
      .from(processInstances)
      .where(and(
        eq(processInstances.id, processId),
        eq(processInstances.tenant_id, tenantId)
      ));
    
    return instance || null;
  }

  async updateProcessStatus(
    processId: string,
    tenantId: string,
    status: 'running' | 'completed' | 'cancelled' | 'suspended',
    variables?: ProcessVariables
  ): Promise<void> {
    const updateData: any = { status };
    if (variables) {
      updateData.variables = variables;
    }
    if (status === 'completed') {
      updateData.completed_at = new Date();
    }

    await db
      .update(processInstances)
      .set(updateData)
      .where(and(
        eq(processInstances.id, processId),
        eq(processInstances.tenant_id, tenantId)
      ));
  }

  async createTaskInstance(data: {
    tenantId: string;
    processId: string;
    taskKey: string;
    name: string;
    description?: string;
    type?: 'user' | 'service';
    assigneeRole?: string;
    formId?: string;
    slaHours?: number;
  }): Promise<TaskInstance> {
    const [task] = await db
      .insert(taskInstances)
      .values({
        tenant_id: data.tenantId,
        process_id: data.processId,
        task_key: data.taskKey,
        name: data.name,
        description: data.description,
        type: data.type,
        assignee_role: data.assigneeRole as any,
        form_id: data.formId,
        status: 'pending',
        sla_hours: data.slaHours,
        priority: 1,
        due_date: data.slaHours ? new Date(Date.now() + data.slaHours * 60 * 60 * 1000) : null,
      })
      .returning();
    
    return task;
  }

  async updateTaskStatus(
    taskId: string,
    tenantId: string,
    status: 'pending' | 'completed' | 'cancelled' | 'assigned',
    outcome?: string,
    completedBy?: string,
    formData?: any
  ): Promise<void> {
    const updateData: any = { status };
    if (outcome) updateData.outcome = outcome;
    if (formData) updateData.form_data = formData;
    if (completedBy) updateData.completed_by = completedBy;
    if (status === 'completed') {
      updateData.completed_at = new Date();
    }

    await db
      .update(taskInstances)
      .set(updateData)
      .where(and(
        eq(taskInstances.id, taskId),
        eq(taskInstances.tenant_id, tenantId)
      ));
  }

  async getActiveTasks(processId: string, tenantId: string): Promise<TaskInstance[]> {
    return await db
      .select()
      .from(taskInstances)
      .where(and(
        eq(taskInstances.process_id, processId),
        eq(taskInstances.tenant_id, tenantId),
        eq(taskInstances.status, 'pending')
      ));
  }

  async scheduleJob(data: {
    tenantId: string;
    processId: string;
    taskId?: string;
    kind: 'service_exec' | 'timer' | 'retry';
    runAt?: Date;
    payloadJson?: any;
    idempotencyKey?: string;
  }): Promise<void> {
    await db
      .insert(engineJobs)
      .values({
        tenant_id: data.tenantId,
        process_id: data.processId,
        task_id: data.taskId,
        kind: data.kind,
        run_at: data.runAt || new Date(),
        payload_json: data.payloadJson || {},
        idempotency_key: data.idempotencyKey,
      });
  }
}