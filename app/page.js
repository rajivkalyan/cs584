"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useStore } from "@/context/StoreContext";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { intakes, todayCount, loading, error } = useStore();
  const recent = intakes.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-primary/70">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="card rounded-xl bg-amber-50 border-amber-200 p-4 text-amber-800 text-sm">
          {error}
        </div>
      )}
      <section>
        <h2 className="text-lg font-bold text-primary font-bangla mb-1">
          {t("dashboard.welcome")}
        </h2>
        <p className="text-primary/70 text-sm">{t("appSubtitle")}</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card rounded-xl bg-primary/5 border-primary/30">
          <p className="text-3xl font-bold text-primary">{todayCount}</p>
          <p className="text-sm text-primary/80 font-medium">{t("dashboard.todayIntakes")}</p>
        </div>
        <div className="card rounded-xl bg-surface/50 border-primary/20">
          <p className="text-sm text-primary/80">{t("dashboard.viewAll")}</p>
          <Link href="/history" className="text-primary font-semibold text-sm hover:underline">
            → {t("history.title")}
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <Link
          href="/voice"
          className="block card rounded-xl border-2 border-primary bg-primary text-white hover:bg-primary-dark transition p-5"
        >
          <span className="text-3xl block mb-2" aria-hidden>🎤</span>
          <h3 className="font-bold text-lg font-bangla">{t("dashboard.startNew")}</h3>
          <p className="text-white/90 text-sm mt-1">{t("dashboard.startNewSub")}</p>
        </Link>
        <Link
          href="/patients/register"
          className="block card rounded-xl border-2 border-primary bg-white hover:bg-surface/50 transition p-5"
        >
          <span className="text-3xl block mb-2" aria-hidden>👤</span>
          <h3 className="font-bold text-lg font-bangla text-primary">{t("dashboard.registerPatient")}</h3>
          <p className="text-primary/80 text-sm mt-1">{t("dashboard.registerPatientSub")}</p>
        </Link>
      </section>

      <section className="card rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-primary font-bangla">{t("dashboard.recentIntakes")}</h3>
          {intakes.length > 0 && (
            <Link href="/history" className="text-sm text-primary font-medium hover:underline">
              {t("dashboard.viewAll")}
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="text-primary/70 text-sm py-4">{t("dashboard.noRecent")}</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/history?id=${i.id}`}
                  className="block p-3 rounded-lg border border-primary/20 hover:bg-surface/50 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-primary truncate">{i.patientName || "—"}</p>
                    <p className="text-xs text-primary/70 shrink-0">
                      {new Date(i.date).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {i.summary && (
                    <p className="text-xs text-primary/80 mt-1 line-clamp-2">
                      {i.summary.split('\n')[0].replace(/^[^:]+:\s*/, '')}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="py-4 text-center text-primary/50 text-xs border-t border-primary/10">
        {t("forStaffOnly")}
      </footer>
    </div>
  );
}
