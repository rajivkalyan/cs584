/**
 * Central place for "demo vs real DB" so Netlify env typos / whitespace don't silently flip to demo.
 */

export function hasDatabaseUrl() {
  const u = process.env.DATABASE_URL?.trim();
  return Boolean(u && u.length > 0);
}

export function isDemoModeExplicit() {
  const v = process.env.UHC_DEMO_MODE?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** True when app should use in-memory store + demo auth (no Postgres). */
export function useDemoMode() {
  return isDemoModeExplicit() || !hasDatabaseUrl();
}
