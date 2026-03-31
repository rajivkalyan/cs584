/**
 * Parse failed fetch response into a user-visible message.
 * Netlify/proxies often return empty bodies on 5xx — avoid new Error("").
 */
export async function parseErrorBody(res) {
  const status = res.status;
  const statusText = res.statusText || "Error";
  let text = "";
  try {
    text = await res.text();
  } catch {
    return `Request failed (${status} ${statusText}).`;
  }
  const trimmed = text?.trim() ?? "";
  if (!trimmed) {
    if (status === 401) return "You are not signed in. Please log in again.";
    if (status === 403) return "Access denied.";
    if (status >= 500) {
      return `Server error (${status}). If you are on Netlify, check DATABASE_URL or set UHC_DEMO_MODE=true.`;
    }
    return `Request failed (${status} ${statusText}).`;
  }
  try {
    const j = JSON.parse(trimmed);
    if (typeof j.error === "string" && j.error.trim()) return j.error.trim();
    if (typeof j.message === "string" && j.message.trim()) return j.message.trim();
  } catch {
    /* not JSON */
  }
  return trimmed.slice(0, 400);
}

const DEFAULT_TIMEOUT_MS = 45000;

export async function fetchJson(path, init = {}) {
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { timeoutMs: _t, ...rest } = init;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      ...rest,
      signal: controller.signal,
      credentials: rest.credentials ?? "include",
    });
    clearTimeout(tid);
    if (!res.ok) {
      throw new Error(await parseErrorBody(res));
    }
    return res.json();
  } catch (e) {
    clearTimeout(tid);
    if (e?.name === "AbortError") {
      throw new Error(
        "Request timed out. Check your connection, or Netlify function limits / database pooler."
      );
    }
    if (e instanceof Error && e.message) throw e;
    throw new Error(String(e) || "Network error");
  }
}
