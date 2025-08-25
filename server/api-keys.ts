import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface ApiKey {
  id: string;
  tenant_id: string;
  key_hash: string;
  scopes: string[];
  name: string;
  created_at: Date;
  revoked_at?: Date;
}

export class ApiKeyService {
  private keys: Map<string, ApiKey> = new Map();

  // Generate new API key
  generateApiKey(tenantId: string, scopes: string[], name: string): { key: string; apiKey: ApiKey } {
    const keyValue = 'ak_' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(keyValue).digest('hex');
    
    const apiKey: ApiKey = {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      key_hash: keyHash,
      scopes,
      name,
      created_at: new Date(),
    };

    this.keys.set(keyHash, apiKey);
    return { key: keyValue, apiKey };
  }

  // Validate API key
  validateApiKey(keyValue: string): ApiKey | null {
    const keyHash = crypto.createHash('sha256').update(keyValue).digest('hex');
    const apiKey = this.keys.get(keyHash);
    
    if (!apiKey || apiKey.revoked_at) {
      return null;
    }

    return apiKey;
  }

  // Revoke API key
  revokeApiKey(keyId: string, tenantId: string): boolean {
    for (const [hash, apiKey] of this.keys.entries()) {
      if (apiKey.id === keyId && apiKey.tenant_id === tenantId) {
        apiKey.revoked_at = new Date();
        return true;
      }
    }
    return false;
  }

  // List API keys for tenant
  listApiKeys(tenantId: string): Omit<ApiKey, 'key_hash'>[] {
    return Array.from(this.keys.values())
      .filter(key => key.tenant_id === tenantId && !key.revoked_at)
      .map(({ key_hash, ...key }) => key);
  }
}

export const apiKeyService = new ApiKeyService();

// API Key authentication middleware
export const authenticateApiKey = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('ApiKey ')) {
    return next(); // Continue to other auth methods
  }

  const keyValue = authHeader.slice(7); // Remove 'ApiKey ' prefix
  const apiKey = apiKeyService.validateApiKey(keyValue);

  if (!apiKey) {
    return res.status(401).json({
      type: '/api/errors/unauthorized',
      title: 'Invalid API Key',
      status: 401,
      detail: 'The provided API key is invalid or revoked'
    });
  }

  // Set API key context
  req.apiKey = apiKey;
  req.tenantId = apiKey.tenant_id;
  req.user = {
    id: 'api-key-' + apiKey.id,
    role: 'api',
    tenant_id: apiKey.tenant_id,
  };

  next();
};

// Rate limiting for API keys
const rateLimits = new Map<string, { count: number; resetTime: number }>();

export const rateLimitApiKey = (limit: number = 100, windowMs: number = 60000) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.apiKey) return next();

    const keyId = req.apiKey.id;
    const now = Date.now();
    const limiter = rateLimits.get(keyId);

    if (!limiter || now > limiter.resetTime) {
      rateLimits.set(keyId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (limiter.count >= limit) {
      res.set('Retry-After', Math.ceil((limiter.resetTime - now) / 1000).toString());
      return res.status(429).json({
        type: '/api/errors/rate-limit',
        title: 'Rate Limit Exceeded',
        status: 429,
        detail: `API key rate limit of ${limit} requests per minute exceeded`
      });
    }

    limiter.count++;
    next();
  };
};