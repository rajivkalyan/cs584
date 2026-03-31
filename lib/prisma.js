import { PrismaClient } from "@prisma/client";

const globalForPrisma = typeof globalThis !== "undefined" ? globalThis : global;

/** Reuse one client per serverless instance (Netlify/Vercel); avoids extra connections. */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
