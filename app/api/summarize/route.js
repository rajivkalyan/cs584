import { NextResponse } from "next/server";
import OpenAI from "openai";

const DEMO_SUMMARY = "[Demo: Clinical summary requires OPENAI_API_KEY. Add it to .env and restart.]";

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  
  let transcript = "";
  
  try {
    const body = await request.json();
    transcript = body.transcript || "";
    
    if (!transcript.trim()) {
      return NextResponse.json({ error: "Empty transcript" }, { status: 400 });
    }

    if (!apiKey) {
      // Demo mode fallback
      return NextResponse.json({ 
        summary: `Clinical Summary (Demo Mode):

Patient History:
${transcript.slice(0, 350)}${transcript.length > 350 ? "..." : ""}

[Note: AI-powered summary requires OPENAI_API_KEY. This is the original transcript excerpt.]`
      });
    }

    const openai = new OpenAI({ apiKey });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a medical scribe for a primary health clinic in Bangladesh. Generate a concise clinical summary from the patient's spoken history in the following structured format:

Chief Complaint: [main problem]
Duration: [how long]
Severity/Impact: [effect on daily activities]
Previous Treatment: [any medications or remedies tried]
Associated Symptoms: [other symptoms mentioned]

Keep it brief, clinical, and factual. Use bullet points if needed. If information is not provided, write "Not mentioned."`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || "";
    
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Summary generation failed:", err);
    
    // Return demo summary on error (API quota, network issues, etc.)
    const demoSummary = `Clinical Summary (Fallback):

Patient History from transcript:
${transcript.slice(0, 350)}${transcript.length > 350 ? "..." : ""}

[Note: AI summary unavailable due to API error. Please review the full transcript below for complete information.]`;

    return NextResponse.json({ summary: demoSummary });
  }
}
