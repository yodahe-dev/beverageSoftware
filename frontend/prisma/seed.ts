import { PrismaClient } from "@prisma/client";
const bcrypt = require("bcrypt"); // <-- CommonJS import

const prisma = new PrismaClient();

async function main() {
  const email = "yodahe@bevflow.com";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const passwordHash = await bcrypt.hash("yoyogaga", 10);
    await prisma.user.create({
      data: {
        name: "Yodahe",
        email,
        password: passwordHash,
        role: "admin",
        isActive: true
      }
    });
    console.log("Admin user created");
  } else {
    console.log("Admin user already exists");
  }
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
