import { db } from "./db";
import { tenants, users } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seed data başlatılıyor...");

  try {
    // Check if demo tenant already exists
    const [existingTenant] = await db.select().from(tenants).where(eq(tenants.domain, "demo.local"));

    let tenant;
    if (existingTenant) {
      console.log("✅ Demo tenant zaten var, kullanılıyor.");
      tenant = existingTenant;
    } else {
      // Create demo tenant
      const [newTenant] = await db.insert(tenants).values({
        name: "Demo Organization",
        domain: "demo.local",
        settings: {
          timezone: "Europe/Istanbul",
          language: "tr",
          features: ["workflows", "forms", "analytics", "audit_logs"]
        },
        branding: {
          primary_color: "#2196F3",
          secondary_color: "#9E9E9E",
          logo_url: null,
          company_name: "Demo Organization"
        },
        is_active: true
      }).returning();
      
      tenant = newTenant;
      console.log("✅ Demo tenant oluşturuldu:", tenant.name);
    }

    // Check if admin user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, "admin@demo.local"));

    if (existingUser) {
      console.log("✅ Admin kullanıcı zaten var.");
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash("Passw0rd!", 10);
      
      const [newUser] = await db.insert(users).values({
        tenant_id: tenant.id,
        email: "admin@demo.local",
        password: hashedPassword,
        name: "Demo Admin",
        role: "tenant_admin",
        is_active: true
      }).returning();
      
      console.log("✅ Admin kullanıcı oluşturuldu:", newUser.email);
    }

    // Create sample designer user
    const [existingDesigner] = await db.select().from(users).where(eq(users.email, "designer@demo.local"));

    if (!existingDesigner) {
      const hashedPassword = await bcrypt.hash("Designer123!", 10);
      
      const [designerUser] = await db.insert(users).values({
        tenant_id: tenant.id,
        email: "designer@demo.local",
        password: hashedPassword,
        name: "Demo Designer",
        role: "designer",
        is_active: true
      }).returning();
      
      console.log("✅ Designer kullanıcı oluşturuldu:", designerUser.email);
    }

    // Create sample regular user
    const [existingRegularUser] = await db.select().from(users).where(eq(users.email, "user@demo.local"));

    if (!existingRegularUser) {
      const hashedPassword = await bcrypt.hash("User123!", 10);
      
      const [regularUser] = await db.insert(users).values({
        tenant_id: tenant.id,
        email: "user@demo.local",
        password: hashedPassword,
        name: "Demo User",
        role: "user",
        is_active: true
      }).returning();
      
      console.log("✅ Regular kullanıcı oluşturuldu:", regularUser.email);
    }

    console.log("\n🎉 Seed data başarılı!");
    console.log("\n📝 Test kullanıcıları:");
    console.log("Admin: admin@demo.local / Passw0rd!");
    console.log("Designer: designer@demo.local / Designer123!");  
    console.log("User: user@demo.local / User123!");
    console.log("Tenant ID:", tenant.id);
    console.log("Domain: demo.local");

  } catch (error) {
    console.error("❌ Seed data hatası:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}

export { seed };