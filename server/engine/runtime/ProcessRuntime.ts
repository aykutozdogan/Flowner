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

    // Continue process flow (simplified for MVP)
    // In full implementation, this would trigger the next BPMN elements
    console.log(`[ProcessRuntime] Task ${data.taskId} completed`);
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