/**
 * Seed a default UHC physician for development/demo.
 * Run: npm run db:push  (then)  npm run db:seed
 * Set SEED_PASSWORD in .env or use default "1234" (see README).
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "doctor@shuno.online";
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || "1234";

async function main() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {},
    create: {
      email: DEFAULT_EMAIL,
      name: "UHC Demo Physician",
      passwordHash: hash,
    },
  });
  console.log("Seeded physician:", user.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
