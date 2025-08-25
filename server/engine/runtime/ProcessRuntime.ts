import type { BpmnDefinition, ExecutionContext, ProcessVariables } from '../index';
import { ProcessStateManager } from './ProcessStateManager';
import { BpmnExecutor } from './BpmnExecutor';
import type { ProcessInstance } from '@shared/schema';

export class ProcessRuntime {
  private stateManager: ProcessStateManager;
  private bpmnExecutor: BpmnExecutor;

  constructor() {
    this.stateManager = new ProcessStateManager();
    this.bpmnExecutor = new BpmnExecutor(this.stateManager);
  }

  async startProcess(data: {
    tenantId: string;
    workflowId: string;
    workflowVersion: number;
    bpmnDefinition: BpmnDefinition;
    name: string;
    variables: ProcessVariables;
    startedBy: string;
  }): Promise<ProcessInstance> {
    console.log(`[ProcessRuntime] Starting process: ${data.name}`);
    
    // Create process instance
    const instance = await this.stateManager.createProcessInstance({
      tenantId: data.tenantId,
      workflowId: data.workflowId,
      workflowVersion: data.workflowVersion,
      name: data.name,
      variables: data.variables,
      startedBy: data.startedBy,
    });

    // Create execution context
    const context: ExecutionContext = {
      tenantId: data.tenantId,
      processId: instance.id,
      userId: data.startedBy,
      variables: data.variables,
    };

    // Start execution from start event
    const startEvents = data.bpmnDefinition.elements.filter(e => e.type === 'start-event');
    if (startEvents.length === 0) {
      throw new Error('No start event found in BPMN definition');
    }

    // Execute start event
    await this.bpmnExecutor.executeElement(startEvents[0], data.bpmnDefinition, context);
    
    console.log(`[ProcessRuntime] Process started with ID: ${instance.id}`);
    return instance;
  }

  async continueProcess(processId: string, tenantId: string, elementId: string, outcome?: string): Promise<void> {
    console.log(`[ProcessRuntime] Continuing process ${processId} from element ${elementId}`);
    
    const instance = await this.stateManager.getProcessInstance(processId, tenantId);
    if (!instance || instance.status !== 'running') {
      throw new Error(`Process ${processId} is not running`);
    }

    // Note: In a full implementation, we would load the BPMN definition from workflow_versions
    // For MVP, we'll implement basic continuation logic
    
    const context: ExecutionContext = {
      tenantId,
      processId,
      userId: instance.started_by,
      variables: instance.variables as ProcessVariables,
    };

    // For MVP, we assume simple linear flow after task completion
    // In real implementation, this would parse BPMN and follow sequence flows
    console.log(`[ProcessRuntime] Process continuation completed for ${processId}`);
  }

  async completeTask(data: {
    taskId: string;
    tenantId: string;
    userId: string;
    outcome?: string;
    formData?: any;
  }): Promise<void> {
    console.log(`[ProcessRuntime] Completing task ${data.taskId}`);
    
    await this.stateManager.updateTaskStatus(
      data.taskId,
      data.tenantId,
      'completed',
      data.outcome,
      data.userId,
      data.formData
    );

    // TODO: Update process variables with task outcome (temporarily disabled)
    console.log(`[ProcessRuntime] Task outcome: ${data.outcome} - variables update temporarily disabled`);

    // Continue process flow after task completion
    console.log(`[ProcessRuntime] Task ${data.taskId} completed, continuing process flow`);
    
    try {
      // Get task and process details via storage
      const { storage } = await import('../../storage');
      const task = await storage.getTaskInstanceById(data.taskId, data.tenantId);
      if (task) {
        const processInstance = await this.stateManager.getProcessInstance(task.process_id, data.tenantId);
        if (processInstance) {
          // Get workflow definition
          const { db } = await import('../../db');
          const { workflowVersions } = await import('@shared/schema');
          const { eq, and, desc } = await import('drizzle-orm');
          
          const workflowVersion = await db.select().from(workflowVersions)
            .where(and(
              eq(workflowVersions.workflow_id, processInstance.workflow_id),
              eq(workflowVersions.tenant_id, processInstance.tenant_id),
              eq(workflowVersions.status, 'published')
            ))
            .orderBy(desc(workflowVersions.version))
            .limit(1);
            
          if (workflowVersion.length > 0) {
            const bpmnDefinition = workflowVersion[0].definition_json as any;
            
            // Find current element and continue to next elements
            const currentElement = bpmnDefinition.elements.find((e: any) => e.id === task.task_key);
            if (currentElement?.outgoing) {
              const context = {
                processId: task.process_id,
                tenantId: data.tenantId,
                variables: processInstance.variables || {}
              };
              
              const { BpmnExecutor } = await import('../runtime/BpmnExecutor');
              const executor = new BpmnExecutor(this.stateManager);
              
              // Continue to next elements
              for (const flowId of currentElement.outgoing) {
                const flow = bpmnDefinition.sequenceFlows.find((f: any) => f.id === flowId);
                if (flow) {
                  const targetElement = bpmnDefinition.elements.find((e: any) => e.id === flow.targetRef);
                  if (targetElement) {
                    console.log(`[ProcessRuntime] Continuing to element: ${targetElement.id}`);
                    await (executor as any).executeElement(targetElement, bpmnDefinition, context);
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`[ProcessRuntime] Error continuing process flow after task completion:`, error);
    }
  }

  async suspendProcess(processId: string, tenantId: string): Promise<void> {
    console.log(`[ProcessRuntime] Suspending process ${processId}`);
    await this.stateManager.updateProcessStatus(processId, tenantId, 'suspended');
  }

  async resumeProcess(processId: string, tenantId: string): Promise<void> {
    console.log(`[ProcessRuntime] Resuming process ${processId}`);
    await this.stateManager.updateProcessStatus(processId, tenantId, 'running');
  }

  async cancelProcess(processId: string, tenantId: string): Promise<void> {
    console.log(`[ProcessRuntime] Cancelling process ${processId}`);
    await this.stateManager.updateProcessStatus(processId, tenantId, 'cancelled');
  }
}