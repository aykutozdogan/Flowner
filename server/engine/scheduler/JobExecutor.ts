import type { QueuedJob } from './JobQueue';
import { TaskExecutor } from '../executor/TaskExecutor';
import { ProcessStateManager } from '../runtime/ProcessStateManager';
import { BpmnExecutor } from '../runtime/BpmnExecutor';
import type { JobPayload, ExecutionContext } from '../index';
import { db } from '../../db';
import { workflowVersions } from '../../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export class JobExecutor {
  private taskExecutor: TaskExecutor;
  private stateManager: ProcessStateManager;

  constructor() {
    this.taskExecutor = new TaskExecutor();
    this.stateManager = new ProcessStateManager();
  }

  async executeJob(job: QueuedJob): Promise<void> {
    console.log(`[JobExecutor] Executing job ${job.id} (${job.kind})`);
    
    const context: ExecutionContext = {
      tenantId: job.tenant_id,
      processId: job.process_id,
      userId: '', // Will be determined by job context
      variables: {}, // Will be loaded from process instance
    };

    // Load process context
    const processInstance = await this.stateManager.getProcessInstance(job.process_id, job.tenant_id);
    if (!processInstance) {
      throw new Error(`Process instance not found: ${job.process_id}`);
    }

    context.userId = processInstance.started_by;
    context.variables = processInstance.variables as any || {};

    const payloadData = job.payload_json as Record<string, any> || {};
    const payload: JobPayload = {
      type: job.kind as any,
      elementId: payloadData.elementId || '',
      processId: job.process_id,
      data: payloadData,
    };

    switch (job.kind) {
      case 'service_exec':
        await this.executeServiceJob(job, payload, context);
        break;
      case 'timer':
        await this.executeTimerJob(job, payload, context);
        break;
      case 'retry':
        await this.executeRetryJob(job, payload, context);
        break;
      default:
        console.warn(`[JobExecutor] Unknown job kind: ${job.kind}`);
    }
  }

  private async executeServiceJob(job: QueuedJob, payload: JobPayload, context: ExecutionContext): Promise<void> {
    console.log(`[JobExecutor] Executing service job for element: ${payload.elementId}`);
    
    try {
      await this.taskExecutor.executeServiceTask(payload, context);
      
      // Mark associated task as completed if exists
      if (job.task_id) {
        await this.stateManager.updateTaskStatus(
          job.task_id,
          job.tenant_id,
          'completed',
          'success'
        );
        
        // Continue process flow after service task completion
        console.log(`[JobExecutor] Service task ${job.task_id} completed successfully`);
        
        try {
          console.log(`[JobExecutor] Starting process flow continuation for element: ${payload.elementId}`);
          
          // Get process instance to get workflow ID
          const currentProcessInstance = await this.stateManager.getProcessInstance(job.process_id, job.tenant_id);
          if (!currentProcessInstance) {
            throw new Error(`Process instance not found: ${job.process_id}`);
          }
          
          console.log(`[JobExecutor] Found process instance with workflow ID: ${currentProcessInstance.workflow_id}`);
          
          // Get the workflow version to get BPMN definition
          const workflowVersion = await db.select().from(workflowVersions)
            .where(and(
              eq(workflowVersions.workflow_id, currentProcessInstance.workflow_id),
              eq(workflowVersions.tenant_id, currentProcessInstance.tenant_id),
              eq(workflowVersions.status, 'published')
            ))
            .orderBy(desc(workflowVersions.version))
            .limit(1);
            
          if (workflowVersion.length > 0) {
            const bpmnDefinition = workflowVersion[0].definition_json as any;
            
            // Find the current element and follow its outgoing flows
            const currentElement = bpmnDefinition.elements.find((e: any) => e.id === payload.elementId);
            if (currentElement?.outgoing) {
              const executor = new BpmnExecutor(this.stateManager);
              
              // Continue to next elements
              for (const flowId of currentElement.outgoing) {
                const flow = bpmnDefinition.sequenceFlows.find((f: any) => f.id === flowId);
                if (flow) {
                  const targetElement = bpmnDefinition.elements.find((e: any) => e.id === flow.targetRef);
                  if (targetElement) {
                    console.log(`[JobExecutor] Continuing process flow to element: ${targetElement.id}`);
                    await (executor as any).executeElement(targetElement, bpmnDefinition, context);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`[JobExecutor] Error continuing process flow:`, error);
        }
      }
    } catch (error) {
      console.error(`[JobExecutor] Service job failed:`, error);
      
      if (job.task_id) {
        await this.stateManager.updateTaskStatus(
          job.task_id,
          job.tenant_id,
          'cancelled',
          'error'
        );
      }
      
      throw error;
    }
  }

  private async executeTimerJob(job: QueuedJob, payload: JobPayload, context: ExecutionContext): Promise<void> {
    console.log(`[JobExecutor] Executing timer job for element: ${payload.elementId}`);
    
    const timerType = payload.data?.timerType || 'delay';
    
    switch (timerType) {
      case 'delay':
        console.log(`[JobExecutor] Timer delay completed for ${payload.elementId}`);
        // Continue process flow after timer
        break;
      case 'deadline':
        console.log(`[JobExecutor] Timer deadline reached for ${payload.elementId}`);
        // Handle deadline logic (e.g., escalate task, send notification)
        await this.handleTimerDeadline(job, context);
        break;
      case 'duration':
        console.log(`[JobExecutor] Timer duration expired for ${payload.elementId}`);
        // Handle duration expiry
        break;
      default:
        console.log(`[JobExecutor] Unknown timer type: ${timerType}`);
    }
  }

  private async executeRetryJob(job: QueuedJob, payload: JobPayload, context: ExecutionContext): Promise<void> {
    console.log(`[JobExecutor] Executing retry job for element: ${payload.elementId}`);
    
    const originalJobKind = payload.data?.originalKind || 'service_exec';
    const retryCount = payload.data?.retryCount || 0;
    
    console.log(`[JobExecutor] Retry attempt ${retryCount} for ${originalJobKind} job`);
    
    // Re-execute the original job logic
    switch (originalJobKind) {
      case 'service_exec':
        await this.executeServiceJob(job, payload, context);
        break;
      case 'timer':
        await this.executeTimerJob(job, payload, context);
        break;
      default:
        throw new Error(`Cannot retry unknown job kind: ${originalJobKind}`);
    }
  }

  private async handleTimerDeadline(job: QueuedJob, context: ExecutionContext): Promise<void> {
    console.log(`[JobExecutor] Handling timer deadline for process ${context.processId}`);
    
    // For MVP, just log the deadline event
    // In full implementation, this might:
    // - Escalate pending tasks
    // - Send notifications to supervisors
    // - Update task priorities
    // - Trigger alternative process paths
    
    if (job.task_id) {
      console.log(`[JobExecutor] Timer deadline reached for task ${job.task_id}`);
      
      // Example: Escalate task by updating priority
      // await this.stateManager.updateTaskPriority(job.task_id, job.tenant_id, 'high');
    }
  }

  async handleJobFailure(job: QueuedJob, error: Error): Promise<void> {
    console.error(`[JobExecutor] Job ${job.id} failed after ${job.attempts} attempts:`, error.message);
    
    // Update associated task if exists
    if (job.task_id) {
      await this.stateManager.updateTaskStatus(
        job.task_id,
        job.tenant_id,
        'cancelled',
        `Failed: ${error.message}`
      );
    }

    // For critical failures, might need to suspend or terminate the process
    const payloadData = job.payload_json as Record<string, any> || {};
    if (payloadData.critical) {
      console.log(`[JobExecutor] Critical job failed, considering process suspension`);
      // await this.stateManager.updateProcessStatus(job.process_id, job.tenant_id, 'suspended');
    }

    // Send notification about job failure
    await this.sendFailureNotification(job, error);
  }

  private async sendFailureNotification(job: QueuedJob, error: Error): Promise<void> {
    console.log(`[JobExecutor] Sending failure notification for job ${job.id}`);
    
    // For MVP, just log the notification
    // In full implementation, this would send email/SMS/webhook notifications
    const notification = {
      type: 'job_failure',
      jobId: job.id,
      processId: job.process_id,
      tenantId: job.tenant_id,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`[JobExecutor] Failure notification:`, notification);
  }

  async getJobExecutionStats(): Promise<{
    totalExecuted: number;
    successRate: number;
    averageExecutionTime: number;
  }> {
    // For MVP, return mock stats
    // In full implementation, this would track actual execution metrics
    return {
      totalExecuted: 0,
      successRate: 0.95,
      averageExecutionTime: 1500, // ms
    };
  }
}