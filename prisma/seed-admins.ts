import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMINS = [
  {
    email: "admin@jurgi.sn",
    name: "Super Admin Jurgi",
    password: "Jurgi@Super2026!",
    role: "super_admin",
  },
  {
    email: "moderation@jurgi.sn",
    name: "Modération Jurgi",
    password: "Jurgi@Mod2026!",
    role: "moderation",
  },
  {
    email: "support@jurgi.sn",
    name: "Support Jurgi",
    password: "Jurgi@Support2026!",
    role: "support",
  },
];

async function main() {
  for (const admin of ADMINS) {
    const passwordHash = await bcrypt.hash(admin.password, 12);
    await prisma.admin.upsert({
      where: { email: admin.email },
      update: { passwordHash, role: admin.role, name: admin.name },
      create: {
        email: admin.email,
        name: admin.name,
        passwordHash,
        role: admin.role,
        isActive: true,
      },
    });
    console.log(`✅ Admin ${admin.role} : ${admin.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
