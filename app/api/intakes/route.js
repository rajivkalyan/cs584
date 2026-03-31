import { NextResponse } from "next/server";
import { getSession, requireSession } from "@/lib/session";
import { db } from "@/lib/db";

/** GET /api/intakes — list intakes for the current physician */
export async function GET() {
  try {
    const session = await getSession();
    requireSession(session);
    const intakes = await db.listIntakes(session.user.id);
    const payload = intakes.map((i) => ({
      id: i.id,
      date: i.date,
      patientId: i.patientId,
      patientName: i.patientName,
      transcript: i.transcript,
      translation: i.translation,
      summary: i.summary,
      patient: i.patient
        ? {
            id: i.patient.id,
            name: i.patient.name,
            age: i.patient.age,
            village: i.patient.village,
          }
        : null,
    }));
    return NextResponse.json(payload);
  } catch (e) {
    if (e.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/intakes:", e);
    const message =
      e?.code === "P1001"
        ? "Cannot reach database. Set DATABASE_URL or UHC_DEMO_MODE=true on Netlify."
        : e?.message || "Failed to load intakes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/intakes — create an intake for the current physician */
export async function POST(request) {
  try {
    const session = await getSession();
    requireSession(session);
    const body = await request.json();
    const { patientId, patientName, transcript, translation, summary, date } = body;
    const intake = await db.createIntake(session.user.id, {
      patientId: patientId || null,
      patientName: (patientName && patientName.trim()) || "—",
      transcript: transcript?.trim() || null,
      translation: translation?.trim() || null,
      summary: summary?.trim() || null,
      date: date ? new Date(date) : new Date(),
    });
    return NextResponse.json({
      id: intake.id,
      date: intake.date,
      patientId: intake.patientId,
      patientName: intake.patientName,
      transcript: intake.transcript,
      translation: intake.translation,
      summary: intake.summary,
    });
  } catch (e) {
    if (e.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/intakes:", e);
    let message = e?.message || "Failed to save intake";
    if (e?.code === "P1001" || /Can't reach database/i.test(message)) {
      message =
        "Cannot reach database. On Netlify, set DATABASE_URL (Neon pooler) or UHC_DEMO_MODE=true.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
