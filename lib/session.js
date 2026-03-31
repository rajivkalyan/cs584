import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Get current session in API routes or server components.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return getServerSession(authOptions);
}

export function requireSession(session) {
  if (!session?.user?.id) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return session;
}
