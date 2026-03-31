"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useStore } from "@/context/StoreContext";
import VoiceCapture from "@/components/VoiceCapture";
import GuidedIntake from "@/components/GuidedIntake";
import PatientSearch from "@/components/PatientSearch";

export default function VoicePage() {
  const { t, lang } = useLanguage();
  const { addIntake, addPatient, patients } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState("freeform");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: "", age: "", nationalId: "" });
  const [registering, setRegistering] = useState(false);
  const [pendingIntake, setPendingIntake] = useState(null);
  const [showApproval, setShowApproval] = useState(false);

  const generateSummary = async (transcript) => {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      
      // Always return summary even if it's a demo/fallback
      const summaryText = data.summary || `Clinical Summary:

${transcript.slice(0, 400)}${transcript.length > 400 ? "..." : ""}

[Full AI summary unavailable. Please review transcript above.]`;
      
      setSummary(summaryText);
      return summaryText;
    } catch (err) {
      // Even on error, create a basic summary from transcript
      const fallbackSummary = `Patient History Summary:

${transcript.slice(0, 400)}${transcript.length > 400 ? "..." : ""}

[AI summary generation failed. Please review the transcript carefully.]`;
      
      setSummary(fallbackSummary);
      return fallbackSummary;
    } finally {
      setSummaryLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleQuickRegister = async (e) => {
    e.preventDefault();
    const age = parseInt(quickForm.age, 10);
    if (!quickForm.name.trim() || !age || age < 1 || age > 120) return;
    setRegistering(true);
    try {
      const id = await addPatient({
        name: quickForm.name.trim(),
        age,
        nationalId: quickForm.nationalId.trim() || undefined,
      });
      setSelectedPatientId(id);
      setShowQuickRegister(false);
      setQuickForm({ name: "", age: "", nationalId: "" });
    } catch (err) {
      const msg =
        (typeof err?.message === "string" && err.message.trim()) ||
        t("voice.quickRegisterError");
      alert(msg);
    } finally {
      setRegistering(false);
    }
  };

  const handleFreeformComplete = async (transcript, translation = "") => {
    if (!selectedPatient) return;
    setSummaryLoading(true);
    try {
      const summaryText = await generateSummary(transcript);
      setPendingIntake({
        date: new Date().toISOString(),
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        transcript,
        translation, // Store translation for approval screen
        summary: summaryText,
      });
      setShowApproval(true);
    } catch (err) {
      alert(lang === "bn" 
        ? "সংক্ষিপ্তসার তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
        : "Error generating summary. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGuidedComplete = async (fullTranscript, answers, translation = "") => {
    if (!selectedPatient) return;
    console.log("[Guided] Complete called with", Object.keys(answers || {}).length, "answers");
    setSummaryLoading(true);
    try {
      const summaryText = await generateSummary(fullTranscript);
      setPendingIntake({
        date: new Date().toISOString(),
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        transcript: fullTranscript,
        translation, // Now includes translation from guided intake
        summary: summaryText,
      });
      setShowApproval(true);
    } catch (err) {
      console.error("[Guided] Error:", err);
      alert(lang === "bn" 
        ? "সংক্ষিপ্তসার তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
        : "Error generating summary. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!pendingIntake) return;
    console.log("[Save] Saving intake to patient:", pendingIntake.patientId, pendingIntake.patientName);
    console.log("[Save] Transcript:", pendingIntake.transcript?.substring(0, 50) + "...");
    console.log("[Save] Translation:", pendingIntake.translation?.substring(0, 50) + "...");
    console.log("[Save] Summary:", pendingIntake.summary?.substring(0, 50) + "...");
    
    try {
      await addIntake(pendingIntake);
      console.log("[Save] ✅ Intake saved successfully");
      setPendingIntake(null);
      setShowApproval(false);
      setShowSuccess(true);
    } catch (err) {
      console.error("[Save] ❌ Error saving intake:", err);
      alert(lang === "bn" 
        ? "সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
        : "Error saving intake. Please try again.");
    }
  };

  const handleDiscard = () => {
    setPendingIntake(null);
    setShowApproval(false);
    setSummary("");
  };

  if (showApproval && pendingIntake) {
    return (
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold text-primary font-bangla">
            {t("voice.reviewTitle")}
          </h2>
          <p className="text-primary/80 text-sm mt-1">
            {t("voice.reviewSubtitle")}
          </p>
        </section>

        <div className="card rounded-xl bg-blue-50 border-2 border-blue-300 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 text-xl">👤</span>
            <p className="font-semibold text-blue-900">{selectedPatient?.name}</p>
          </div>
          <p className="text-xs text-blue-700">
            {selectedPatient?.age} {lang === "bn" ? "বছর" : "yrs"}
            {selectedPatient?.village && ` • ${selectedPatient.village}`}
          </p>
        </div>

        {pendingIntake.summary && (
          <div className="card rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span>📋</span>
              <p className="text-sm font-bold text-primary uppercase tracking-wide font-bangla">
                {t("voice.clinicalSummaryLabel")}
              </p>
            </div>
            <div className="p-4 bg-primary/5 rounded-xl text-sm text-primary whitespace-pre-wrap leading-relaxed border border-primary/20">
              {pendingIntake.summary}
            </div>
          </div>
        )}

        <div className="card rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span>🎤</span>
            <p className="text-sm font-bold text-primary uppercase tracking-wide font-bangla">
              {t("voice.transcriptLabel")}
            </p>
          </div>
          <div className="p-4 bg-surface/30 rounded-xl text-sm text-primary/90 font-bangla whitespace-pre-wrap leading-relaxed border border-primary/20 max-h-64 overflow-y-auto">
            {pendingIntake.transcript || t("voice.noAudio")}
          </div>
          
          {pendingIntake.translation && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <span>🔄</span>
                <p className="text-xs font-bold text-primary/70 uppercase tracking-wide">
                  {lang === "bn" ? "ইংরেজি অনুবাদ" : "English Translation"}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-blue-200">
                {pendingIntake.translation}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleApprove}
            className="btn btn-primary flex-1 py-4 text-base font-bold shadow-lg"
          >
            <span className="text-xl mr-2">✓</span>
            {t("voice.approveAndSave")}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            className="btn bg-red-50 border-2 border-red-300 text-red-700 hover:bg-red-100 flex-1 py-4 text-base font-bold"
          >
            <span className="text-xl mr-2">✕</span>
            {t("voice.discard")}
          </button>
        </div>

        <Link href="/" className="block text-center text-sm text-primary/70 hover:underline">
          {t("voice.backToDashboard")}
        </Link>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="space-y-6">
        <div className="card rounded-xl bg-green-50 border-green-200 p-6 text-center">
          <span className="text-5xl block mb-3">✓</span>
          <p className="text-green-800 font-semibold font-bangla text-lg mb-4">
            {lang === "bn" ? "ইতিহাস সংরক্ষিত হয়েছে" : "History saved successfully"}
          </p>
          
          {summary && (
            <div className="mt-4 p-4 bg-white rounded-xl text-left">
              <p className="text-xs text-primary/70 mb-2 font-semibold uppercase tracking-wide">
                {lang === "bn" ? "ক্লিনিকাল সংক্ষিপ্তসার" : "Clinical Summary"}
              </p>
              <div className="text-sm text-primary whitespace-pre-wrap leading-relaxed">
                {summary}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowSuccess(false);
                setSummary("");
                setMode("freeform");
              }}
              className="btn btn-primary flex-1"
            >
              {t("voice.newIntake")}
            </button>
            <Link href="/" className="btn btn-ghost flex-1">
              {t("voice.backToDashboard")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canStartIntake = !!selectedPatient;

  // Loading state while generating summary
  if (summaryLoading) {
    return (
      <div className="space-y-6">
        <div className="card rounded-xl bg-blue-50 border-blue-200 p-8 text-center">
          <div className="animate-spin text-5xl mb-4">⏳</div>
          <p className="text-blue-900 font-semibold text-lg mb-2 font-bangla">
            {lang === "bn" ? "সংক্ষিপ্তসার তৈরি হচ্ছে..." : "Generating clinical summary..."}
          </p>
          <p className="text-blue-700 text-sm">
            {lang === "bn" 
              ? "AI ক্লিনিকাল সংক্ষিপ্তসার প্রস্তুত করছে। অনুগ্রহ করে অপেক্ষা করুন।"
              : "AI is preparing the clinical summary. Please wait."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold text-primary font-bangla">{t("voice.title")}</h2>
        <p className="text-primary/80 text-sm mt-1">{t("voice.subtitle")}</p>
      </section>

      <div className="card rounded-xl bg-amber-50 border-amber-200">
        <p className="text-sm font-semibold text-amber-900 mb-3 font-bangla">
          {lang === "bn" ? "রোগী নির্বাচন করুন" : "Select Patient"}
        </p>
        
        {patients.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-amber-800 mb-3 font-bangla">
              {lang === "bn" ? "কোনো রোগী নিবন্ধিত নেই" : "No patients registered yet"}
            </p>
            <button
              type="button"
              onClick={() => setShowQuickRegister(true)}
              className="btn btn-primary text-sm"
            >
              {lang === "bn" ? "রোগী নিবন্ধন করুন" : "Register Patient"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <PatientSearch
              patients={patients}
              selectedId={selectedPatientId}
              onSelect={setSelectedPatientId}
            />
            <button
              type="button"
              onClick={() => setShowQuickRegister(true)}
              className="btn btn-ghost text-sm w-full"
            >
              + {lang === "bn" ? "নতুন রোগী নিবন্ধন" : "Register new patient"}
            </button>
          </div>
        )}
      </div>

      {showQuickRegister && (
        <div className="card rounded-xl bg-surface/50 border-primary/30">
          <p className="text-sm font-semibold text-primary mb-3 font-bangla">
            {lang === "bn" ? "দ্রুত রোগী নিবন্ধন" : "Quick Patient Registration"}
          </p>
          <form onSubmit={handleQuickRegister} className="space-y-3">
            <div>
              <label className="label font-bangla">{t("patients.name")}</label>
              <input
                type="text"
                value={quickForm.name}
                onChange={(e) => setQuickForm(f => ({ ...f, name: e.target.value }))}
                className="input w-full"
                placeholder={t("patients.namePlaceholder")}
                required
              />
            </div>
            <div>
              <label className="label font-bangla">{t("patients.age")}</label>
              <input
                type="number"
                min={1}
                max={120}
                value={quickForm.age}
                onChange={(e) => setQuickForm(f => ({ ...f, age: e.target.value }))}
                className="input w-full"
                placeholder={t("patients.agePlaceholder")}
                required
              />
            </div>
            <div>
              <label className="label font-bangla">{t("patients.nationalId")}</label>
              <input
                type="text"
                value={quickForm.nationalId}
                onChange={(e) => setQuickForm(f => ({ ...f, nationalId: e.target.value }))}
                className="input w-full"
                placeholder={t("patients.nationalIdPlaceholder")}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1" disabled={registering}>
                {registering ? t("common.loading") : t("patients.submit")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuickRegister(false);
                  setQuickForm({ name: "", age: "" });
                }}
                className="btn btn-ghost"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {!canStartIntake && !showQuickRegister && (
        <div className="card rounded-xl bg-red-50 border-red-200 p-4 text-center">
          <p className="text-sm text-red-800 font-bangla">
            {lang === "bn" 
              ? "ইতিহাস নেওয়ার আগে একজন রোগী নির্বাচন করুন বা নিবন্ধন করুন" 
              : "Please select or register a patient before starting intake"}
          </p>
        </div>
      )}

      {canStartIntake && (
      <>
        <div className="card rounded-xl bg-green-50 border-green-200 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <div className="flex-1">
              <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">
                {lang === "bn" ? "নির্বাচিত রোগী" : "Selected Patient"}
              </p>
              <p className="text-sm text-green-900 font-semibold font-bangla">
                {selectedPatient.name} ({selectedPatient.age} {lang === "bn" ? "বছর" : "yrs"})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPatientId("")}
              className="text-xs text-green-700 font-medium hover:underline"
            >
              {lang === "bn" ? "পরিবর্তন" : "Change"}
            </button>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-surface rounded-xl border border-primary/20">
          <button
            type="button"
            onClick={() => setMode("freeform")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold font-bangla transition ${
              mode === "freeform"
                ? "bg-primary text-white"
                : "text-primary hover:bg-primary/5"
            }`}
          >
            {lang === "bn" ? "মুক্ত বর্ণনা" : "Free-form"}
          </button>
          <button
            type="button"
            onClick={() => setMode("guided")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold font-bangla transition ${
              mode === "guided"
                ? "bg-primary text-white"
                : "text-primary hover:bg-primary/5"
            }`}
          >
            {lang === "bn" ? "প্রশ্নাবলী" : "Guided Questions"}
          </button>
        </div>

        {mode === "freeform" ? (
          <>
            <section className="card rounded-xl bg-surface/40 border-primary/20 p-4">
              <h3 className="font-semibold text-primary text-sm mb-2 font-bangla">
                {t("voice.instructionTitle")}
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary/90">
                <li className="font-bangla">{t("voice.instruction1")}</li>
                <li className="font-bangla">{t("voice.instruction2")}</li>
                <li className="font-bangla">{t("voice.instruction3")}</li>
              </ol>
            </section>

            <VoiceCapture onTranscriptReady={handleFreeformComplete} />
          </>
        ) : (
          <GuidedIntake onComplete={handleGuidedComplete} />
        )}
      </>
      )}

      <div className="flex gap-3">
        <Link href="/" className="btn btn-ghost flex-1 text-center">
          {t("voice.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
