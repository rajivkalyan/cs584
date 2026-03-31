"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useStore } from "@/context/StoreContext";

function PatientCard({ patient, intakes, onUpdate, onDelete }) {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: patient.name,
    age: patient.age,
    gender: patient.gender || "",
    village: patient.village || "",
    phone: patient.phone || "",
    nationalId: patient.nationalId || "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const patientIntakes = intakes.filter(i => i.patientId === patient.id);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(patient.id, editForm);
      setEditing(false);
    } catch (err) {
      alert(
        (typeof err?.message === "string" && err.message.trim()) ||
          t("patients.apiError")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("patients.confirmDelete"))) return;
    setDeleting(true);
    try {
      await onDelete(patient.id);
    } catch (err) {
      alert(
        (typeof err?.message === "string" && err.message.trim()) ||
          t("patients.apiError")
      );
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="border-2 border-primary/20 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-left hover:underline focus:outline-none mb-1"
            >
              <p className="font-bold text-primary text-lg">{patient.name}</p>
            </button>
            <div className="flex flex-wrap gap-3 text-sm text-primary/70">
              <span>{patient.age} {lang === "bn" ? "বছর" : "yrs"}</span>
              {patient.gender && <span>• {patient.gender}</span>}
              {patient.village && <span>• 📍 {patient.village}</span>}
            </div>
            {patient.phone && (
              <p className="text-sm text-primary/60 mt-1">📞 {patient.phone}</p>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="p-2 hover:bg-primary/10 rounded-lg transition text-primary/60 hover:text-primary"
              title={t("patients.edit")}
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 hover:bg-red-50 rounded-lg transition text-red-500 hover:text-red-700"
              title={t("patients.delete")}
            >
              {deleting ? "⏳" : "🗑️"}
            </button>
          </div>
        </div>
      </div>

      {(expanded || editing) && (
        <div className="border-t-2 border-primary/20 bg-gradient-to-b from-surface/30 to-surface/10 p-5 space-y-5">
          {editing && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary text-sm flex-1 font-semibold"
              >
                {saving ? "⏳ Saving..." : `✓ ${t("patients.save")}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditForm({
                    name: patient.name,
                    age: patient.age,
                    gender: patient.gender || "",
                    village: patient.village || "",
                    phone: patient.phone || "",
                    nationalId: patient.nationalId || "",
                  });
                }}
                className="btn btn-ghost text-sm flex-1"
              >
                ✕ {t("patients.cancel")}
              </button>
            </div>
          )}

          <div className="p-4 bg-white rounded-xl border-2 border-primary/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-primary">ℹ️</span>
              <h4 className="text-sm font-bold text-primary font-bangla">
                {t("patients.patientInfo")}
              </h4>
            </div>
            
            {editing ? (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
                  <span className="text-blue-600">✏️</span>
                  <p className="text-xs text-blue-700 font-bold uppercase tracking-wide">{t("patients.editingMode")}</p>
                </div>
                <div>
                  <label className="label text-xs font-semibold">{t("patients.name")} *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs font-semibold">{t("patients.age")} *</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={editForm.age}
                      onChange={(e) => setEditForm(f => ({ ...f, age: parseInt(e.target.value, 10) }))}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">{t("patients.gender")}</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm(f => ({ ...f, gender: e.target.value }))}
                      className="input w-full"
                    >
                      <option value="">{t("patients.genderOption")}</option>
                      <option value="Male">{t("patients.male")}</option>
                      <option value="Female">{t("patients.female")}</option>
                      <option value="Other">{t("patients.other")}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label text-xs font-semibold">{t("patients.village")}</label>
                  <input
                    type="text"
                    value={editForm.village}
                    onChange={(e) => setEditForm(f => ({ ...f, village: e.target.value }))}
                    className="input w-full"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold">{t("patients.phone")}</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    className="input w-full"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold">{t("patients.nationalId")}</label>
                  <input
                    type="text"
                    value={editForm.nationalId}
                    onChange={(e) => setEditForm(f => ({ ...f, nationalId: e.target.value }))}
                    className="input w-full"
                    placeholder="Optional"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-xs text-primary/60 uppercase tracking-wide mb-1">{t("patients.name")}</p>
                    <p className="text-primary font-semibold">{patient.name}</p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-xs text-primary/60 uppercase tracking-wide mb-1">{t("patients.age")}</p>
                    <p className="text-primary font-semibold">{patient.age} {lang === "bn" ? "বছর" : "yrs"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {patient.gender ? (
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="text-xs text-primary/60 uppercase tracking-wide mb-1">{t("patients.gender")}</p>
                      <p className="text-primary font-semibold">{patient.gender}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <p className="text-xs text-primary/40 uppercase tracking-wide mb-1">{t("patients.gender")}</p>
                      <p className="text-primary/40 text-sm">—</p>
                    </div>
                  )}
                  {patient.village ? (
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="text-xs text-primary/60 uppercase tracking-wide mb-1">{t("patients.village")}</p>
                      <p className="text-primary font-semibold">{patient.village}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <p className="text-xs text-primary/40 uppercase tracking-wide mb-1">{t("patients.village")}</p>
                      <p className="text-primary/40 text-sm">—</p>
                    </div>
                  )}
                </div>
                {patient.phone && (
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-xs text-primary/60 uppercase tracking-wide mb-1">{t("patients.phone")}</p>
                    <p className="text-primary font-semibold">{patient.phone}</p>
                  </div>
                )}
                {patient.nationalId && (
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-xs text-primary/60 uppercase tracking-wide mb-1">{t("patients.nationalId")}</p>
                    <p className="text-primary font-semibold">{patient.nationalId}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-white rounded-xl border-2 border-primary/20 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-primary">📋</span>
                <h4 className="text-sm font-bold text-primary font-bangla">
                  {t("patients.intakesForPatient")}
                </h4>
              </div>
              <span className="text-xs bg-primary text-white px-2.5 py-1 rounded-full font-semibold">
                {patientIntakes.length}
              </span>
            </div>
            
            {patientIntakes.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-primary/60">
                  {t("patients.noIntakesForPatient")}
                </p>
                <Link
                  href={`/voice?preselect=${patient.id}`}
                  className="inline-block mt-3 text-xs text-primary font-medium hover:underline"
                >
                  + Start first intake
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {patientIntakes.map((intake) => (
                  <li key={intake.id} className="p-3 bg-gradient-to-r from-primary/5 to-surface/50 rounded-lg border border-primary/15 hover:border-primary/30 transition">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs text-primary/70 font-semibold">{formatDate(intake.date)}</p>
                      <Link
                        href={`/history?id=${intake.id}`}
                        className="text-xs text-white bg-primary px-3 py-1 rounded-full font-medium hover:bg-primary-dark transition"
                      >
                        {t("history.viewDetails")} →
                      </Link>
                    </div>
                    {intake.summary && (
                      <p className="text-xs text-primary/80 line-clamp-2 leading-relaxed">
                        {intake.summary.slice(0, 150)}
                        {intake.summary.length > 150 ? "..." : ""}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientsPage() {
  const { t } = useLanguage();
  const { patients, intakes, updatePatient, deletePatient } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    
    const query = searchQuery.toLowerCase();
    return patients.filter(p => {
      const name = (p.name || "").toLowerCase();
      const village = (p.village || "").toLowerCase();
      const phone = (p.phone || "").toLowerCase();
      const id = (p.id || "").toLowerCase();
      
      return name.includes(query) || 
             village.includes(query) || 
             phone.includes(query) || 
             id.includes(query);
    });
  }, [patients, searchQuery]);

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-primary font-bangla">{t("patients.title")}</h2>
          <p className="text-primary/80 text-sm mt-1">{t("patients.subtitle")}</p>
          {patients.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-primary text-white px-2.5 py-1 rounded-full font-semibold">
                {patients.length}
              </span>
              <span className="text-xs text-primary/60">{t("patients.totalPatients")}</span>
            </div>
          )}
        </div>
        <Link
          href="/patients/register"
          className="btn btn-primary shrink-0 shadow-md hover:shadow-lg"
        >
          <span className="text-lg" aria-hidden>+</span> {t("patients.registerNew")}
        </Link>
      </section>

      <section className="space-y-4">
        {patients.length === 0 ? (
          <div className="card rounded-xl py-12 text-center">
            <span className="text-6xl block mb-4">👤</span>
            <p className="text-primary/80 font-semibold text-lg font-bangla">{t("patients.noPatients")}</p>
            <p className="text-primary/60 text-sm mt-2">{t("patients.noPatientsSub")}</p>
            <Link
              href="/patients/register"
              className="inline-block btn btn-primary mt-6"
            >
              + {t("patients.registerNew")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card rounded-xl p-3 border-2 border-primary/30 bg-white shadow-md">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-xl">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("patients.searchPlaceholder")}
                  className="w-full pl-11 pr-10 py-3 text-base border-0 bg-transparent text-primary placeholder:text-primary/50 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/50 hover:text-primary text-lg font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="card rounded-xl py-12 text-center">
                <span className="text-5xl block mb-3">🔍</span>
                <p className="text-primary/70 font-medium">{t("patients.noResults")}</p>
                <p className="text-primary/50 text-sm mt-2">Try a different search term</p>
              </div>
            ) : (
              <>
                {searchQuery && (
                  <div className="flex items-center justify-between px-3 py-2 bg-primary/5 rounded-lg">
                    <p className="text-xs text-primary/70 font-medium">
                      {t("patients.showingResults")
                        .replace("{count}", filteredPatients.length)
                        .replace("{total}", patients.length)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
                
                <div className="space-y-3">
                  {filteredPatients.map((p) => (
                    <PatientCard
                      key={p.id}
                      patient={p}
                      intakes={intakes}
                      onUpdate={updatePatient}
                      onDelete={deletePatient}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
