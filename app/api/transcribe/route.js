import { NextResponse } from "next/server";

/**
 * Whisper transcriptions API — follows OpenAI Speech-to-Text guide:
 * https://developers.openai.com/api/docs/guides/speech-to-text/
 * - POST /v1/audio/transcriptions, multipart/form-data: file, model, language, response_format
 * - Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm (max 25 MB)
 * - whisper-1 supports response_format: text | json | srt | verbose_json | vtt
 */

const DEMO_PLACEHOLDER =
  "[Demo: Voice recorded. Add OPENAI_API_KEY in .env and restart for real Bangla transcription.]";

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";

/** Optional prompt to improve Whisper quality (medical/Bangla context). See Speech-to-Text docs. */
const PROMPT = "Medical history intake. Patient describing symptoms in Bengali or English.";

/** GET /api/transcribe — connectivity check. Open in browser to debug. */
export async function GET() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({
      ok: false,
      error: "OPENAI_API_KEY is missing or empty in .env",
      fix: "Add OPENAI_API_KEY=sk-... to .env and restart the server",
    }, { status: 200 });
  }

  const results = { steps: [] };

  try {
    results.steps.push({ step: "DNS/connect", status: "checking..." });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const res = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    results.steps.push({ step: "DNS/connect", status: "ok", statusCode: res.status });

    if (res.status === 401) {
      results.ok = false;
      results.error = "Invalid API key (401). Check OPENAI_API_KEY in .env.";
      results.fix = "Get a key from https://platform.openai.com/api-keys";
      return NextResponse.json(results, { status: 200 });
    }
    if (!res.ok) {
      results.ok = false;
      results.error = `OpenAI returned ${res.status}`;
      results.body = await res.text().catch(() => "");
      return NextResponse.json(results, { status: 200 });
    }

    const data = await res.json();
    results.ok = true;
    results.message = "Connectivity OK. Whisper should work.";
    results.steps.push({ step: "API key", status: "valid" });
    return NextResponse.json(results, { status: 200 });
  } catch (e) {
    const err = e?.cause || e;
    const code = err?.code || e?.code;
    const message = err?.message || e?.message || String(e);
    results.ok = false;
    results.error = message;
    results.errorCode = code;
    results.steps.push({ step: "DNS/connect", status: "failed", code, message });

    if (code === "ECONNREFUSED") {
      results.fix = "Connection refused. Is OpenAI blocked on your network (firewall/VPN/country)? Try another network or VPN.";
    } else if (code === "ECONNRESET" || message?.includes("aborted")) {
      results.fix = "Connection reset or timeout. Try: 1) Different network 2) VPN if OpenAI is restricted in your region 3) Check firewall.";
    } else if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
      results.fix = "DNS could not resolve api.openai.com. Check DNS/internet or try another network.";
    } else {
      results.fix = "Check .env and network. See errorCode and error above.";
    }
    return NextResponse.json(results, { status: 200 });
  }
}

export async function POST(request) {
  const hasKey = process.env.OPENAI_API_KEY?.trim();
  if (!hasKey) {
    return NextResponse.json({ text: DEMO_PLACEHOLDER });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file") ?? formData.get("audio");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "Missing audio file (field: file or audio)" },
      { status: 400 }
    );
  }

  const audioFile = file instanceof File ? file : new File([await file.arrayBuffer()], "audio.webm", { type: file.type || "audio/webm" });

  if (process.env.NODE_ENV !== "production") {
    console.log("Whisper: audio size", Math.round(audioFile.size / 1024), "KB");
  }

  const isAbortOrConnectionError = (e) =>
    e?.name === "AbortError" ||
    e?.message?.toLowerCase?.().includes("aborted") ||
    e?.code === "ECONNRESET" ||
    e?.cause?.code === "ECONNRESET" ||
    e?.message?.includes("Connection error") ||
    e?.message?.includes("ECONNRESET");

  const maxRetries = 2;
  const timeoutMs = 60000; // 60s — upload + Whisper processing can take longer than 25s
  const demoFallback =
    process.env.UHC_DEMO_FALLBACK === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.UHC_DEMO_FALLBACK !== "false");

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const form = new FormData();
      form.append("file", audioFile);
      form.append("model", "whisper-1");
      form.append("language", "bn");
      form.append("response_format", "text");
      form.append("prompt", PROMPT);

      const res = await fetch(WHISPER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hasKey}`,
        },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errBody = await res.text();
        if (process.env.NODE_ENV !== "production") {
          console.error("Whisper API error", res.status, errBody);
        }
        if (res.status === 401) {
          return NextResponse.json({ error: "API key invalid. Check OPENAI_API_KEY in .env." }, { status: 401 });
        }
        if (res.status === 429) {
          let message = "Too many requests. Try again in a moment.";
          try {
            const errJson = JSON.parse(errBody);
            if (errJson?.error?.code === "insufficient_quota") {
              message =
                "OpenAI quota exceeded. Add credits or check billing: https://platform.openai.com/account/billing";
            }
          } catch (_) {}
          return NextResponse.json({ error: message }, { status: 429 });
        }
        return NextResponse.json(
          { error: res.status === 500 ? "OpenAI server error. Try again." : errBody || "Transcription failed." },
          { status: res.status }
        );
      }

      const text = (await res.text()).trim();
      return NextResponse.json({ text });
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt <= maxRetries && isAbortOrConnectionError(err)) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      const errDetail = {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        cause: err?.cause ? { code: err.cause?.code, message: err.cause?.message } : undefined,
      };
      if (process.env.NODE_ENV !== "production") {
        console.error("Whisper transcription failed after", attempt, "attempt(s):", errDetail);
      }
      if (demoFallback && isAbortOrConnectionError(err)) {
        return NextResponse.json({
          text: "[Demo: Server could not reach transcription. Check internet. Your recording was received.]",
          debug: process.env.NODE_ENV !== "production" ? errDetail : undefined,
        });
      }
      const status = err?.status === 401 ? 401 : err?.status === 429 ? 429 : 500;
      const message =
        status === 401
          ? "API key invalid. Check server configuration."
          : status === 429
            ? "Too many requests. Please try again in a moment."
            : isAbortOrConnectionError(err)
              ? "Connection to transcription service failed. Check internet and try again."
              : "Transcription failed. Please try again.";
      return NextResponse.json({ error: message, code: err?.code }, { status });
    }
  }

  if (demoFallback) {
    return NextResponse.json({
      text: "[Demo: Transcription failed after retries. Check internet. Add OPENAI_API_KEY for real transcription.]",
    });
  }
  return NextResponse.json(
    { error: "Transcription failed. Please try again." },
    { status: 500 }
  );
}
