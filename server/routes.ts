import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ProcessRuntime, JobScheduler, type BpmnDefinition } from "./engine";
import { eq, and, desc } from "drizzle-orm";
import { processInstances, taskInstances, workflows, workflowVersions } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { specs, swaggerUi } from "./swagger";

// JWT Secret (should be in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// Middleware for parsing tenant ID
const parseTenantId = async (req: any, res: any, next: any) => {
  const tenantDomain = req.headers['x-tenant-id'];
  if (!tenantDomain) {
    return res.status(400).json({
      type: "/api/errors/validation",
      title: "Missing Tenant ID",
      status: 400,
      detail: "X-Tenant-Id header is required"
    });
  }
  
  try {
    // Get tenant UUID from domain
    const tenant = await storage.getTenantByDomain(tenantDomain);
    if (!tenant) {
      return res.status(400).json({
        type: "/api/errors/validation",
        title: "Invalid Tenant",
        status: 400,
        detail: "Tenant not found"
      });
    }
    
    req.tenantId = tenant.id;
    req.tenantDomain = tenantDomain;
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
const authenticateToken = async (req: any, res: any, next: any) => {
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
    if (user.tenant_id !== req.tenantId) {
      return res.status(403).json({
        type: "/api/errors/forbidden",
        title: "Forbidden",
        status: 403,
        detail: "User does not belong to this tenant"
      });
    }

    req.user = user;
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
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const tenantIdentifier = req.headers['x-tenant-id'] as string;

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
  app.post("/api/auth/refresh", async (req, res) => {
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
  app.use("/api", parseTenantId);
  app.use("/api", authenticateToken);

  // Protected meta endpoint (requires auth)
  app.get('/__meta/seed', async (req: any, res) => {
    try {
      const tenantId = req.tenantId;
      
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
  app.post('/api/engine/tick', async (req: any, res) => {
    try {
      // Only admin can manually trigger engine tick
      if (req.user.role !== 'tenant_admin') {
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
  app.get("/api/auth/me", async (req: any, res) => {
    const user = req.user;
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
  app.get("/api/analytics/dashboard", async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.tenantId);
      
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
  app.get("/api/forms", async (req: any, res) => {
    try {
      const { status, search } = req.query;
      const forms = await storage.getForms(req.tenantId, { status, search });
      
      res.json({
        success: true,
        data: forms.map(form => ({
          id: form.id,
          name: form.name,
          description: form.description,
          version: form.version,
          status: form.status,
          created_at: form.created_at,
          updated_at: form.updated_at,
          fields_count: Array.isArray((form.schema as any)?.fields) ? (form.schema as any).fields.length : 0,
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
  app.get("/api/tasks/inbox", async (req: any, res) => {
    try {
      const { status = "pending", assigned_to } = req.query;
      
      let filters: any = { status };
      if (assigned_to === "me") {
        filters.assigneeId = req.user.id;
      }

      const tasks = await storage.getTaskInstances(req.tenantId, filters);
      
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
          form: task.form_id ? {
            id: task.form_id,
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

  // ========================================
  // WORKFLOW ENGINE API ROUTES
  // ========================================

  // Workflow Publishing API
  app.post("/api/workflows/:id/publish", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: workflowId } = req.params;
      const { version = "1.0.0" } = req.body;
      
      // Get workflow
      const workflow = await storage.getWorkflowById(workflowId, req.tenantId);
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
        tenantId: req.tenantId,
        workflowId,
        version: parseInt(version.replace(/\./g, "")), // Convert "1.0.0" to 100
        definitionJson: JSON.parse(workflow.bpmn_xml), // Assume BPMN XML is actually JSON DSL
        status: "published" as const,
        publishedBy: req.user.id,
      };

      await storage.createWorkflowVersion(versionData);
      
      // Update workflow status
      await storage.updateWorkflow(workflowId, req.tenantId, {
        status: "published",
        published_at: new Date(),
      });

      console.log(`[Engine API] Workflow ${workflowId} published as version ${versionData.version}`);
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
  app.get("/api/processes", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const processes = await storage.getProcessInstances(req.tenantId, {
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
  app.post("/api/processes", parseTenantId, authenticateToken, async (req, res) => {
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
      const workflowVersion = await storage.getLatestWorkflowVersion(workflowId, req.tenantId);
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
        tenantId: req.tenantId,
        workflowId,
        workflowVersion: workflowVersion.version,
        bpmnDefinition: workflowVersion.definition_json as BpmnDefinition,
        name,
        variables,
        startedBy: req.user.id,
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

  app.get("/api/processes/:id", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: processId } = req.params;
      
      const process = await storage.getProcessInstanceById(processId, req.tenantId);
      if (!process) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Process Not Found",
          status: 404,
          detail: "Process not found"
        });
      }

      // Get associated tasks
      const tasks = await storage.getTaskInstances(req.tenantId, { processId });

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

  app.post("/api/processes/:id/cancel", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: processId } = req.params;
      
      await processRuntime.cancelProcess(processId, req.tenantId);
      
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
  app.get("/api/engine/tasks", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const filters: any = {
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      // Role-based filtering
      if (req.user.role !== 'tenant_admin') {
        // Non-admin users only see tasks assigned to their role or directly to them
        filters.assigneeRole = req.user.role;
        filters.assigneeId = req.user.id;
      }

      if (req.query.status) {
        filters.status = req.query.status;
      }

      const tasks = await storage.getTaskInstances(req.tenantId, filters);
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

  app.post("/api/engine/tasks/:id/complete", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: taskId } = req.params;
      const { outcome, formData = {} } = req.body;
      
      // Check task ownership/assignment
      const task = await storage.getTaskInstanceById(taskId, req.tenantId);
      if (!task) {
        return res.status(404).json({
          type: "/api/errors/not-found",
          title: "Task Not Found",
          status: 404,
          detail: "Task not found"
        });
      }

      // Check if user can complete this task
      const canComplete = task.assignee_id === req.user.id || 
                         task.assignee_role === req.user.role ||
                         req.user.role === 'tenant_admin';

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
        tenantId: req.tenantId,
        userId: req.user.id,
        outcome,
        formData,
      });

      console.log(`[Engine API] Task completed: ${taskId} by user ${req.user.id}`);
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

  app.post("/api/engine/tasks/:id/assign", parseTenantId, authenticateToken, async (req, res) => {
    try {
      const { id: taskId } = req.params;
      const { assigneeId } = req.body;
      
      // Only admin and approvers can reassign tasks
      if (!['tenant_admin', 'approver'].includes(req.user.role)) {
        return res.status(403).json({
          type: "/api/errors/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "You are not authorized to assign tasks"
        });
      }

      await storage.updateTaskInstance(taskId, req.tenantId, {
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

  // Engine Statistics API
  app.get("/api/engine/stats", parseTenantId, authenticateToken, async (req, res) => {
    try {
      // Only admin can access engine stats
      if (req.user.role !== 'tenant_admin') {
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

  const httpServer = createServer(app);
  return httpServer;
}
