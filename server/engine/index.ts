// Main Workflow Engine exports
export { ProcessRuntime } from './runtime/ProcessRuntime';
export { ProcessStateManager } from './runtime/ProcessStateManager';
export { BpmnExecutor } from './runtime/BpmnExecutor';

export { TaskExecutor } from './executor/TaskExecutor';
export { GatewayExecutor } from './executor/GatewayExecutor';
export { EventExecutor } from './executor/EventExecutor';

export { JobScheduler } from './scheduler/JobScheduler';
export { JobExecutor } from './scheduler/JobExecutor';
export { JobQueue, type QueuedJob } from './scheduler/JobQueue';

// Types
export interface ProcessVariables {
  [key: string]: any;
}

export interface BpmnElement {
  id: string;
  type: 'start-event' | 'user-task' | 'service-task' | 'exclusive-gateway' | 'parallel-gateway' | 'end-event';
  name?: string;
  properties?: Record<string, any>;
  incoming?: string[];
  outgoing?: string[];
}

export interface BpmnDefinition {
  id: string;
  name: string;
  elements: BpmnElement[];
  sequenceFlows: Array<{
    id: string;
    sourceRef: string;
    targetRef: string;
    condition?: string;
  }>;
}

export interface ExecutionContext {
  tenantId: string;
  processId: string;
  userId: string;
  variables: ProcessVariables;
}

export interface JobPayload {
  type: 'service_exec' | 'timer' | 'retry';
  elementId: string;
  processId: string;
  data?: any;
}