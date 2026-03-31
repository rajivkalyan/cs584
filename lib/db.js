import { prisma } from "@/lib/prisma";
import { useDemoMode } from "@/lib/runtimeEnv";

function demoModeEnabled() {
  return useDemoMode();
}

function getMem() {
  if (!globalThis.__uhcDemoDb) {
    globalThis.__uhcDemoDb = {
      patientsByUser: new Map(),
      intakesByUser: new Map(),
    };
  }
  return globalThis.__uhcDemoDb;
}

export const db = {
  isDemoMode: demoModeEnabled,

  async listPatients(userId) {
    if (demoModeEnabled()) {
      const mem = getMem();
      const arr = mem.patientsByUser.get(userId) || [];
      return [...arr].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return prisma.patient.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async createPatient(userId, data) {
    if (demoModeEnabled()) {
      const mem = getMem();
      const patient = {
        id: "P" + Date.now(),
        userId,
        createdAt: Date.now(),
        ...data,
      };
      const arr = mem.patientsByUser.get(userId) || [];
      mem.patientsByUser.set(userId, [patient, ...arr]);
      return patient;
    }
    return prisma.patient.create({
      data: {
        userId,
        ...data,
      },
    });
  },

  async updatePatient(userId, patientId, updates) {
    if (demoModeEnabled()) {
      const mem = getMem();
      const arr = mem.patientsByUser.get(userId) || [];
      const idx = arr.findIndex(p => p.id === patientId && p.userId === userId);
      if (idx === -1) {
        const err = new Error("Patient not found");
        err.status = 404;
        throw err;
      }
      arr[idx] = { ...arr[idx], ...updates };
      mem.patientsByUser.set(userId, arr);
      return arr[idx];
    }
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId },
    });
    if (!patient) {
      const err = new Error("Patient not found");
      err.status = 404;
      throw err;
    }
    return prisma.patient.update({
      where: { id: patientId },
      data: updates,
    });
  },

  async deletePatient(userId, patientId) {
    if (demoModeEnabled()) {
      const mem = getMem();
      const arr = mem.patientsByUser.get(userId) || [];
      const filtered = arr.filter(p => p.id !== patientId);
      if (filtered.length === arr.length) {
        const err = new Error("Patient not found");
        err.status = 404;
        throw err;
      }
      mem.patientsByUser.set(userId, filtered);
      return { success: true };
    }
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId },
    });
    if (!patient) {
      const err = new Error("Patient not found");
      err.status = 404;
      throw err;
    }
    await prisma.patient.delete({
      where: { id: patientId },
    });
    return { success: true };
  },

  async listIntakes(userId) {
    if (demoModeEnabled()) {
      const mem = getMem();
      const arr = mem.intakesByUser.get(userId) || [];
      return [...arr].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return prisma.intake.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: { patient: true },
    });
  },

  async createIntake(userId, data) {
    if (demoModeEnabled()) {
      const mem = getMem();
      const intake = {
        id: "I" + Date.now(),
        userId,
        patientId: data.patientId || null,
        patientName: data.patientName || "—",
        transcript: data.transcript || null,
        translation: data.translation || null,
        summary: data.summary || null,
        date: data.date ? new Date(data.date) : new Date(),
      };
      const arr = mem.intakesByUser.get(userId) || [];
      mem.intakesByUser.set(userId, [intake, ...arr]);
      return intake;
    }
    return prisma.intake.create({
      data: {
        userId,
        ...data,
      },
    });
  },
};
