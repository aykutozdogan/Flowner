import type { BpmnElement, BpmnDefinition, ExecutionContext } from '../index';

export class GatewayExecutor {
  async executeExclusiveGateway(
    element: BpmnElement,
    definition: BpmnDefinition,
    context: ExecutionContext
  ): Promise<string[]> {
    console.log(`[GatewayExecutor] Executing exclusive gateway: ${element.id}`);
    
    const outgoingFlows = element.outgoing || [];
    
    // For MVP, evaluate simple conditions on sequence flows
    for (const flowId of outgoingFlows) {
      const flow = definition.sequenceFlows.find(f => f.id === flowId);
      if (!flow) continue;
      
      if (!flow.condition) {
        // No condition - take first unconditional path
        console.log(`[GatewayExecutor] Taking unconditional path: ${flowId}`);
        return [flowId];
      }
      
      // Evaluate condition against process variables
      if (this.evaluateCondition(flow.condition, context.variables)) {
        console.log(`[GatewayExecutor] Condition met for path: ${flowId}`);
        return [flowId];
      }
    }
    
    // No condition met - take default path (first one for MVP)
    if (outgoingFlows.length > 0) {
      console.log(`[GatewayExecutor] Taking default path: ${outgoingFlows[0]}`);
      return [outgoingFlows[0]];
    }
    
    return [];
  }

  async executeParallelGateway(
    element: BpmnElement,
    definition: BpmnDefinition,
    context: ExecutionContext,
    isJoin: boolean = false
  ): Promise<string[]> {
    console.log(`[GatewayExecutor] Executing parallel gateway: ${element.id} (${isJoin ? 'join' : 'fork'})`);
    
    if (isJoin) {
      // Join: wait for all incoming flows to complete
      // For MVP, assume all incoming are complete and proceed
      return element.outgoing || [];
    } else {
      // Fork: activate all outgoing flows
      return element.outgoing || [];
    }
  }

  async executeInclusiveGateway(
    element: BpmnElement,
    definition: BpmnDefinition,
    context: ExecutionContext
  ): Promise<string[]> {
    console.log(`[GatewayExecutor] Executing inclusive gateway: ${element.id}`);
    
    const outgoingFlows = element.outgoing || [];
    const activeFlows: string[] = [];
    
    // Evaluate all conditions and activate matching flows
    for (const flowId of outgoingFlows) {
      const flow = definition.sequenceFlows.find(f => f.id === flowId);
      if (!flow) continue;
      
      if (!flow.condition || this.evaluateCondition(flow.condition, context.variables)) {
        activeFlows.push(flowId);
      }
    }
    
    // If no conditions met, take default path
    if (activeFlows.length === 0 && outgoingFlows.length > 0) {
      activeFlows.push(outgoingFlows[0]);
    }
    
    console.log(`[GatewayExecutor] Inclusive gateway activating ${activeFlows.length} paths`);
    return activeFlows;
  }

  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      // Simple condition evaluation for MVP
      // Format: ${variable} == 'value' or ${variable} > 100
      
      // Replace variable placeholders
      let expression = condition.replace(/\$\{(\w+)\}/g, (match, varName) => {
        const value = variables[varName];
        if (typeof value === 'string') {
          return `"${value}"`;
        }
        return value?.toString() || 'null';
      });
      
      // Simple comparison operators
      expression = expression.replace(/==/g, '===');
      
      // For MVP, handle basic comparisons
      if (expression.includes('===')) {
        const [left, right] = expression.split('===').map(s => s.trim());
        return this.parseValue(left) === this.parseValue(right);
      }
      
      if (expression.includes('>')) {
        const [left, right] = expression.split('>').map(s => s.trim());
        return Number(this.parseValue(left)) > Number(this.parseValue(right));
      }
      
      if (expression.includes('<')) {
        const [left, right] = expression.split('<').map(s => s.trim());
        return Number(this.parseValue(left)) < Number(this.parseValue(right));
      }
      
      // Default to false for unrecognized conditions
      console.warn(`[GatewayExecutor] Unrecognized condition format: ${condition}`);
      return false;
      
    } catch (error) {
      console.error(`[GatewayExecutor] Error evaluating condition: ${condition}`, error);
      return false;
    }
  }
  
  private parseValue(value: string): any {
    value = value.trim();
    
    // Remove quotes from strings
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    
    // Parse numbers
    const num = Number(value);
    if (!isNaN(num)) {
      return num;
    }
    
    // Parse booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    
    return value;
  }
}