import { NextResponse } from "next/server";
import { getSession, requireSession } from "@/lib/session";
import { db } from "@/lib/db";

/** PATCH /api/patients/[id] — update a patient */
export async function PATCH(request, { params }) {
  try {
    const session = await getSession();
    requireSession(session);
    const { id } = params;
    const body = await request.json();
    const { name, age, gender, village, phone, nationalId } = body;
    
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (age !== undefined) {
      const ageNum = typeof age === "number" ? age : parseInt(age, 10);
      if (ageNum < 1 || ageNum > 120) {
        return NextResponse.json(
          { error: "Invalid age: must be 1–120" },
          { status: 400 }
        );
      }
      updates.age = ageNum;
    }
    if (gender !== undefined) updates.gender = gender?.trim() || null;
    if (village !== undefined) updates.village = village?.trim() || null;
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (nationalId !== undefined) updates.nationalId = nationalId?.trim() || null;

    const patient = await db.updatePatient(session.user.id, id, updates);
    return NextResponse.json(patient);
  } catch (e) {
    if (e.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e.status === 404) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    throw e;
  }
}

/** DELETE /api/patients/[id] — delete a patient */
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    requireSession(session);
    const { id } = params;
    await db.deletePatient(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e.status === 404) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    throw e;
  }
}
