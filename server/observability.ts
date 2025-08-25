import { Request, Response, NextFunction } from 'express';

// Simple observability service
export class ObservabilityService {
  private metrics: Map<string, number> = new Map();
  private traces: any[] = [];

  // Log structured data
  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      traceId: this.generateTraceId(),
    };

    console.log(JSON.stringify(logEntry));
  }

  // Record metric
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const key = `${name}:${JSON.stringify(tags || {})}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + value);
  }

  // Get metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Generate trace ID
  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Start span
  startSpan(operation: string, data?: any) {
    const span = {
      traceId: this.generateTraceId(),
      operation,
      startTime: Date.now(),
      data,
    };

    this.traces.push(span);
    return span;
  }

  // Finish span
  finishSpan(span: any, status: 'success' | 'error' = 'success', error?: Error) {
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    
    if (error) {
      span.error = error.message;
    }

    this.recordMetric(`span.${span.operation}.duration`, span.duration);
    this.recordMetric(`span.${span.operation}.count`, 1, { status });
  }
}

export const observability = new ObservabilityService();

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const traceId = Math.random().toString(36).substring(2, 15);
  
  // Add trace ID to request
  (req as any).traceId = traceId;

  // Log request
  observability.log('info', 'HTTP Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    traceId,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    
    observability.log('info', 'HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      traceId,
    });

    observability.recordMetric('http.request.duration', duration, {
      method: req.method,
      status: res.statusCode.toString(),
    });

    observability.recordMetric('http.request.count', 1, {
      method: req.method,
      status: res.statusCode.toString(),
    });

    originalEnd.apply(this, args);
  };

  next();
};

// Error tracking middleware
export const errorTracker = (error: Error, req: Request, res: Response, next: NextFunction) => {
  observability.log('error', 'Unhandled Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    traceId: (req as any).traceId,
  });

  observability.recordMetric('error.count', 1, {
    type: error.constructor.name,
  });

  next(error);
};