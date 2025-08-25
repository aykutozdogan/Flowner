import type { BpmnElement, BpmnDefinition, ExecutionContext } from '../index';
import { ProcessStateManager } from '../runtime/ProcessStateManager';

export class EventExecutor {
  private stateManager: ProcessStateManager;

  constructor() {
    this.stateManager = new ProcessStateManager();
  }

  async executeStartEvent(
    element: BpmnElement,
    definition: BpmnDefinition,
    context: ExecutionContext
  ): Promise<void> {
    console.log(`[EventExecutor] Executing start event: ${element.id}`);
    
    const eventType = element.properties?.eventType || 'none';
    
    switch (eventType) {
      case 'none':
        await this.executeNoneStartEvent(element, context);
        break;
      case 'timer':
        await this.executeTimerStartEvent(element, context);
        break;
      case 'message':
        await this.executeMessageStartEvent(element, context);
        break;
      case 'signal':
        await this.executeSignalStartEvent(element, context);
        break;
      default:
        console.log(`[EventExecutor] Unknown start event type: ${eventType}, treating as none`);
        await this.executeNoneStartEvent(element, context);
    }
  }

  async executeEndEvent(
    element: BpmnElement,
    definition: BpmnDefinition,
    context: ExecutionContext
  ): Promise<void> {
    console.log(`[EventExecutor] Executing end event: ${element.id}`);
    
    const eventType = element.properties?.eventType || 'none';
    
    switch (eventType) {
      case 'none':
        await this.executeNoneEndEvent(element, context);
        break;
      case 'message':
        await this.executeMessageEndEvent(element, context);
        break;
      case 'error':
        await this.executeErrorEndEvent(element, context);
        break;
      case 'terminate':
        await this.executeTerminateEndEvent(element, context);
        break;
      default:
        console.log(`[EventExecutor] Unknown end event type: ${eventType}, treating as none`);
        await this.executeNoneEndEvent(element, context);
    }
  }

  async executeIntermediateEvent(
    element: BpmnElement,
    definition: BpmnDefinition,
    context: ExecutionContext
  ): Promise<void> {
    console.log(`[EventExecutor] Executing intermediate event: ${element.id}`);
    
    const eventType = element.properties?.eventType || 'none';
    const isCatching = element.properties?.catching !== false;
    
    if (isCatching) {
      await this.executeCatchingEvent(element, eventType, context);
    } else {
      await this.executeThrowingEvent(element, eventType, context);
    }
  }

  private async executeNoneStartEvent(element: BpmnElement, context: ExecutionContext): Promise<void> {
    console.log(`[EventExecutor] None start event - process initiated`);
    // Nothing special to do - process is already started
  }

  private async executeTimerStartEvent(element: BpmnElement, context: ExecutionContext): Promise<void> {
    console.log(`[EventExecutor] Timer start event`);
    
    const timerConfig = element.properties?.timerConfig;
    if (timerConfig?.delay) {
      // For MVP, log the timer but don't actually delay
      console.log(`[EventExecutor] Timer delay configured: ${timerConfig.delay}`);
    }
  }

  private async executeMessageStartEvent(element: BpmnElement, context: ExecutionContext): Promise<void> {
    console.log(`[EventExecutor] Message start event`);
    
    const messageConfig = element.properties?.messageConfig;
    if (messageConfig) {
      console.log(`[EventExecutor] Message trigger: ${messageConfig.messageName}`);
    }
  }

  private async executeSignalStartEvent(element: BpmnElement, context: ExecutionContext): Promise<void> {
    console.log(`[EventExecutor] Signal start event`);
    
    const signalConfig = element.properties?.signalConfig;
    if (signalConfig) {
      console.log(`[EventExecutor] Signal trigger: ${signalConfig.signalName}`);
    }
  }

  private async executeNoneEndEvent(element: BpmnElement, context: ExecutionContext): Promise<void> {
    console.log(`[EventExecutor] None end event - completing process`);
    
    await this.stateManager.updateProcessStatus(
      context.processId,
      context.tenantId,
      'completed'
    );
  }

  private async executeMessageEndEvent(element: BpmnElement, context: ExecutionContext): Promise<void> {
    console.log(`[EventExecutor] Message end event`);
    
    const messageConfig = element.properties?.messageConfig;
    if (messageConfig) {
      // Schedule message sending job
      await this.stateManager.scheduleJob({
        tenantId: context.tenantId,
        processId: context.processId,
        kind: 'service_exec',
        payloadJson: {
          type: 'message',
          messageName: messageConfig.messageName,
          messageData: messageConfig.data || {},
        },
        idempotencyKey: `message-${element.id}-${context.processId}`,
      });
    }
    
    await this.executeNoneEndEvent(element, context);
  }

  private async executeErrorEndEvent(element: BpmnElement, context: ExecutionContext): Promise<void> {
    console.log(`[EventExecutor] Error end event`);
    
    const errorConfig = element.properties?.errorConfig;
    const errorCode = errorConfig?.errorCode || 'PROCESS_ERROR';
    const errorMessage = errorConfig?.errorMessage || 'Process ended with error';
    
    console.error(`[EventExecutor] Process error: ${errorCode} - ${errorMessage}`);
    
    await this.stateManager.updateProcessStatus(
      context.processId,
      context.tenantId,
      'cancelled' // Use cancelled as closest to error state
    );
  }

  private async executeTerminateEndEvent(element: BpmnElement, context: ExecutionContext): Promise<void> {
    console.log(`[EventExecutor] Terminate end event`);
    
    // Cancel all active tasks
    const activeTasks = await this.stateManager.getActiveTasks(context.processId, context.tenantId);
    for (const task of activeTasks) {
      await this.stateManager.updateTaskStatus(task.id, context.tenantId, 'cancelled');
    }
    
    await this.stateManager.updateProcessStatus(
      context.processId,
      context.tenantId,
      'cancelled'
    );
  }

  private async executeCatchingEvent(element: BpmnElement, eventType: string, context: ExecutionContext): Promise<void> {
    console.log(`[EventExecutor] Catching ${eventType} intermediate event`);
    
    switch (eventType) {
      case 'timer':
        await this.executeCatchingTimer(element, context);
        break;
      case 'message':
        await this.executeCatchingMessage(element, context);
        break;
      case 'signal':
        await this.executeCatchingSignal(element, context);
        break;
      default:
        console.log(`[EventExecutor] Unsupported catching event type: ${eventType}`);
    }
  }

  private async executeThrowingEvent(element: BpmnElement, eventType: string, context: ExecutionContext): Promise<void> {
    console.log(`[EventExecutor] Throwing ${eventType} intermediate event`);
    
    switch (eventType) {
      case 'message':
        await this.executeThrowingMessage(element, context);
        break;
      case 'signal':
        await this.executeThrowingSignal(element, context);
        break;
      default:
        console.log(`[EventExecutor] Unsupported throwing event type: ${eventType}`);
    }
  }

  private async executeCatchingTimer(element: BpmnElement, context: ExecutionContext): Promise<void> {
    const timerConfig = element.properties?.timerConfig;
    const delay = timerConfig?.delay || 30000; // 30s default
    
    console.log(`[EventExecutor] Scheduling timer for ${delay}ms`);
    
    await this.stateManager.scheduleJob({
      tenantId: context.tenantId,
      processId: context.processId,
      kind: 'timer',
      runAt: new Date(Date.now() + delay),
      payloadJson: {
        elementId: element.id,
        timerType: timerConfig?.type || 'delay',
      },
      idempotencyKey: `timer-${element.id}-${context.processId}`,
    });
  }

  private async executeCatchingMessage(element: BpmnElement, context: ExecutionContext): Promise<void> {
    const messageConfig = element.properties?.messageConfig;
    console.log(`[EventExecutor] Waiting for message: ${messageConfig?.messageName}`);
    
    // For MVP, create a waiting state - message arrival would trigger continuation
    // This would be handled by external message correlation system
  }

  private async executeCatchingSignal(element: BpmnElement, context: ExecutionContext): Promise<void> {
    const signalConfig = element.properties?.signalConfig;
    console.log(`[EventExecutor] Waiting for signal: ${signalConfig?.signalName}`);
    
    // For MVP, create a waiting state - signal would trigger continuation
    // This would be handled by external signal correlation system
  }

  private async executeThrowingMessage(element: BpmnElement, context: ExecutionContext): Promise<void> {
    const messageConfig = element.properties?.messageConfig;
    console.log(`[EventExecutor] Throwing message: ${messageConfig?.messageName}`);
    
    await this.stateManager.scheduleJob({
      tenantId: context.tenantId,
      processId: context.processId,
      kind: 'service_exec',
      payloadJson: {
        type: 'message_throw',
        messageName: messageConfig?.messageName,
        data: messageConfig?.data || {},
      },
      idempotencyKey: `throw-message-${element.id}-${context.processId}`,
    });
  }

  private async executeThrowingSignal(element: BpmnElement, context: ExecutionContext): Promise<void> {
    const signalConfig = element.properties?.signalConfig;
    console.log(`[EventExecutor] Throwing signal: ${signalConfig?.signalName}`);
    
    await this.stateManager.scheduleJob({
      tenantId: context.tenantId,
      processId: context.processId,
      kind: 'service_exec',
      payloadJson: {
        type: 'signal_throw',
        signalName: signalConfig?.signalName,
        data: signalConfig?.data || {},
      },
      idempotencyKey: `throw-signal-${element.id}-${context.processId}`,
    });
  }
}