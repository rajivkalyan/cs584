"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchJson } from "@/lib/apiClient";

const StoreContext = createContext(null);

async function apiGet(path) {
  return fetchJson(path, { method: "GET" });
}

async function apiPost(path, body) {
  return fetchJson(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function apiPatch(path, body) {
  return fetchJson(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function apiDelete(path) {
  return fetchJson(path, { method: "DELETE" });
}

export function StoreProvider({ children }) {
  const { status } = useSession();
  const [patients, setPatients] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setPatients([]);
      setIntakes([]);
      setLoading(status === "loading");
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setLoading(true);
    Promise.all([apiGet("/api/patients"), apiGet("/api/intakes")])
      .then(([pList, iList]) => {
        if (!cancelled) {
          setPatients(pList);
          setIntakes(iList);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [status]);

  const addPatient = useCallback(async (patient) => {
    const created = await apiPost("/api/patients", patient);
    setPatients((p) => [created, ...p]);
    return created.id;
  }, []);

  const updatePatient = useCallback(async (patientId, updates) => {
    const updated = await apiPatch(`/api/patients/${patientId}`, updates);
    setPatients((p) => p.map(patient => patient.id === patientId ? updated : patient));
    return updated;
  }, []);

  const deletePatient = useCallback(async (patientId) => {
    await apiDelete(`/api/patients/${patientId}`);
    setPatients((p) => p.filter(patient => patient.id !== patientId));
  }, []);

  const addIntake = useCallback(async (intake) => {
    const created = await apiPost("/api/intakes", {
      patientId: intake.patientId || null,
      patientName: intake.patientName ?? "—",
      transcript: intake.transcript ?? null,
      translation: intake.translation ?? null,
      summary: intake.summary ?? null,
      date: intake.date || new Date().toISOString(),
    });
    setIntakes((i) => [{ ...created, date: created.date }, ...i]);
    return created.id;
  }, []);

  const todayCount = intakes.filter((i) => {
    const d = new Date(i.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <StoreContext.Provider
      value={{
        patients,
        intakes,
        addPatient,
        updatePatient,
        deletePatient,
        addIntake,
        todayCount,
        loading,
        error,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
