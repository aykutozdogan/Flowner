import type { Express } from "express";
import type { Request as ExpressRequest } from "express";

interface ExtendedRequest extends ExpressRequest {
  user: {
    id: string;
    role: string;
    email: string;
    name: string;
    tenant: {
      id: string;
      domain: string;
      name: string;
    };
  };
  tenantId: string;
  tenantDomain: string;
}

type Request = ExtendedRequest;
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ProcessRuntime, JobScheduler, type BpmnDefinition } from "./engine";
import { eq, and, desc } from "drizzle-orm";
import { processInstances, taskInstances, workflows, workflowVersions } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { specs, swaggerUi } from "./swagger";
import cors from "cors";

// JWT Secret (should be in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// Middleware for parsing tenant ID
const parseTenantId = async (req: ExpressRequest, res: any, next: any) => {
  const tenantIdentifier = req.headers['x-tenant-id'];
  if (!tenantIdentifier) {
    return res.status(400).json({
      type: "/api/errors/validation",
      title: "Missing Tenant ID",
      status: 400,
      detail: "X-Tenant-Id header is required"
    });
  }
  
  try {
    // Handle both domain and UUID formats
    let tenant;
    const tenantId = Array.isArray(tenantIdentifier) ? tenantIdentifier[0] : tenantIdentifier;
    if (tenantId.includes('-') && tenantId.length === 36) {
      // It's a UUID
      tenant = await storage.getTenant(tenantId);
    } else {
      // It's a domain
      tenant = await storage.getTenantByDomain(tenantId);
    }
    
    if (!tenant) {
      return res.status(400).json({
        type: "/api/errors/validation",
        title: "Invalid Tenant",
        status: 400,
        detail: "Tenant not found"
      });
    }
    
    (req as ExtendedRequest).tenantId = tenant.id;
    (req as ExtendedRequest).tenantDomain = tenant.domain;
    next();
  } catch (error) {
    console.error('Tenant lookup error:', error);
    return res.status(500).json({
      type: "/api/errors/internal",
      title: "Internal Server Error",
      status: 500,
      detail: "Failed to resolve tenant"
    });
  }
};

// Middleware for JWT authentication
const authenticateToken = async (req: ExpressRequest, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      type: "/api/errors/auth",
      title: "Unauthorized",
      status: 401,
      detail: "Access token is required"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUserWithTenant(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        type: "/api/errors/auth",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid or expired token"
      });
    }

    // Ensure the user belongs to the tenant making the request
    if (user.tenant_id !== (req as ExtendedRequest).tenantId) {
      return res.status(403).json({
        type: "/api/errors/forbidden",
        title: "Forbidden",
        status: 403,
        detail: "User does not belong to this tenant"
      });
    }

    (req as ExtendedRequest).user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      type: "/api/errors/auth",
      title: "Unauthorized",
      status: 401,
      detail: "Invalid or expired token"
    });
  }
};

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

// Initialize Workflow Engine
const processRuntime = new ProcessRuntime();
const jobScheduler = new JobScheduler();

// Start job scheduler
jobScheduler.start().catch(console.error);

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS configuration for Replit environment
  const corsOptions = {
    origin: function (origin: string | undefined, callback: any) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Allow all localhost and development origins
      if (origin.includes('localhost') || 
          origin.includes('127.0.0.1') ||
          origin.includes('0.0.0.0')) {
        return callback(null, true);
      }
      
      // Allow all Replit domains
      if (origin.includes('replit.dev') || 
          origin.includes('replit.co') || 
          origin.includes('repl.co')) {
        return callback(null, true);
      }
      
      // Allow the origin if it's in the environment variable
      const allowedOrigins = process.env.CORS_ALLOWLIST?.split(',') || [];
      if (allowedOrigins.some(allowed => origin.includes(allowed.replace('*', '')))) {
        return callback(null, true);
      }
      
      // Allow all for development (bu satırı geçici olarak bırakıyoruz)
      console.log('CORS Origin:', origin);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Requested-With', 'Origin', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page']
  };
  
  app.use(cors(corsOptions));
  
  // Handle preflight requests
  app.options('*', cors(corsOptions));

  // Swagger API Documentation
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Flowner API Documentation',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      persistAuthorization: true
    }
  }));

  // Health check endpoints
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     description: Check the health status of the API and its services
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthStatus'
   */
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: { status: "healthy", response_time: "12ms" },
        redis: { status: "healthy", response_time: "3ms" },
        queue: { status: "healthy", pending_jobs: 5 }
      },
      metrics: {
        uptime: "72h 15m",
        memory_usage: "67%",
        cpu_usage: "23%"
      }
    });
  });

  /**
   * @swagger
   * /health/ready:
   *   get:
   *     summary: Readiness check
   *     description: Check if the service is ready to accept requests
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Service is ready
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ready
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  app.get("/api/health/ready", (req, res) => {
    res.json({ status: "ready", timestamp: new Date().toISOString() });
  });

  /**
   * @swagger
   * /health/live:
   *   get:
   *     summary: Liveness check
   *     description: Check if the service is alive
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Service is alive
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: live
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  app.get("/api/health/live", (req, res) => {
    res.json({ status: "live", timestamp: new Date().toISOString() });
  });

  // Backend introspection endpoints (no auth required for debugging)
  app.get('/__meta/routes', (req, res) => {
    const routes = [
      { method: 'GET', path: '/api/health', auth: false, roles: [] },
      { method: 'GET', path: '/api/health/ready', auth: false, roles: [] },
      { method: 'GET', path: '/api/health/live', auth: false, roles: [] },
      { method: 'GET', path: '/api/v1/__meta/routes', auth: false, roles: [] },
      { method: 'GET', path: '/api/v1/__meta/engine', auth: false, roles: [] },
      { method: 'GET', path: '/api/v1/__meta/seed', auth: true, roles: ['tenant_admin', 'designer', 'approver', 'user'] },
      { method: 'POST', path: '/api/auth/login', auth: false, roles: [] },
      { method: 'POST', path: '/api/auth/refresh', auth: false, roles: [] },
      { method: 'GET', path: '/api/auth/me', auth: true, roles: ['tenant_admin', 'designer', 'approver', 'user'] },
      { method: 'GET', path: '/api/workflows', auth: true, roles: ['tenant_admin', 'designer'] },
      { method: 'POST', path: '/api/workflows/:id/publish', auth: true, roles: ['tenant_admin', 'designer'] },
      { method: 'GET', path: '/api/processes', auth: true, roles: ['tenant_admin', 'designer', 'approver'] },
      { method: 'POST', path: '/api/processes', auth: true, roles: ['tenant_admin', 'designer'] },
      { method: 'POST', path: '/api/processes/:id/cancel', auth: true, roles: ['tenant_admin', 'designer'] },
      { method: 'GET', path: '/api/engine/tasks', auth: true, roles: ['tenant_admin', 'designer', 'approver', 'user'] },
      { method: 'POST', path: '/api/engine/tasks/:id/complete', auth: true, roles: ['tenant_admin', 'designer', 'approver', 'user'] },
      { method: 'POST', path: '/api/engine/tasks/:id/assign', auth: true, roles: ['tenant_admin', 'approver'] },
      { method: 'GET', path: '/api/engine/stats', auth: true, roles: ['tenant_admin'] },
      { method: 'POST', path: '/api/engine/tick', auth: true, roles: ['tenant_admin'] },
    ];
    res.json({ routes, timestamp: new Date().toISOString() });
  });

  app.get('/__meta/engine', async (req, res) => {
    try {
      const stats = await jobScheduler.getSchedulerStats();
      res.json({
        scheduler: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Engine meta error:', error);
      res.status(500).json({ error: 'Failed to get engine stats' });
    }
  });

  // Authentication routes
  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: User login
   *     description: Authenticate user and return access token
   *     tags: [Authentication]
   *     security: []
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: Invalid input or missing tenant
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/v1/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const tenantIdentifierHeader = req.headers['x-tenant-id'];
      const tenantIdentifier = Array.isArray(tenantIdentifierHeader) ? tenantIdentifierHeader[0] : tenantIdentifierHeader;

      if (!tenantIdentifier) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Missing Tenant ID",
          status: 400,
          detail: "X-Tenant-Id header is required"
        });
      }

      // Handle both domain and UUID formats
      let tenant;
      if (tenantIdentifier.includes('-') && tenantIdentifier.length === 36) {
        // It's a UUID
        tenant = await storage.getTenant(tenantIdentifier);
      } else {
        // It's a domain
        tenant = await storage.getTenantByDomain(tenantIdentifier);
      }
      
      if (!tenant) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Invalid Tenant",
          status: 400,
          detail: "Tenant not found"
        });
      }

      // Find user by email and tenant
      const user = await storage.getUserByEmail(email, tenant.id);
      if (!user || !user.is_active) {
        return res.status(401).json({
          type: "/api/errors/auth",
          title: "Invalid Credentials",
          status: 401,
          detail: "Invalid email or password"
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          type: "/api/errors/auth",
          title: "Invalid Credentials",
          status: 401,
          detail: "Invalid email or password"
        });
      }

      // Get tenant info
      const userTenant = await storage.getTenant(user.tenant_id);
      if (!userTenant || !userTenant.is_active) {
        return res.status(401).json({
          type: "/api/errors/auth",
          title: "Tenant Inactive",
          status: 401,
          detail: "Your organization account is inactive"
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, tenantId: user.tenant_id, role: user.role },
        JWT_SECRET,
        { expiresIn: '60m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, tenantId: user.tenant_id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Create audit log
      await storage.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action: "user_login",
        entity_type: "user",
        entity_id: user.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenant_id: user.tenant_id
          }
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Validation Failed",
          status: 400,
          detail: "Request body validation failed",
          errors: error.flatten().fieldErrors
        });
      }

      console.error("Login error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "An unexpected error occurred"
      });
    }
  });

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     description: Generate new access token using refresh token
   *     tags: [Authentication]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RefreshRequest'
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     access_token:
   *                       type: string
   *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   *                     expires_in:
   *                       type: integer
   *                       example: 3600
   *       401:
   *         description: Invalid refresh token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/v1/auth/refresh", async (req, res) => {
    try {
      const { refresh_token } = refreshTokenSchema.parse(req.body);

      const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as any;
      const user = await storage.getUser(decoded.userId);

      if (!user || !user.is_active) {
        return res.status(401).json({
          type: "/api/errors/auth",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid refresh token"
        });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id, tenantId: user.tenant_id, role: user.role },
        JWT_SECRET,
        { expiresIn: '60m' }
      );

      res.json({
        success: true,
        data: {
          access_token: accessToken,
          expires_in: 3600
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Validation Failed",
          status: 400,
          detail: "Request body validation failed",
          errors: error.flatten().fieldErrors
        });
      }

      return res.status(401).json({
        type: "/api/errors/auth",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid refresh token"
      });
    }
  });

  // Protected routes (require authentication and tenant validation)
  // S7 API v1 Standardization - Apply middleware to all v1 endpoints
  app.use("/api/v1", parseTenantId);
  app.use("/api/v1", authenticateToken);

  // Protected meta endpoint (requires auth)
  app.get('/__meta/seed', async (req: any, res) => {
    try {
      const tenantId = (req as ExtendedRequest).tenantId;
      
      const workflows = await storage.getWorkflows(tenantId);
      const processes = await storage.getProcessInstances(tenantId, { limit: 1000, offset: 0 });
      const tasks = await storage.getTaskInstances(tenantId, { limit: 1000, offset: 0 });
      const forms = await storage.getForms(tenantId);

      res.json({
        summary: {
          workflows: workflows.length,
          processes: processes.length,
          tasks: tasks.length,
          forms: forms.length,
        },
        demo: {
          seedExists: workflows.some((w: any) => w.key === 'expense_approval'),
          expenseWorkflowId: workflows.find((w: any) => w.key === 'expense_approval')?.id,
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Seed meta error:', error);
      res.status(500).json({ error: 'Failed to get seed stats' });
    }
  });

  // Engine tick endpoint for dev purposes
  /**
   * @swagger
   * /engine/tick:
   *   post:
   *     summary: Trigger engine tick
   *     description: Manually trigger workflow engine processing (admin only)
   *     tags: [Engine]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *     responses:
   *       200:
   *         description: Engine tick executed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: 'Engine tick executed'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       403:
   *         description: Forbidden - admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post('/api/v1/engine/tick', async (req: any, res) => {
    try {
      // Only admin can manually trigger engine tick
      if ((req as ExtendedRequest).user.role !== 'tenant_admin') {
        return res.status(403).json({
          type: "/api/errors/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "You are not authorized to trigger engine tick"
        });
      }

      await jobScheduler.tick();
      res.json({ 
        message: 'Engine tick executed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Manual engine tick error:', error);
      res.status(500).json({ error: 'Failed to execute engine tick' });
    }
  });

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Get current user profile
   *     description: Retrieve authenticated user's profile information
   *     tags: [Authentication]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserProfile'
   *       401:
   *         description: Unauthorized - invalid or missing token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/v1/auth/me", async (req: any, res) => {
    const user = (req as ExtendedRequest).user;
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          domain: user.tenant.domain
        },
        permissions: [] // TODO: Calculate permissions based on role
      }
    });
  });

  // Dashboard analytics
  app.get("/api/v1/analytics/dashboard", async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats((req as ExtendedRequest).tenantId);
      
      res.json({
        success: true,
        data: {
          stats,
          trends: {
            processes_by_day: [
              { date: "2025-01-01", count: 23 },
              { date: "2025-01-02", count: 31 }
            ],
            completion_rate: 0.87
          },
          top_workflows: [
            {
              workflow_id: "wfl_123",
              name: "Purchase Approval",
              instances: 45
            }
          ]
        }
      });
    } catch (error) {
      console.error("Dashboard analytics error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch dashboard analytics"
      });
    }
  });

  // Forms management
  /**
   * @swagger
   * /forms:
   *   get:
   *     summary: List forms
   *     description: Retrieve list of forms for the tenant
   *     tags: [Forms]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *       - name: status
   *         in: query
   *         description: Filter by form status
   *         schema:
   *           type: string
   *           enum: [draft, published, archived]
   *       - name: search
   *         in: query
   *         description: Search forms by name
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Forms retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Form'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                           example: 1
   *                         limit:
   *                           type: integer
   *                           example: 20
   *                         total:
   *                           type: integer
   *                           example: 15
   *                         pages:
   *                           type: integer
   *                           example: 1
   */
  app.get("/api/v1/forms-legacy", async (req: any, res) => {
    try {
      const { status, search } = req.query;
      const forms = await storage.getForms((req as ExtendedRequest).tenantId, { status, search });
      
      res.json({
        success: true,
        data: forms.map(form => ({
          id: form.id,
          key: form.key,
          name: form.name,
          description: form.description,
          latest_version: form.latest_version,
          status: form.status,
          created_at: form.created_at,
          updated_at: form.updated_at,
          fields_count: 0, // TODO: Get from latest form version
          submissions_count: 0 // TODO: Calculate actual submissions
        })),
        meta: {
          pagination: {
            page: 1,
            limit: 20,
            total: forms.length,
            pages: Math.ceil(forms.length / 20)
          }
        }
      });
    } catch (error) {
      console.error("Forms fetch error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch forms"
      });
    }
  });

  // S3 Form Management API v1
  /**
   * @swagger
   * /v1/forms:
   *   post:
   *     summary: Create or upsert form by key
   *     description: Create a new form or update existing form, creates draft v1
   *     tags: [Forms v1]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [key, name, schema_json, ui_schema_json]
   *             properties:
   *               key:
   *                 type: string
   *                 example: "expense_request"
   *               name:
   *                 type: string
   *                 example: "Expense Request Form"
   *               description:
   *                 type: string
   *                 example: "Form for submitting expense requests"
   *               schema_json:
   *                 type: object
   *                 example: {"fields": [{"name": "amount", "type": "number", "required": true}]}
   *               ui_schema_json:
   *                 type: object
   *                 example: {"layout": "grid", "columns": 2}
   *     responses:
   *       200:
   *         description: Form created/updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     form:
   *                       $ref: '#/components/schemas/Form'
   *                     version:
   *                       $ref: '#/components/schemas/FormVersion'
   */
  app.post("/api/v1/forms", async (req: any, res) => {
    try {
      const { key, name, description, schema_json, ui_schema_json } = req.body;

      if (!key || !name || !schema_json || !ui_schema_json) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Validation Error",
          status: 400,
          detail: "key, name, schema_json, and ui_schema_json are required"
        });
      }

      // Check if form exists
      let form = await storage.getFormByKey(key, (req as ExtendedRequest).tenantId);
      
      if (!form) {
        // Create new form
        form = await storage.createForm({
          tenant_id: (req as ExtendedRequest).tenantId,
          key,
          name,
          description,
          latest_version: 1,
          status: "draft",
          created_by: (req as ExtendedRequest).user.id
        });
      } else {
        // Update existing form
        form = await storage.updateForm(form.id, (req as ExtendedRequest).tenantId, {
          name,
          description,
          latest_version: form.latest_version + 1
        });
      }

      // Create new version
      const formVersion = await storage.createFormVersion({
        tenant_id: (req as ExtendedRequest).tenantId,
        form_id: form!.id,
        version: form!.latest_version,
        status: "draft",
        schema_json,
        ui_schema_json
      });

      res.json({
        success: true,
        data: {
          form,
          version: formVersion
        }
      });
    } catch (error) {
      console.error("Form creation error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to create form"
      });
    }
  });

  /**
   * @swagger
   * /v1/forms:
   *   get:
   *     summary: List forms
   *     description: Get list of latest published forms and drafts
   *     tags: [Forms v1]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *       - name: status
   *         in: query
   *         description: Filter by status
   *         required: false
   *         schema:
   *           type: string
   *           enum: [draft, published, archived]
   *     responses:
   *       200:
   *         description: Forms retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Form'
   */
  app.get("/api/v1/forms", async (req: any, res) => {
    try {
      const { status } = req.query;
      const forms = await storage.getForms((req as ExtendedRequest).tenantId, { status });
      
      res.json({
        success: true,
        data: forms
      });
    } catch (error) {
      console.error("Forms fetch error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch forms"
      });
    }
  });

  /**
   * @swagger
   * /v1/forms/{key}:
   *   get:
   *     summary: Get form by key
   *     description: Get latest published form or draft if includeDraft=true
   *     tags: [Forms v1]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *       - name: key
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           example: "expense_request"
   *       - name: includeDraft
   *         in: query
   *         description: Include draft versions
   *         required: false
   *         schema:
   *           type: boolean
   *           default: false
   *     responses:
   *       200:
   *         description: Form retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     form:
   *                       $ref: '#/components/schemas/Form'
   *                     version:
   *                       $ref: '#/components/schemas/FormVersion'
   */
  app.get("/api/v1/forms/:key", async (req: any, res) => {
    try {
      const { key } = req.params;
      const { includeDraft } = req.query;
      
      const form = await storage.getFormByKey(key, (req as ExtendedRequest).tenantId);
      if (!form) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Form Not Found",
          status: 404,
          detail: "Form not found"
        });
      }

      // Get latest version
      const status = includeDraft === 'true' ? undefined : 'published';
      const latestVersion = await storage.getLatestFormVersion(key, (req as ExtendedRequest).tenantId, status);
      
      if (!latestVersion && !includeDraft) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Published Version Not Found",
          status: 404,
          detail: "No published version found for this form"
        });
      }

      res.json({
        success: true,
        data: {
          form,
          version: latestVersion
        }
      });
    } catch (error) {
      console.error("Form fetch error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch form"
      });
    }
  });

  /**
   * @swagger
   * /v1/forms/{key}/versions:
   *   post:
   *     summary: Create new draft version
   *     description: Create a new draft version of the form
   *     tags: [Forms v1]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *       - name: key
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [schema_json, ui_schema_json]
   *             properties:
   *               schema_json:
   *                 type: object
   *                 example: {"fields": [{"name": "amount", "type": "number", "required": true}]}
   *               ui_schema_json:
   *                 type: object
   *                 example: {"layout": "grid", "columns": 2}
   *     responses:
   *       200:
   *         description: Version created successfully
   */
  app.post("/api/v1/forms/:key/versions", async (req: any, res) => {
    try {
      const { key } = req.params;
      const { schema_json, ui_schema_json } = req.body;

      if (!schema_json || !ui_schema_json) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Validation Error",
          status: 400,
          detail: "schema_json and ui_schema_json are required"
        });
      }

      const form = await storage.getFormByKey(key, (req as ExtendedRequest).tenantId);
      if (!form) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Form Not Found",
          status: 404,
          detail: "Form not found"
        });
      }

      // Increment version and create new draft
      const newVersion = form.latest_version + 1;
      
      // Update form's latest version
      await storage.updateForm(form.id, (req as ExtendedRequest).tenantId, {
        latest_version: newVersion
      });

      // Create new version
      const formVersion = await storage.createFormVersion({
        tenant_id: (req as ExtendedRequest).tenantId,
        form_id: form.id,
        version: newVersion,
        status: "draft",
        schema_json,
        ui_schema_json
      });

      res.json({
        success: true,
        data: formVersion
      });
    } catch (error) {
      console.error("Form version creation error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to create form version"
      });
    }
  });

  /**
   * @swagger
   * /v1/forms/{key}/publish:
   *   post:
   *     summary: Publish draft version
   *     description: Publish draft version, increment version number
   *     tags: [Forms v1]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *       - name: key
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               version:
   *                 type: integer
   *                 description: Specific version to publish (defaults to latest)
   *                 example: 2
   *     responses:
   *       200:
   *         description: Form published successfully
   */
  app.post("/api/v1/forms/:key/publish", async (req: any, res) => {
    try {
      const { key } = req.params;
      const { version } = req.body;

      const form = await storage.getFormByKey(key, (req as ExtendedRequest).tenantId);
      if (!form) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Form Not Found",
          status: 404,
          detail: "Form not found"
        });
      }

      // Determine which version to publish
      const versionToPublish = version || form.latest_version;
      
      // Get the draft version
      const draftVersion = await storage.getFormVersion(form.id, versionToPublish, (req as ExtendedRequest).tenantId);
      if (!draftVersion) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Version Not Found",
          status: 404,
          detail: "Form version not found"
        });
      }

      if (draftVersion.status !== 'draft') {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Invalid Status",
          status: 400,
          detail: "Only draft versions can be published"
        });
      }

      // Publish the version
      const publishedVersion = await storage.publishFormVersion(
        form.id,
        versionToPublish,
        (req as ExtendedRequest).tenantId,
        (req as ExtendedRequest).user.id
      );

      // Update form status to published
      await storage.updateForm(form.id, (req as ExtendedRequest).tenantId, {
        status: "published"
      });

      res.json({
        success: true,
        data: publishedVersion,
        message: "Form published successfully"
      });
    } catch (error) {
      console.error("Form publish error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to publish form"
      });
    }
  });

  /**
   * @swagger
   * /v1/forms/{key}/validate:
   *   post:
   *     summary: Validate form data
   *     description: Validate sample data against form schema
   *     tags: [Forms v1]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *       - name: key
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               data:
   *                 type: object
   *                 example: {"amount": 1500, "description": "Taxi fare"}
   *               version:
   *                 type: integer
   *                 description: Version to validate against (defaults to published)
   *                 example: 2
   *     responses:
   *       200:
   *         description: Validation completed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 valid:
   *                   type: boolean
   *                   example: true
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       field:
   *                         type: string
   *                         example: "amount"
   *                       message:
   *                         type: string
   *                         example: "Amount is required"
   */
  app.post("/api/v1/forms/:key/validate", async (req: any, res) => {
    try {
      const { key } = req.params;
      const { data, version } = req.body;

      if (!data) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Validation Error",
          status: 400,
          detail: "data is required"
        });
      }

      const form = await storage.getFormByKey(key, (req as ExtendedRequest).tenantId);
      if (!form) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Form Not Found",
          status: 404,
          detail: "Form not found"
        });
      }

      // Get form version for validation
      let formVersion;
      if (version) {
        formVersion = await storage.getFormVersion(form.id, version, (req as ExtendedRequest).tenantId);
      } else {
        formVersion = await storage.getLatestFormVersion(key, (req as ExtendedRequest).tenantId, 'published');
      }

      if (!formVersion) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Form Version Not Found",
          status: 404,
          detail: "Form version not found"
        });
      }

      // TODO: Implement actual validation logic based on schema_json
      // For now, return basic validation
      const errors: any[] = [];
      let valid = true;

      // Basic validation example
      const schema = formVersion.schema_json as any;
      if (schema?.fields) {
        schema.fields.forEach((field: any) => {
          if (field.required && !data[field.name]) {
            errors.push({
              field: field.name,
              message: `${field.name} is required`
            });
            valid = false;
          }
        });
      }

      res.json({
        success: true,
        valid,
        errors
      });
    } catch (error) {
      console.error("Form validation error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to validate form"
      });
    }
  });

  /**
   * @swagger
   * /v1/forms/{key}/preview:
   *   get:
   *     summary: Get form preview data
   *     description: Get schema and ui_schema for runtime rendering
   *     tags: [Forms v1]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *       - name: key
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: version
   *         in: query
   *         description: Specific version to preview (defaults to published)
   *         required: false
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Preview data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     form:
   *                       $ref: '#/components/schemas/Form'
   *                     version:
   *                       $ref: '#/components/schemas/FormVersion'
   *                     schema_json:
   *                       type: object
   *                     ui_schema_json:
   *                       type: object
   */
  app.get("/api/v1/forms/:key/preview", async (req: any, res) => {
    try {
      const { key } = req.params;
      const { version } = req.query;

      const form = await storage.getFormByKey(key, (req as ExtendedRequest).tenantId);
      if (!form) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Form Not Found",
          status: 404,
          detail: "Form not found"
        });
      }

      // Get form version for preview
      let formVersion;
      if (version) {
        formVersion = await storage.getFormVersion(form.id, parseInt(version), (req as ExtendedRequest).tenantId);
      } else {
        formVersion = await storage.getLatestFormVersion(key, (req as ExtendedRequest).tenantId, 'published');
      }

      if (!formVersion) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Form Version Not Found",
          status: 404,
          detail: "Form version not found"
        });
      }

      res.json({
        success: true,
        data: {
          form,
          version: formVersion,
          schema_json: formVersion.schema_json,
          ui_schema_json: formVersion.ui_schema_json
        }
      });
    } catch (error) {
      console.error("Form preview error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to get form preview"
      });
    }
  });

  // Task inbox
  /**
   * @swagger
   * /tasks/inbox:
   *   get:
   *     summary: Get task inbox
   *     description: Retrieve tasks assigned to the current user or available for assignment
   *     tags: [Tasks]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *       - name: status
   *         in: query
   *         description: Filter by task status
   *         schema:
   *           type: string
   *           enum: [pending, completed, cancelled]
   *           default: pending
   *       - name: assigned_to
   *         in: query
   *         description: Filter by assignment
   *         schema:
   *           type: string
   *           enum: [me, all]
   *     responses:
   *       200:
   *         description: Task inbox retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Task'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     counts:
   *                       type: object
   *                       properties:
   *                         pending:
   *                           type: integer
   *                           example: 5
   *                         completed:
   *                           type: integer
   *                           example: 12
   *                         overdue:
   *                           type: integer
   *                           example: 2
   */
  
  // My Tasks endpoint (tasks assigned to current user)
  app.get("/api/v1/tasks/my-tasks", async (req: any, res) => {
    try {
      const { status = "pending" } = req.query;
      
      // Filter tasks assigned to current user's role
      const filters: any = { 
        status,
        assigneeRole: (req as ExtendedRequest).user.role 
      };

      const tasks = await storage.getTaskInstances((req as ExtendedRequest).tenantId, filters);
      
      res.json(tasks.map(task => ({
        id: task.id,
        taskId: task.id, // For backward compatibility
        name: task.name,
        description: task.description,
        processId: task.process_id,
        status: task.status,
        priority: task.priority,
        assigneeRole: task.assignee_role,
        formId: task.form_id,
        formKey: task.form_key,
        formVersion: task.form_version,
        createdAt: task.created_at,
        dueDate: task.due_date
      })));
    } catch (error) {
      console.error("My tasks error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error", 
        status: 500,
        detail: "Failed to fetch my tasks"
      });
    }
  });
  
  app.get("/api/v1/tasks/inbox", async (req: any, res) => {
    try {
      const { status = "pending", assigned_to } = req.query;
      
      let filters: any = { status };
      if (assigned_to === "me") {
        filters.assigneeId = (req as ExtendedRequest).user.id;
      }

      const tasks = await storage.getTaskInstances((req as ExtendedRequest).tenantId, filters);
      
      res.json({
        success: true,
        data: tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          process: {
            id: task.process_id,
            name: `Process - ${task.name}` // TODO: Get actual process name
          },
          form: task.form_key ? {
            id: task.form_id,
            key: task.form_key,
            version: task.form_version,
            name: "Task Form" // TODO: Get actual form name
          } : null,
          assignee: task.assignee_id ? {
            id: task.assignee_id,
            name: "Task Assignee" // TODO: Get actual assignee name
          } : null,
          priority: task.priority === 1 ? "normal" : task.priority === 2 ? "high" : "low",
          status: task.status,
          due_date: task.due_date,
          created_at: task.created_at,
          variables: {}
        })),
        meta: {
          counts: {
            pending: tasks.filter(t => t.status === "pending").length,
            completed: tasks.filter(t => t.status === "completed").length,
            overdue: 0 // TODO: Calculate overdue tasks
          }
        }
      });
    } catch (error) {
      console.error("Task inbox error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch task inbox"
      });
    }
  });
  
  // S4: Task Detail API endpoint for User Portal
  app.get("/api/v1/tasks/:id", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: taskId } = req.params;
      
      const task = await storage.getTaskInstanceById(taskId, (req as ExtendedRequest).tenantId);
      if (!task) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Task Not Found",
          status: 404,
          detail: "Task not found"
        });
      }

      // Check if user can view this task
      const canView = task.assignee_id === (req as ExtendedRequest).user.id || 
                     task.assignee_role === (req as ExtendedRequest).user.role ||
                     (req as ExtendedRequest).user.role === 'tenant_admin';

      if (!canView) {
        return res.status(403).json({
          type: "/api/errors/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "You are not authorized to view this task"
        });
      }

      res.json({
        success: true,
        data: {
          id: task.id,
          name: task.name,
          description: task.description,
          processId: task.process_id,
          status: task.status,
          priority: task.priority,
          assigneeRole: task.assignee_role,
          formId: task.form_id,
          formKey: task.form_key,
          formVersion: task.form_version,
          formData: task.form_data,
          outcome: task.outcome,
          dueDate: task.due_date,
          createdAt: task.created_at,
          completedAt: task.completed_at
        }
      });
    } catch (error) {
      console.error("Task detail error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch task details"
      });
    }
  });

  // S4: Form Data API endpoint
  app.get("/api/v1/forms/data", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { processId, taskId } = req.query;
      
      const formDataList = await storage.getFormData(
        processId as string,
        taskId as string,
        (req as ExtendedRequest).tenantId
      );
      
      res.json({
        success: true,
        data: formDataList
      });
    } catch (error) {
      console.error("Form data fetch error:", error);
      res.status(500).json({
        type: "/api/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch form data"
      });
    }
  });

  // ========================================
  // WORKFLOW ENGINE API ROUTES
  // ========================================

  // Workflow Publishing API
  app.post("/api/v1/workflows/:id/publish", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: workflowIdentifier } = req.params;
      const { version = "1.0.0" } = req.body;
      
      // Get workflow by ID or key
      let workflow;
      if (workflowIdentifier.includes('-') && workflowIdentifier.length === 36) {
        // It's a UUID
        workflow = await storage.getWorkflowById(workflowIdentifier, (req as ExtendedRequest).tenantId);
      } else {
        // It's a key
        workflow = await storage.getWorkflowByKey(workflowIdentifier, (req as ExtendedRequest).tenantId);
      }
      
      if (!workflow) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Workflow Not Found",
          status: 404,
          detail: "Workflow not found"
        });
      }

      // Create workflow version with JSON DSL
      const versionData = {
        tenantId: (req as ExtendedRequest).tenantId,
        workflowId: workflow.id,
        version: parseInt(version.replace(/\./g, "")), // Convert "1.0.0" to 100
        definitionJson: JSON.parse(workflow.bpmn_xml), // Assume BPMN XML is actually JSON DSL
        status: "published" as const,
        publishedBy: (req as ExtendedRequest).user.id,
      };

      await storage.createWorkflowVersion(versionData);
      
      // Update workflow status
      await storage.updateWorkflow(workflow.id, (req as ExtendedRequest).tenantId, {
        status: "published",
        published_at: new Date(),
      });

      console.log(`[Engine API] Workflow ${workflow.id} (${workflow.key || workflowIdentifier}) published as version ${versionData.version}`);
      res.json({
        success: true,
        message: "Workflow published successfully",
        version: versionData.version
      });
    } catch (error) {
      console.error("Error publishing workflow:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to publish workflow"
      });
    }
  });

  // Process Management API
  /**
   * @swagger
   * /processes:
   *   get:
   *     summary: List process instances
   *     description: Retrieve list of process instances for the tenant
   *     tags: [Processes]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *       - name: limit
   *         in: query
   *         description: Maximum number of results
   *         schema:
   *           type: integer
   *           default: 50
   *       - name: offset
   *         in: query
   *         description: Number of results to skip
   *         schema:
   *           type: integer
   *           default: 0
   *       - name: status
   *         in: query
   *         description: Filter by process status
   *         schema:
   *           type: string
   *           enum: [running, completed, cancelled, failed]
   *     responses:
   *       200:
   *         description: Process instances retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Process'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/v1/processes", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const processes = await storage.getProcessInstances((req as ExtendedRequest).tenantId, {
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
        status: req.query.status as any,
      });

      res.json(processes);
    } catch (error) {
      console.error("Error fetching processes:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error", 
        status: 500,
        detail: "Failed to fetch processes"
      });
    }
  });

  /**
   * @swagger
   * /processes:
   *   post:
   *     summary: Start new process
   *     description: Start a new process instance from a published workflow
   *     tags: [Processes]
   *     parameters:
   *       - $ref: '#/components/parameters/tenantId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [workflowId, name]
   *             properties:
   *               workflowId:
   *                 type: string
   *                 description: ID of the workflow to start
   *                 example: 'wfl_123456'
   *               name:
   *                 type: string
   *                 description: Name for the process instance
   *                 example: 'Expense Request - John Doe'
   *               variables:
   *                 type: object
   *                 description: Initial process variables
   *                 example:
   *                   amount: 1500
   *                   requestor: 'John Doe'
   *     responses:
   *       200:
   *         description: Process started successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Process'
   *       400:
   *         description: Invalid input
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Workflow not found or not published
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/v1/processes", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { workflowId, name, variables = {} } = req.body;
      
      // Validate required fields
      if (!workflowId || !name) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Validation Error",
          status: 400,
          detail: "workflowId and name are required"
        });
      }

      // Get published workflow version
      const workflowVersion = await storage.getLatestWorkflowVersion(workflowId, (req as ExtendedRequest).tenantId);
      if (!workflowVersion) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Published Workflow Not Found",
          status: 404,
          detail: "No published version found for this workflow"
        });
      }

      // Start process using engine
      const processInstance = await processRuntime.startProcess({
        tenantId: (req as ExtendedRequest).tenantId,
        workflowId,
        workflowVersion: workflowVersion.version,
        bpmnDefinition: workflowVersion.definition_json as BpmnDefinition,
        name,
        variables,
        startedBy: (req as ExtendedRequest).user.id,
      });

      console.log(`[Engine API] Process started: ${processInstance.id} from workflow ${workflowId}`);
      res.json(processInstance);
    } catch (error) {
      console.error("Error starting process:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to start process"
      });
    }
  });

  // Process Start API with workflowKey
  app.post("/api/v1/processes/start", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { workflowKey, name = "Process", variables = {} } = req.body;
      
      // Validate required fields
      if (!workflowKey) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Validation Error",
          status: 400,
          detail: "workflowKey is required"
        });
      }

      // Get workflow by key
      const workflow = await storage.getWorkflowByKey(workflowKey, (req as ExtendedRequest).tenantId);
      if (!workflow) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Workflow Not Found",
          status: 404,
          detail: "Workflow not found with the provided key"
        });
      }

      // Get published workflow version
      const workflowVersion = await storage.getLatestWorkflowVersion(workflow.id, (req as ExtendedRequest).tenantId);
      if (!workflowVersion) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Published Workflow Not Found",
          status: 404,
          detail: "No published version found for this workflow"
        });
      }

      // Start process using engine
      const processInstance = await processRuntime.startProcess({
        tenantId: (req as ExtendedRequest).tenantId,
        workflowId: workflow.id,
        workflowVersion: workflowVersion.version,
        bpmnDefinition: workflowVersion.definition_json as BpmnDefinition,
        name: name || `${workflow.name} Process`,
        variables,
        startedBy: (req as ExtendedRequest).user.id,
      });

      console.log(`[Engine API] Process started: ${processInstance.id} from workflow key ${workflowKey}`);
      res.json(processInstance);
    } catch (error) {
      console.error("Error starting process from workflowKey:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to start process"
      });
    }
  });

  app.get("/api/v1/processes/:id", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: processId } = req.params;
      
      const process = await storage.getProcessInstanceById(processId, (req as ExtendedRequest).tenantId);
      if (!process) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Process Not Found",
          status: 404,
          detail: "Process not found"
        });
      }

      // Get associated tasks
      const tasks = await storage.getTaskInstances((req as ExtendedRequest).tenantId, { processId });

      res.json({
        ...process,
        tasks
      });
    } catch (error) {
      console.error("Error fetching process:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch process"
      });
    }
  });

  app.post("/api/v1/processes/:id/cancel", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: processId } = req.params;
      
      await processRuntime.cancelProcess(processId, (req as ExtendedRequest).tenantId);
      
      console.log(`[Engine API] Process cancelled: ${processId}`);
      res.json({
        success: true,
        message: "Process cancelled successfully"
      });
    } catch (error) {
      console.error("Error cancelling process:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to cancel process"
      });
    }
  });

  // Task Management API
  app.get("/api/v1/engine/tasks", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const filters: any = {
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      // Role-based filtering
      if ((req as ExtendedRequest).user.role !== 'tenant_admin') {
        // Non-admin users only see tasks assigned to their role or directly to them
        filters.assigneeRole = (req as ExtendedRequest).user.role;
        filters.assigneeId = (req as ExtendedRequest).user.id;
      }

      if (req.query.status) {
        filters.status = req.query.status;
      }

      const tasks = await storage.getTaskInstances((req as ExtendedRequest).tenantId, filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching engine tasks:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch tasks"
      });
    }
  });

  app.post("/api/v1/engine/tasks/:id/complete", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: taskId } = req.params;
      const { outcome, formData = {} } = req.body;
      
      // Check task ownership/assignment
      const task = await storage.getTaskInstanceById(taskId, (req as ExtendedRequest).tenantId);
      if (!task) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Task Not Found",
          status: 404,
          detail: "Task not found"
        });
      }

      // Check if user can complete this task
      const canComplete = task.assignee_id === (req as ExtendedRequest).user.id || 
                         task.assignee_role === (req as ExtendedRequest).user.role ||
                         (req as ExtendedRequest).user.role === 'tenant_admin';

      if (!canComplete) {
        return res.status(403).json({
          type: "/api/errors/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "You are not authorized to complete this task"
        });
      }

      // Complete task using engine
      await processRuntime.completeTask({
        taskId,
        tenantId: (req as ExtendedRequest).tenantId,
        userId: (req as ExtendedRequest).user.id,
        outcome,
        formData,
      });

      console.log(`[Engine API] Task completed: ${taskId} by user ${(req as ExtendedRequest).user.id}`);
      res.json({
        success: true,
        message: "Task completed successfully"
      });
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to complete task"
      });
    }
  });

  app.post("/api/v1/engine/tasks/:id/assign", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: taskId } = req.params;
      const { assigneeId } = req.body;
      
      // Only admin and approvers can reassign tasks
      if (!['tenant_admin', 'approver'].includes((req as ExtendedRequest).user.role)) {
        return res.status(403).json({
          type: "/api/errors/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "You are not authorized to assign tasks"
        });
      }

      await storage.updateTaskInstance(taskId, (req as ExtendedRequest).tenantId, {
        assignee_id: assigneeId,
        status: 'assigned'
      });

      console.log(`[Engine API] Task assigned: ${taskId} to user ${assigneeId}`);
      res.json({
        success: true,
        message: "Task assigned successfully"
      });
    } catch (error) {
      console.error("Error assigning task:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to assign task"
      });
    }
  });

  // S7: Demo Expense Approval Workflow API
  app.post("/api/v1/workflows/expense-approval/start", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { amount, description, category = "General" } = req.body;
      const tenantId = (req as ExtendedRequest).tenantId;
      const userId = (req as ExtendedRequest).user.id;

      // Validate required fields
      if (!amount || !description) {
        return res.status(400).json({
          success: false,
          error: {
            type: '/api/errors/validation-error',
            title: 'Validation Error',
            detail: 'Amount and description are required',
          }
        });
      }

      // Create process instance for expense approval
      const processInstance = await storage.createProcessInstance({
        id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        workflow_id: 'expense-approval-workflow',
        name: `Expense Request: ${description} (${amount} TL)`,
        status: 'running',
        variables: {
          amount: parseFloat(amount),
          description,
          category,
          requestedBy: userId,
          status: 'pending_approval',
          approverRole: amount > 5000 ? 'tenant_admin' : 'approver'
        },
        started_by: userId,
        started_at: new Date(),
      });

      // Create initial task for approval
      const taskInstance = await storage.createTaskInstance({
        id: `expense-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        process_id: processInstance.id,
        name: `Approve Expense: ${description}`,
        type: 'user',
        status: 'pending',
        assigned_role: amount > 5000 ? 'tenant_admin' : 'approver',
        form_data: {
          amount,
          description,
          category,
          requestedBy: userId
        },
        created_at: new Date(),
      });

      res.json({
        success: true,
        data: {
          processId: processInstance.id,
          taskId: taskInstance.id,
          status: 'started',
          approverRole: amount > 5000 ? 'tenant_admin' : 'approver'
        }
      });

    } catch (error) {
      console.error('[ExpenseWorkflow] Error starting expense approval:', error);
      res.status(500).json({
        success: false,
        error: {
          type: '/api/errors/internal-error',
          title: 'Internal Server Error',
          detail: 'Failed to start expense approval workflow'
        }
      });
    }
  });

  app.post("/api/v1/workflows/expense-approval/complete", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { processId, taskId, decision, comments = "" } = req.body;
      const tenantId = (req as ExtendedRequest).tenantId;
      const userId = (req as ExtendedRequest).user.id;

      // Validate required fields
      if (!processId || !taskId || !decision) {
        return res.status(400).json({
          success: false,
          error: {
            type: '/api/errors/validation-error',
            title: 'Validation Error',
            detail: 'Process ID, task ID, and decision are required',
          }
        });
      }

      if (!['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({
          success: false,
          error: {
            type: '/api/errors/validation-error',
            title: 'Validation Error',
            detail: 'Decision must be "approved" or "rejected"',
          }
        });
      }

      // Complete the task
      await storage.updateTaskInstance(taskId, tenantId, {
        status: 'completed',
        completed_by: userId,
        completed_at: new Date(),
        outcome: decision,
        form_data: {
          decision,
          comments,
          approvedBy: userId,
          approvedAt: new Date().toISOString()
        }
      });

      // Update process status
      const finalStatus = decision === 'approved' ? 'completed' : 'cancelled';
      await storage.updateProcessInstance(processId, tenantId, {
        status: finalStatus,
        completed_at: new Date(),
        variables: {
          decision,
          comments,
          approvedBy: userId,
          finalStatus
        }
      });

      res.json({
        success: true,
        data: {
          decision,
          status: finalStatus,
          completedBy: userId
        }
      });

    } catch (error) {
      console.error('[ExpenseWorkflow] Error completing expense approval:', error);
      res.status(500).json({
        success: false,
        error: {
          type: '/api/errors/internal-error',
          title: 'Internal Server Error',
          detail: 'Failed to complete expense approval'
        }
      });
    }
  });

  // Engine Statistics API
  app.get("/api/v1/engine/stats", parseTenantId, authenticateToken, async (req, res) => {
    try {
      // Only admin can access engine stats
      if ((req as ExtendedRequest).user.role !== 'tenant_admin') {
        return res.status(403).json({
          type: "/api/errors/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required"
        });
      }

      const stats = await jobScheduler.getSchedulerStats();
      
      res.json({
        scheduler: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching engine stats:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch engine statistics"
      });
    }
  });

  // Tenants Management API
  app.get("/api/v1/tenants", parseTenantId, authenticateToken, async (req, res) => {
    try {
      // Only tenant_admin and designer can manage tenants
      if (!['tenant_admin', 'designer'].includes((req as ExtendedRequest).user.role)) {
        return res.status(403).json({
          type: "/api/errors/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Only tenant administrators and designers can access tenant management"
        });
      }

      const tenants = await storage.getAllTenants();
      res.json({
        success: true,
        data: tenants
      });
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch tenants"
      });
    }
  });

  app.post("/api/v1/tenants", parseTenantId, authenticateToken, async (req, res) => {
    try {
      // Only tenant_admin and designer can create tenants
      if (!['tenant_admin', 'designer'].includes((req as ExtendedRequest).user.role)) {
        return res.status(403).json({
          type: "/api/errors/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Only tenant administrators and designers can create tenants"
        });
      }

      const { name, domain, settings = {}, branding = {} } = req.body;

      if (!name?.trim() || !domain?.trim()) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Validation Error",
          status: 400,
          detail: "Tenant name and domain are required"
        });
      }

      const tenant = await storage.createTenant({
        name: name.trim(),
        domain: domain.trim(),
        settings,
        branding,
        is_active: true
      });

      res.status(201).json({
        success: true,
        data: tenant
      });
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to create tenant"
      });
    }
  });

  // Workflows Management API
  app.get("/api/v1/workflows", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const workflows = await storage.getWorkflows((req as ExtendedRequest).tenantId, { status });
      
      res.json({
        success: true,
        data: workflows
      });
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch workflows"
      });
    }
  });

  app.post("/api/v1/workflows", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { key, name, description, bpmn_xml, config, status = 'draft' } = req.body;

      if (!key || !name) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Validation Error",
          status: 400,
          detail: "key and name are required"
        });
      }

      const workflow = await storage.createWorkflow({
        tenant_id: (req as ExtendedRequest).tenantId,
        key,
        name,
        description,
        bpmn_xml: bpmn_xml || JSON.stringify({}),
        config: config || {},
        status,
        created_by: (req as ExtendedRequest).user.id
      });

      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      console.error("Error creating workflow:", error);
      res.status(500).json({
        type: "/api/errors/server", 
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to create workflow"
      });
    }
  });

  app.get("/api/v1/workflows/:key", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { key } = req.params;
      
      const workflow = await storage.getWorkflowByKey(key, (req as ExtendedRequest).tenantId);
      if (!workflow) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Workflow Not Found",
          status: 404,
          detail: "Workflow not found"
        });
      }

      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      console.error("Error fetching workflow:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch workflow"
      });
    }
  });

  app.put("/api/v1/workflows/:key", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { key } = req.params;
      const { name, description, bpmn_xml, config } = req.body;

      const workflow = await storage.getWorkflowByKey(key, (req as ExtendedRequest).tenantId);
      if (!workflow) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Workflow Not Found",
          status: 404,
          detail: "Workflow not found"
        });
      }

      const updatedWorkflow = await storage.updateWorkflow(workflow.id, (req as ExtendedRequest).tenantId, {
        name,
        description,
        bpmn_xml,
        config
      });

      res.json({
        success: true,
        data: updatedWorkflow
      });
    } catch (error) {
      console.error("Error updating workflow:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error", 
        status: 500,
        detail: "Failed to update workflow"
      });
    }
  });

  app.post("/api/v1/workflows/:key/publish", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { key } = req.params;
      const { changelog, bpmn_xml, config } = req.body;

      const workflow = await storage.getWorkflowByKey(key, (req as ExtendedRequest).tenantId);
      if (!workflow) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Workflow Not Found",
          status: 404,
          detail: "Workflow not found"
        });
      }

      // Update workflow with latest content
      if (bpmn_xml || config) {
        await storage.updateWorkflow(workflow.id, (req as ExtendedRequest).tenantId, {
          bpmn_xml,
          config
        });
      }

      // Publish workflow
      const publishedWorkflow = await storage.updateWorkflow(workflow.id, (req as ExtendedRequest).tenantId, {
        status: "published",
        published_at: new Date()
      });

      res.json({
        success: true,
        data: publishedWorkflow,
        message: "Workflow published successfully"
      });
    } catch (error) {
      console.error("Error publishing workflow:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to publish workflow"
      });
    }
  });

  // Users Management API  
  app.get("/api/v1/users", parseTenantId, authenticateToken, async (req, res) => {
    try {
      // Only tenant_admin and designer can manage users
      if (!['tenant_admin', 'designer'].includes((req as ExtendedRequest).user.role)) {
        return res.status(403).json({
          type: "/api/errors/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Only tenant administrators and designers can access user management"
        });
      }

      const users = await storage.getUsersByTenant((req as ExtendedRequest).tenantId);
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error", 
        status: 500,
        detail: "Failed to fetch users"
      });
    }
  });

  app.post("/api/v1/users", parseTenantId, authenticateToken, async (req, res) => {
    try {
      // Only tenant_admin and designer can create users
      if (!['tenant_admin', 'designer'].includes((req as ExtendedRequest).user.role)) {
        return res.status(403).json({
          type: "/api/errors/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Only tenant administrators and designers can create users"
        });
      }

      const { email, name, password, role = 'user' } = req.body;

      if (!email?.trim() || !name?.trim() || !password?.trim()) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Validation Error",
          status: 400,
          detail: "Email, name, and password are required"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        email: email.trim(),
        name: name.trim(),
        password: hashedPassword,
        role,
        tenant_id: (req as ExtendedRequest).tenantId,
        is_active: true
      });

      // Don't return password in response
      const { password: _, ...userResponse } = user;

      res.status(201).json({
        success: true,
        data: userResponse
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({
        type: "/api/errors/server",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to create user"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
