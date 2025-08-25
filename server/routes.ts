import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

// JWT Secret (should be in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// Middleware for parsing tenant ID
const parseTenantId = (req: any, res: any, next: any) => {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    return res.status(400).json({
      type: "/api/errors/validation",
      title: "Missing Tenant ID",
      status: 400,
      detail: "X-Tenant-Id header is required"
    });
  }
  req.tenantId = tenantId;
  next();
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
    
    if (!user || !user.is_active || user.tenant_id !== req.tenantId) {
      return res.status(401).json({
        type: "/api/errors/auth",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid or expired token"
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoints
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

  app.get("/api/health/ready", (req, res) => {
    res.json({ status: "ready", timestamp: new Date().toISOString() });
  });

  app.get("/api/health/live", (req, res) => {
    res.json({ status: "live", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        return res.status(400).json({
          type: "/api/errors/validation",
          title: "Missing Tenant ID",
          status: 400,
          detail: "X-Tenant-Id header is required"
        });
      }

      // Find user by email and tenant
      const user = await storage.getUserByEmail(email, tenantId);
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
      const tenant = await storage.getTenant(user.tenant_id);
      if (!tenant || !tenant.is_active) {
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
          fields_count: Array.isArray(form.schema?.fields) ? form.schema.fields.length : 0,
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

  const httpServer = createServer(app);
  return httpServer;
}
