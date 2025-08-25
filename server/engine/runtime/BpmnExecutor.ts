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
    console.log(`[BpmnExecutor] Context variables:`, JSON.stringify(context.variables, null, 2));
    
    const outgoing = element.outgoing || [];
    console.log(`[BpmnExecutor] Outgoing flows:`, outgoing);
    
    // Evaluate conditions on sequence flows
    for (const flowId of outgoing) {
      const flow = definition.sequenceFlows.find(f => f.id === flowId);
      if (!flow) continue;
      
      console.log(`[BpmnExecutor] Checking flow ${flowId}: condition="${flow.condition}", targetRef="${flow.targetRef}"`);
      
      if (!flow.condition) {
        // No condition - take unconditional path
        console.log(`[BpmnExecutor] Taking unconditional path: ${flowId}`);
        await this.followSequenceFlow(flowId, definition, context);
        return;
      }
      
      // Evaluate condition against process variables
      if (this.evaluateCondition(flow.condition, context.variables)) {
        console.log(`[BpmnExecutor] Condition met for path: ${flowId} -> ${flow.targetRef}`);
        await this.followSequenceFlow(flowId, definition, context);
        return;
      } else {
        console.log(`[BpmnExecutor] Condition NOT met for path: ${flowId}`);
      }
    }
    
    // No condition met - take default path (first one)
    if (outgoing.length > 0) {
      console.log(`[BpmnExecutor] Taking default path: ${outgoing[0]}`);
      await this.followSequenceFlow(outgoing[0], definition, context);
    }
  }

  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      console.log(`[BpmnExecutor] Evaluating condition: "${condition}" with variables:`, variables);
      
      // Simple condition evaluation for MVP
      // Replace variable placeholders - support both ${varName} and variables.varName formats
      let expression = condition.replace(/\$\{(\w+)\}/g, (match, varName) => {
        const value = variables[varName];
        console.log(`[BpmnExecutor] Variable ${varName} = ${value}`);
        if (typeof value === 'string') {
          return `"${value}"`;
        }
        return value?.toString() || 'null';
      });
      
      // Also support variables.varName format
      console.log(`[BpmnExecutor] Original expression before variables.X substitution: "${expression}"`);
      expression = expression.replace(/variables\.(\w+)/g, (match, varName) => {
        const value = variables[varName];
        console.log(`[BpmnExecutor] Variable substitution: ${match} -> ${value} (varName: ${varName})`);
        if (typeof value === 'string') {
          return `"${value}"`;
        }
        const replacement = value?.toString() || 'null';
        console.log(`[BpmnExecutor] Replacing "${match}" with "${replacement}"`);
        return replacement;
      });
      console.log(`[BpmnExecutor] Expression after variables.X substitution: "${expression}"`);
      
      // Handle complex expressions with parentheses and negation
      // For patterns like !(variables.amount <= 1000)
      expression = expression.replace(/!\(([^)]+)\)/g, (match, innerExpr) => {
        console.log(`[BpmnExecutor] Processing negation: ${match} -> ${innerExpr}`);
        // First evaluate the inner expression, then negate
        if (this.evaluateSimpleExpression(innerExpr, variables)) {
          return 'false';
        } else {
          return 'true';
        }
      });
      
      console.log(`[BpmnExecutor] Expression after substitution: "${expression}"`);
      
      // Handle comparison operators
      if (expression.includes('<=')) {
        const [left, right] = expression.split('<=').map(s => s.trim());
        const result = Number(this.parseValue(left)) <= Number(this.parseValue(right));
        console.log(`[BpmnExecutor] <= evaluation: ${left} <= ${right} = ${result}`);
        return result;
      }
      
      if (expression.includes('>=')) {
        const [left, right] = expression.split('>=').map(s => s.trim());
        const result = Number(this.parseValue(left)) >= Number(this.parseValue(right));
        console.log(`[BpmnExecutor] >= evaluation: ${left} >= ${right} = ${result}`);
        return result;
      }
      
      if (expression.includes('>')) {
        const [left, right] = expression.split('>').map(s => s.trim());
        const result = Number(this.parseValue(left)) > Number(this.parseValue(right));
        console.log(`[BpmnExecutor] > evaluation: ${left} > ${right} = ${result}`);
        return result;
      }
      
      if (expression.includes('<')) {
        const [left, right] = expression.split('<').map(s => s.trim());
        const result = Number(this.parseValue(left)) < Number(this.parseValue(right));
        console.log(`[BpmnExecutor] < evaluation: ${left} < ${right} = ${result}`);
        return result;
      }
      
      if (expression.includes('===')) {
        const [left, right] = expression.split('===').map(s => s.trim());
        const result = this.parseValue(left) === this.parseValue(right);
        console.log(`[BpmnExecutor] === evaluation: ${left} === ${right} = ${result}`);
        return result;
      }
      
      // Try evaluating as boolean literal after all transformations
      if (expression === 'true') return true;
      if (expression === 'false') return false;
      
      console.warn(`[BpmnExecutor] Unrecognized condition format: ${condition}`);
      return false;
    } catch (error) {
      console.error(`[BpmnExecutor] Error evaluating condition: ${condition}`, error);
      return false;
    }
  }

  private evaluateSimpleExpression(expression: string, variables: Record<string, any>): boolean {
    // Substitute variables in the expression
    let substituted = expression.replace(/variables\.(\w+)/g, (match, varName) => {
      const value = variables[varName];
      return value?.toString() || 'null';
    });

    // Handle comparison operators
    if (substituted.includes('<=')) {
      const [left, right] = substituted.split('<=').map(s => s.trim());
      return Number(this.parseValue(left)) <= Number(this.parseValue(right));
    }
    
    if (substituted.includes('>=')) {
      const [left, right] = substituted.split('>=').map(s => s.trim());
      return Number(this.parseValue(left)) >= Number(this.parseValue(right));
    }
    
    if (substituted.includes('>')) {
      const [left, right] = substituted.split('>').map(s => s.trim());
      return Number(this.parseValue(left)) > Number(this.parseValue(right));
    }
    
    if (substituted.includes('<')) {
      const [left, right] = substituted.split('<').map(s => s.trim());
      return Number(this.parseValue(left)) < Number(this.parseValue(right));
    }
    
    if (substituted.includes('===')) {
      const [left, right] = substituted.split('===').map(s => s.trim());
      return this.parseValue(left) === this.parseValue(right);
    }

    return false;
  }

  private parseValue(value: string): any {
    if (value === 'null' || value === 'undefined') return null;
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
    if (!isNaN(Number(value))) return Number(value);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
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