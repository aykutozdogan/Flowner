import type { BpmnDefinition, BpmnElement, ExecutionContext } from '../index';
import { ProcessStateManager } from './ProcessStateManager';

export class BpmnExecutor {
  constructor(private stateManager: ProcessStateManager) {}

  async executeElement(element: BpmnElement, definition: BpmnDefinition, context: ExecutionContext): Promise<void> {
    console.log(`[BpmnExecutor] Executing element: ${element.id} (${element.type})`);

    switch (element.type) {
      case 'start-event':
        await this.executeStartEvent(element, definition, context);
        break;
      case 'user-task':
        await this.executeUserTask(element, definition, context);
        break;
      case 'service-task':
        await this.executeServiceTask(element, definition, context);
        break;
      case 'exclusive-gateway':
        await this.executeExclusiveGateway(element, definition, context);
        break;
      case 'parallel-gateway':
        await this.executeParallelGateway(element, definition, context);
        break;
      case 'end-event':
        await this.executeEndEvent(element, definition, context);
        break;
      default:
        console.warn(`[BpmnExecutor] Unknown element type: ${element.type}`);
    }
  }

  private async executeStartEvent(element: BpmnElement, definition: BpmnDefinition, context: ExecutionContext): Promise<void> {
    console.log(`[BpmnExecutor] Start event: ${element.id}`);
    
    // Follow outgoing sequence flows
    await this.followSequenceFlows(element.outgoing || [], definition, context);
  }

  private async executeUserTask(element: BpmnElement, definition: BpmnDefinition, context: ExecutionContext): Promise<void> {
    console.log(`[BpmnExecutor] User task: ${element.id}`);
    
    // Create task instance
    await this.stateManager.createTaskInstance({
      tenantId: context.tenantId,
      processId: context.processId,
      taskKey: element.id,
      name: element.name || element.id,
      description: element.properties?.description,
      type: 'user',
      assigneeRole: element.properties?.assigneeRole,
      formId: element.properties?.formId,
      slaHours: element.properties?.slaHours ? parseInt(element.properties.slaHours) : undefined,
    });

    // User task waits for external completion (via API)
    // No automatic flow continuation
  }

  private async executeServiceTask(element: BpmnElement, definition: BpmnDefinition, context: ExecutionContext): Promise<void> {
    console.log(`[BpmnExecutor] Service task: ${element.id}`);
    
    // Create task instance for tracking
    const task = await this.stateManager.createTaskInstance({
      tenantId: context.tenantId,
      processId: context.processId,
      taskKey: element.id,
      name: element.name || element.id,
      type: 'service',
    });

    // Schedule service execution job
    await this.stateManager.scheduleJob({
      tenantId: context.tenantId,
      processId: context.processId,
      taskId: task.id,
      kind: 'service_exec',
      payloadJson: {
        elementId: element.id,
        serviceType: element.properties?.serviceType,
        config: element.properties?.config,
      },
      idempotencyKey: `service-${task.id}`,
    });
  }

  private async executeExclusiveGateway(element: BpmnElement, definition: BpmnDefinition, context: ExecutionContext): Promise<void> {
    console.log(`[BpmnExecutor] Exclusive gateway: ${element.id}`);
    
    // For MVP, take first outgoing flow
    // In full implementation, evaluate conditions on sequence flows
    const outgoing = element.outgoing || [];
    if (outgoing.length > 0) {
      await this.followSequenceFlow(outgoing[0], definition, context);
    }
  }

  private async executeParallelGateway(element: BpmnElement, definition: BpmnDefinition, context: ExecutionContext): Promise<void> {
    console.log(`[BpmnExecutor] Parallel gateway: ${element.id}`);
    
    // For MVP, follow all outgoing flows
    // In full implementation, handle parallel token semantics
    await this.followSequenceFlows(element.outgoing || [], definition, context);
  }

  private async executeEndEvent(element: BpmnElement, definition: BpmnDefinition, context: ExecutionContext): Promise<void> {
    console.log(`[BpmnExecutor] End event: ${element.id}`);
    
    // Complete the process
    await this.stateManager.updateProcessStatus(context.processId, context.tenantId, 'completed');
  }

  private async followSequenceFlows(flowIds: string[], definition: BpmnDefinition, context: ExecutionContext): Promise<void> {
    for (const flowId of flowIds) {
      await this.followSequenceFlow(flowId, definition, context);
    }
  }

  private async followSequenceFlow(flowId: string, definition: BpmnDefinition, context: ExecutionContext): Promise<void> {
    const flow = definition.sequenceFlows.find(f => f.id === flowId);
    if (!flow) {
      console.warn(`[BpmnExecutor] Sequence flow not found: ${flowId}`);
      return;
    }

    const targetElement = definition.elements.find(e => e.id === flow.targetRef);
    if (!targetElement) {
      console.warn(`[BpmnExecutor] Target element not found: ${flow.targetRef}`);
      return;
    }

    // Execute target element
    await this.executeElement(targetElement, definition, context);
  }
}