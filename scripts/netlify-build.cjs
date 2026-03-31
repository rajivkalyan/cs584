#!/usr/bin/env node
/**
 * Netlify build: migrate DB + seed, then Next build.
 * Fails fast with a clear message if DATABASE_URL is missing from *Build* env scope.
 */
const { spawnSync } = require("node:child_process");

function run(command) {
  const r = spawnSync(command, { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const dbUrl = process.env.DATABASE_URL?.trim();
const demo = process.env.UHC_DEMO_MODE?.trim().toLowerCase();

if (!dbUrl && demo !== "true" && demo !== "1") {
  console.error(`
[netlify-build] DATABASE_URL is empty but UHC_DEMO_MODE is not enabled.

In Netlify → Site configuration → Environment variables:
  • Add DATABASE_URL (Neon pooled URL with &pgbouncer=true)
  • Edit the variable → Scope: enable "Builds" (not only Functions)

Without Build scope, prisma db push cannot run during deploy and the database may stay empty.
`);
  process.exit(1);
}

if (dbUrl) {
  run("npx prisma db push");
  run("npx prisma db seed");
}

run("npm run build");
