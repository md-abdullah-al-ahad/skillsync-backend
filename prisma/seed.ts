import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Seed admin user
  const adminEmail = "admin@skillsync.com";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Admin user already exists, skipping.");
  } else {
    const adminId = crypto.randomUUID();
    const hashedPassword = await hashPassword("Admin@123");

    await prisma.user.create({
      data: {
        id: adminId,
        name: "Admin",
        email: adminEmail,
        emailVerified: true,
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: adminId,
        providerId: "credential",
        userId: adminId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Admin user created:");
    console.log("   Email:    admin@skillsync.com");
    console.log("   Password: Admin@123");
    console.log("   Role:     ADMIN");
  }

  // Seed default categories
  const defaultCategories = [
    { name: "Mathematics", slug: "mathematics" },
    { name: "Physics", slug: "physics" },
    { name: "Chemistry", slug: "chemistry" },
    { name: "Biology", slug: "biology" },
    { name: "English", slug: "english" },
    { name: "Computer Science", slug: "computer-science" },
    { name: "History", slug: "history" },
    { name: "Music", slug: "music" },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
      },
    });
  }

  console.log(`✅ ${defaultCategories.length} categories seeded.`);
  console.log("🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
