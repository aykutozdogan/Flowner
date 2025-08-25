import crypto from 'crypto';
import { Request, Response } from 'express';

export interface WebhookEvent {
  event: string;
  tenant_id: string;
  data: any;
  timestamp: string;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

export class WebhookService {
  private webhooks: Map<string, WebhookConfig[]> = new Map();

  // Register webhook for tenant
  registerWebhook(tenantId: string, config: WebhookConfig) {
    const tenantWebhooks = this.webhooks.get(tenantId) || [];
    tenantWebhooks.push(config);
    this.webhooks.set(tenantId, tenantWebhooks);
  }

  // Send webhook event
  async sendEvent(event: WebhookEvent) {
    const tenantWebhooks = this.webhooks.get(event.tenant_id) || [];
    
    const promises = tenantWebhooks
      .filter(webhook => webhook.active && webhook.events.includes(event.event))
      .map(webhook => this.sendWebhook(webhook, event));

    await Promise.allSettled(promises);
  }

  private async sendWebhook(webhook: WebhookConfig, event: WebhookEvent) {
    const payload = JSON.stringify(event);
    const signature = this.generateSignature(payload, webhook.secret);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.event,
        },
        body: payload,
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${webhook.url} - ${response.status}`);
      }
    } catch (error) {
      console.error(`Webhook error: ${webhook.url}`, error);
      // TODO: Implement retry logic
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Verify webhook signature
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

export const webhookService = new WebhookService();

// Common webhook events
export const WEBHOOK_EVENTS = {
  PROCESS_STARTED: 'process.started',
  PROCESS_COMPLETED: 'process.completed',
  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  FORM_SUBMITTED: 'form.submitted',
} as const;