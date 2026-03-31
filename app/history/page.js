"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useStore } from "@/context/StoreContext";

function HistoryContent() {
  const { t } = useLanguage();
  const { intakes } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copiedId, setCopiedId] = useState(null);
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    const id = searchParams.get("id");
    setDetailId(id || null);
  }, [searchParams]);

  const selectedIntake = detailId ? intakes.find((i) => i.id === detailId) : null;

  const copyTranscript = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold text-primary font-bangla">{t("history.title")}</h2>
        <p className="text-primary/80 text-sm mt-1">{t("history.subtitle")}</p>
      </section>

      {selectedIntake ? (
        <div className="space-y-4">
          <Link href="/history" className="btn btn-ghost text-sm inline-block">
            ← {t("common.back")}
          </Link>
          <div className="card rounded-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="font-semibold text-primary">{selectedIntake.patientName}</p>
              <p className="text-xs text-primary/70">
                {new Date(selectedIntake.date).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            
            {selectedIntake.summary && (
              <div className="mb-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 text-xl">📋</span>
                    <p className="text-sm font-bold text-blue-900 uppercase tracking-wide">
                      {t("history.clinicalSummary")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyTranscript(selectedIntake.id + "-summary", selectedIntake.summary)}
                    className="px-3 py-1.5 text-xs bg-white hover:bg-blue-50 text-blue-800 rounded-lg border border-blue-300 transition font-medium"
                  >
                    {copiedId === selectedIntake.id + "-summary" ? "✓ Copied" : "📋 Copy"}
                  </button>
                </div>
                <div className="p-4 bg-white rounded-lg text-sm whitespace-pre-wrap break-words leading-relaxed shadow-sm">
                  {selectedIntake.summary}
                </div>
              </div>
            )}
            
            <div className="p-5 bg-gradient-to-br from-surface/50 to-surface rounded-xl border-2 border-primary/20 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xl">🎤</span>
                  <p className="text-sm font-bold text-primary uppercase tracking-wide">
                    {t("voice.transcript")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyTranscript(selectedIntake.id, selectedIntake.transcript)}
                  className="px-3 py-1.5 text-xs bg-white hover:bg-primary/10 text-primary rounded-lg border border-primary/30 transition font-medium"
                >
                  {copiedId === selectedIntake.id ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
              <div className="p-4 bg-white rounded-lg text-sm whitespace-pre-wrap break-words font-bangla leading-relaxed min-h-[120px] shadow-sm">
                {selectedIntake.transcript || "—"}
              </div>
              
              {selectedIntake.translation && (
                <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">🔄</span>
                      <p className="text-xs font-bold text-green-900 uppercase tracking-wide">
                        English Translation
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyTranscript(selectedIntake.id + "-translation", selectedIntake.translation)}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-green-50 text-green-800 rounded-md border border-green-300 transition font-medium"
                    >
                      {copiedId === selectedIntake.id + "-translation" ? "✓" : "📋"}
                    </button>
                  </div>
                  <div className="p-3 bg-white rounded-md text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedIntake.translation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {intakes.length === 0 ? (
            <div className="card rounded-xl py-12 text-center">
              <p className="text-primary/80 font-medium">{t("history.noHistory")}</p>
              <p className="text-primary/60 text-sm mt-1">{t("history.noHistorySub")}</p>
              <Link href="/voice" className="btn btn-primary mt-4 inline-block">
                {t("dashboard.startNew")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {intakes.map((i) => (
                <li key={i.id} className="card rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => router.push(`/history?id=${i.id}`)}
                    className="w-full text-left p-4 hover:bg-surface/50 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-semibold text-primary truncate">{i.patientName}</p>
                      <span className="text-primary/70 text-xs shrink-0">
                        {new Date(i.date).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    
                    {i.summary && (
                      <div className="mb-2">
                        <p className="text-xs text-primary/50 uppercase tracking-wide font-semibold mb-1">
                          Clinical Summary
                        </p>
                        <p className="text-sm text-primary/90 line-clamp-3 leading-relaxed">
                          {i.summary.slice(0, 200)}
                          {i.summary.length > 200 ? "…" : ""}
                        </p>
                      </div>
                    )}
                    
                    {!i.summary && i.transcript && (
                      <p className="text-sm text-primary/70 mt-1 line-clamp-2 font-bangla">
                        {i.transcript.slice(0, 120) || "—"}
                        {(i.transcript?.length || 0) > 120 ? "…" : ""}
                      </p>
                    )}
                    
                    <p className="text-xs text-primary/60 mt-2">
                      {i.summary ? t("history.viewDetails") : t("history.viewTranscript")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-40 bg-surface rounded-xl" />}>
      <HistoryContent />
    </Suspense>
  );
}
