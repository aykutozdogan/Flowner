import { db } from "../server/db";
import { tenants, users, workflows, forms } from "@shared/schema";
import bcrypt from "bcrypt";
import { sql, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const DEMO_TENANT_DOMAIN = "demo.local";
let DEMO_TENANT_ID = randomUUID();
let DEMO_USER_ID = randomUUID();



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


    console.log("🎉 Demo data seeding completed successfully!");
    console.log("");
    console.log("📋 Demo Credentials:");
    console.log("   Tenant: demo.local");
    console.log("   Email: admin@demo.local"); 
    console.log("   Password: Passw0rd!");
    console.log("");
    console.log("🚀 Next Steps:");
    console.log("   1. Login to the application");
    console.log("   2. Use Form Builder to create custom forms");
    console.log("   3. Use BPMN Designer to create workflows");
    console.log("   4. Test the generic workflow engine");
    
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