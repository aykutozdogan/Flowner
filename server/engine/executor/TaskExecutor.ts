import { ProcessStateManager } from '../runtime/ProcessStateManager';
import type { JobPayload, ExecutionContext } from '../index';

export class TaskExecutor {
  private stateManager: ProcessStateManager;

  constructor() {
    this.stateManager = new ProcessStateManager();
  }

  async executeServiceTask(payload: JobPayload, context: ExecutionContext): Promise<void> {
    console.log(`[TaskExecutor] Executing service task: ${payload.elementId}`);
    
    try {
      const { serviceType, config } = payload.data || {};
      
      switch (serviceType) {
        case 'http':
          await this.executeHttpService(config, context);
          break;
        case 'email':
          await this.executeEmailService(config, context);
          break;
        case 'timer':
          await this.executeTimerService(config, context);
          break;
        default:
          console.log(`[TaskExecutor] Unknown service type: ${serviceType}, completing task`);
          break;
      }

      // Mark service task as completed
      if (payload.type === 'service_exec') {
        // Update task status (assuming we have task ID in context)
        console.log(`[TaskExecutor] Service task ${payload.elementId} completed successfully`);
      }
    } catch (error) {
      console.error(`[TaskExecutor] Service task failed: ${payload.elementId}`, error);
      
      // Schedule retry if not at max attempts
      await this.scheduleRetry(payload, context, error);
    }
  }

  private async executeHttpService(config: any, context: ExecutionContext): Promise<void> {
    console.log('[TaskExecutor] Executing HTTP service call');
    
    if (!config?.url) {
      throw new Error('HTTP service requires URL configuration');
    }

    const options: RequestInit = {
      method: config.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    if (config.body) {
      options.body = JSON.stringify(this.interpolateVariables(config.body, context.variables));
    }

    const response = await fetch(config.url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP service call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json().catch(() => ({}));
    console.log('[TaskExecutor] HTTP service call completed:', result);
  }

  private async executeEmailService(config: any, context: ExecutionContext): Promise<void> {
    console.log('[TaskExecutor] Executing email service');
    
    // For MVP, just log the email action
    const emailData = {
      to: this.interpolateVariables(config.to, context.variables),
      subject: this.interpolateVariables(config.subject, context.variables),
      body: this.interpolateVariables(config.body, context.variables),
    };
    
    console.log('[TaskExecutor] Email would be sent:', emailData);
  }

  private async executeTimerService(config: any, context: ExecutionContext): Promise<void> {
    console.log('[TaskExecutor] Executing timer service');
    
    const delayMs = config.delayMs || 5000;
    console.log(`[TaskExecutor] Timer delay: ${delayMs}ms`);
    
    // For MVP, simulate delay
    await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 1000))); // Cap at 1s for demo
  }

  private async scheduleRetry(payload: JobPayload, context: ExecutionContext, error: any): Promise<void> {
    console.log(`[TaskExecutor] Scheduling retry for ${payload.elementId}`);
    
    // Schedule retry job with exponential backoff
    const retryDelay = Math.min(Math.pow(2, (payload.data?.attempts || 0)) * 1000, 60000); // Max 60s
    
    await this.stateManager.scheduleJob({
      tenantId: context.tenantId,
      processId: context.processId,
      kind: 'retry',
      runAt: new Date(Date.now() + retryDelay),
      payloadJson: {
        ...payload,
        data: {
          ...payload.data,
          attempts: (payload.data?.attempts || 0) + 1,
          lastError: error.message,
        },
      },
      idempotencyKey: `retry-${payload.elementId}-${Date.now()}`,
    });
  }

  private interpolateVariables(template: string, variables: Record<string, any>): string {
    if (typeof template !== 'string') return template;
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key]?.toString() || match;
    });
  }

  async assignUserTask(taskId: string, tenantId: string, assigneeId: string): Promise<void> {
    console.log(`[TaskExecutor] Assigning task ${taskId} to user ${assigneeId}`);
    
    await this.stateManager.updateTaskStatus(taskId, tenantId, 'assigned');
  }

  async completeUserTask(data: {
    taskId: string;
    tenantId: string;
    userId: string;
    outcome?: string;
    formData?: any;
  }): Promise<void> {
    console.log(`[TaskExecutor] Completing user task ${data.taskId}`);
    
    await this.stateManager.updateTaskStatus(
      data.taskId,
      data.tenantId,
      'completed',
      data.outcome,
      data.userId,
      data.formData
    );
  }
}