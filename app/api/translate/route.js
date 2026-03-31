import { NextResponse } from "next/server";

/**
 * Free translation via MyMemory API (no key, ~500 chars/request).
 * GET /api/translate?text=...&from=bn&to=en
 */
const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const MAX_CHUNK = 400;

function chunkText(text, maxLen = MAX_CHUNK) {
  const out = [];
  let rest = text.trim();
  while (rest.length > 0) {
    if (rest.length <= maxLen) {
      out.push(rest);
      break;
    }
    const slice = rest.slice(0, maxLen);
    const lastSpace = slice.lastIndexOf(" ");
    const cut = lastSpace > maxLen / 2 ? lastSpace : maxLen;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  return out.filter(Boolean);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text")?.trim();
  const from = searchParams.get("from") || "bn";
  const to = searchParams.get("to") || "en";

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const langpair = `${from}|${to}`;
  const chunks = chunkText(text);

  try {
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const res = await fetch(
          `${MYMEMORY_URL}?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(langpair)}`,
          { headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error("Translation request failed");
        const data = await res.json();
        return data?.responseData?.translatedText ?? chunk;
      })
    );
    const translated = results.join(" ");
    return NextResponse.json({ translated });
  } catch (err) {
    console.error("Translate error:", err?.message);
    return NextResponse.json(
      { error: "Translation failed", translated: "" },
      { status: 500 }
    );
  }
}
