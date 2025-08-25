import { db } from "../server/db";
import { tenants, users, workflows, forms } from "@shared/schema";
import bcrypt from "bcrypt";
import { sql, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const DEMO_TENANT_DOMAIN = "demo.local";
let DEMO_TENANT_ID = randomUUID();
let DEMO_USER_ID = randomUUID();

// Demo Expense Approval Workflow JSON DSL
const EXPENSE_WORKFLOW_DSL = {
  id: "expense-approval",
  name: "Expense Approval Process",
  elements: [
    {
      id: "start-event",
      type: "start-event",
      name: "Start Expense Process",
      outgoing: ["flow-to-gateway"]
    },
    {
      id: "auto-approve-gateway",
      type: "exclusive-gateway",
      name: "Auto Approve Check",
      properties: {
        conditions: [
          {
            id: "auto-approve-path",
            expression: "${amount} <= 1000",
            outgoing: "flow-to-finance"
          },
          {
            id: "manual-approve-path", 
            expression: "${amount} > 1000",
            outgoing: "flow-to-manager"
          }
        ]
      },
      incoming: ["flow-to-gateway"],
      outgoing: ["flow-to-finance", "flow-to-manager"]
    },
    {
      id: "manager-approval",
      type: "user-task",
      name: "Manager Approval", 
      properties: {
        assigneeRole: "approver",
        priority: 2,
        description: "Review and approve/reject expense request"
      },
      incoming: ["flow-to-manager"],
      outgoing: ["flow-from-manager"]
    },
    {
      id: "approval-gateway",
      type: "exclusive-gateway",
      name: "Approved?",
      properties: {
        conditions: [
          {
            id: "approved-path",
            expression: "${approved} === true",
            outgoing: "flow-approved"
          },
          {
            id: "rejected-path",
            expression: "${approved} === false",
            outgoing: "flow-rejected"
          }
        ]
      },
      incoming: ["flow-from-manager"],
      outgoing: ["flow-approved", "flow-rejected"]
    },
    {
      id: "finance-processing",
      type: "service-task",
      name: "Finance Processing",
      properties: {
        serviceType: "script",
        endpoint: "/api/services/process-payment",
        method: "POST"
      },
      incoming: ["flow-to-finance", "flow-approved"],
      outgoing: ["flow-to-end"]
    },
    {
      id: "approved-end",
      type: "end-event", 
      name: "Expense Approved",
      incoming: ["flow-to-end"]
    },
    {
      id: "rejected-end",
      type: "end-event",
      name: "Expense Rejected", 
      incoming: ["flow-rejected"]
    }
  ],
  sequenceFlows: [
    {
      id: "flow-to-gateway",
      sourceRef: "start-event",
      targetRef: "auto-approve-gateway"
    },
    {
      id: "flow-to-finance",
      sourceRef: "auto-approve-gateway",
      targetRef: "finance-processing",
      condition: "${amount} <= 1000"
    },
    {
      id: "flow-to-manager",
      sourceRef: "auto-approve-gateway",
      targetRef: "manager-approval", 
      condition: "${amount} > 1000"
    },
    {
      id: "flow-from-manager",
      sourceRef: "manager-approval",
      targetRef: "approval-gateway"
    },
    {
      id: "flow-approved",
      sourceRef: "approval-gateway",
      targetRef: "finance-processing",
      condition: "${approved} === true"
    },
    {
      id: "flow-rejected",
      sourceRef: "approval-gateway",
      targetRef: "rejected-end",
      condition: "${approved} === false"
    },
    {
      id: "flow-to-end",
      sourceRef: "finance-processing",
      targetRef: "approved-end"
    }
  ]
};

// Demo Expense Form Schema
const EXPENSE_FORM_SCHEMA = {
  title: "Expense Request Form",
  description: "Submit your expense request for approval",
  fields: [
    {
      id: "amount",
      name: "amount",
      label: "Amount",
      type: "number",
      required: true,
      validation: {
        min: 1,
        max: 10000
      }
    },
    {
      id: "currency",
      name: "currency", 
      label: "Currency",
      type: "select",
      required: true,
      options: [
        { value: "USD", label: "US Dollar" },
        { value: "EUR", label: "Euro" },
        { value: "TRY", label: "Turkish Lira" }
      ],
      defaultValue: "USD"
    },
    {
      id: "category",
      name: "category",
      label: "Expense Category",
      type: "select",
      required: true,
      options: [
        { value: "travel", label: "Travel & Transportation" },
        { value: "meals", label: "Meals & Entertainment" },
        { value: "supplies", label: "Office Supplies" },
        { value: "training", label: "Training & Development" },
        { value: "other", label: "Other" }
      ]
    },
    {
      id: "description",
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
      placeholder: "Please provide details about this expense"
    },
    {
      id: "date",
      name: "date",
      label: "Expense Date", 
      type: "date",
      required: true
    },
    {
      id: "receipt",
      name: "receipt",
      label: "Receipt/Documentation",
      type: "file",
      required: false,
      accept: "image/*,.pdf"
    }
  ]
};

async function seedDemoData() {
  console.log("🌱 Starting demo data seeding...");
  
  try {
    // Check if demo tenant already exists
    const [existingTenant] = await db.select().from(tenants).where(eq(tenants.domain, DEMO_TENANT_DOMAIN)).limit(1);
    
    if (existingTenant) {
      console.log("✅ Demo tenant already exists, using existing tenant");
      DEMO_TENANT_ID = existingTenant.id;
    } else {
      // Create demo tenant
      const [tenant] = await db.insert(tenants).values({
        id: DEMO_TENANT_ID,
        name: "Demo Organization",
        domain: DEMO_TENANT_DOMAIN,
        is_active: true,
        settings: {
          theme: "default",
          features: ["workflows", "forms", "tasks"],
          limits: {
            users: 100,
            workflows: 50,
            storage: "10GB"
          }
        }
      }).returning();
      
      console.log("✅ Created demo tenant:", tenant.name);
      DEMO_TENANT_ID = tenant.id;
    }

    // Check if demo admin user exists  
    const [existingUser] = await db.select().from(users)
      .where(eq(users.email, "admin@demo.local")).limit(1);
    
    if (existingUser) {
      console.log("✅ Demo admin user already exists, using existing user");
      DEMO_USER_ID = existingUser.id;
    } else {
      // Create demo admin user
      const hashedPassword = await bcrypt.hash("Passw0rd!", 10);
      const [user] = await db.insert(users).values({
        id: DEMO_USER_ID,
        tenant_id: DEMO_TENANT_ID,
        email: "admin@demo.local",
        password: hashedPassword,
        name: "Demo Admin",
        role: "tenant_admin",
        is_active: true
      }).returning();
      
      console.log("✅ Created demo admin user:", user.email);
    }

    // Create expense form
    const [expenseForm] = await db.insert(forms).values({
      tenant_id: DEMO_TENANT_ID,
      key: "expense-form",
      name: "Expense Request Form",
      description: "Form for submitting expense requests",
      schema: EXPENSE_FORM_SCHEMA,
      status: "published",
      version: 1,
      created_by: DEMO_USER_ID,
      published_at: sql`now()`,
    }).onConflictDoNothing().returning();
    
    if (expenseForm) {
      console.log("✅ Created expense form:", expenseForm.name);
    } else {
      console.log("✅ Expense form already exists");
    }

    // Create expense workflow  
    const [expenseWorkflow] = await db.insert(workflows).values({
      tenant_id: DEMO_TENANT_ID,
      name: "Expense Approval Process",
      description: "Complete expense approval workflow with manager approval and finance processing",
      bpmn_xml: JSON.stringify(EXPENSE_WORKFLOW_DSL),
      status: "draft",
      version: 1,
      created_by: DEMO_USER_ID,
    }).onConflictDoNothing().returning();
    
    if (expenseWorkflow) {
      console.log("✅ Created expense workflow:", expenseWorkflow.name);
      console.log("📝 Workflow ID:", expenseWorkflow.id);
      console.log("🔄 Status:", expenseWorkflow.status);
    } else {
      console.log("✅ Expense workflow already exists");
    }

    console.log("🎉 Demo data seeding completed successfully!");
    console.log("");
    console.log("📋 Demo Credentials:");
    console.log("   Tenant: demo.local");
    console.log("   Email: admin@demo.local"); 
    console.log("   Password: Passw0rd!");
    console.log("");
    console.log("🚀 Next Steps:");
    console.log("   1. Login to the application");
    console.log("   2. Publish the 'Expense Approval Process' workflow");
    console.log("   3. Start a new expense process instance");
    console.log("   4. Test the complete workflow flow");
    
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  }
}

// Run the seed function
seedDemoData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });