import { NextResponse } from "next/server";
import { getSession, requireSession } from "@/lib/session";
import { db } from "@/lib/db";

/** GET /api/patients — list patients for the current physician */
export async function GET() {
  try {
    const session = await getSession();
    requireSession(session);
    const patients = await db.listPatients(session.user.id);
    return NextResponse.json(patients);
  } catch (e) {
    if (e.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/patients:", e);
    const message =
      e?.code === "P1001"
        ? "Cannot reach database. Set DATABASE_URL or UHC_DEMO_MODE=true on Netlify."
        : e?.message || "Failed to load patients";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/patients — create a patient for the current physician */
export async function POST(request) {
  try {
    const session = await getSession();
    requireSession(session);
    const body = await request.json();
    const { name, age, gender, village, phone, nationalId } = body;
    const ageNum = typeof age === "number" ? age : parseInt(age, 10);
    if (!name?.trim() || !ageNum || ageNum < 1 || ageNum > 120) {
      return NextResponse.json(
        { error: "Invalid input: name and age (1–120) required" },
        { status: 400 }
      );
    }
    const patient = await db.createPatient(session.user.id, {
      name: name.trim(),
      age: ageNum,
      gender: gender?.trim() || null,
      village: village?.trim() || null,
      phone: phone?.trim() || null,
      nationalId: nationalId?.trim() || null,
    });
    return NextResponse.json(patient);
  } catch (e) {
    if (e.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/patients:", e);
    const code = e?.code;
    let message = e?.message || "Failed to create patient";
    if (code === "P1001" || /Can't reach database/i.test(message)) {
      message =
        "Cannot reach database. On Netlify, set a valid DATABASE_URL (e.g. Neon pooler) or UHC_DEMO_MODE=true.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
