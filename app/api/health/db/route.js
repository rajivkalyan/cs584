import { NextResponse } from "next/server";
import { hasDatabaseUrl, isDemoModeExplicit, useDemoMode } from "@/lib/runtimeEnv";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/health/db — verify how the server sees DB config (no secrets).
 * After deploy, open this URL while logged out is OK; it does not expose credentials.
 */
export async function GET() {
  const demoForced = isDemoModeExplicit();
  const urlPresent = hasDatabaseUrl();
  const demo = useDemoMode();

  let prismaStatus = "skipped";
  if (!demo) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      prismaStatus = "ok";
    } catch (e) {
      prismaStatus = e?.message?.slice(0, 200) || "error";
    }
  }

  return NextResponse.json({
    demoMode: demo,
    databaseUrlConfigured: urlPresent,
    uhcDemoModeEnv: demoForced,
    prisma: prismaStatus,
    hint: demo
      ? "Set DATABASE_URL in Netlify (all contexts) and set UHC_DEMO_MODE=false or remove it. Neon pooler URLs need &pgbouncer=true on DATABASE_URL."
      : prismaStatus === "ok"
        ? "Database connection OK."
        : "DATABASE_URL is set but Prisma query failed — check Neon credentials, sslmode, and pgbouncer=true for pooler.",
  });
}
