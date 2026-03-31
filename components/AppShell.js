"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";

const navItems = [
  { href: "/", key: "dashboard", icon: "📋" },
  { href: "/voice", key: "newIntake", icon: "🎤" },
  { href: "/patients", key: "patients", icon: "👥" },
  { href: "/history", key: "history", icon: "📁" },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="shrink-0 border-b-2 border-primary/20 bg-primary text-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src="/logo.png" alt="SHUNO" className="w-12 h-12 shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-xl mb-0.5">Shuno</h1>
                <p className="text-white/90 text-xs leading-tight">
                  Fast, voice-enabled medical history taking for UHC Physicians
                </p>
                <p className="text-white/80 text-xs font-bangla leading-tight mt-0.5">
                  ইউনিয়ন স্বাস্থ্য কমপ্লেক্সের জন্য দ্রুত, নির্ভুল এবং সহজলভ্য চিকিৎসা ইতিহাস নথিভুক্তকরণ
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {!isLoginPage && (
                <SignOutButton t={t} />
              )}
              <span className="text-white/80 text-xs hidden xs:inline">{t("lang")}</span>
              <div className="flex rounded-lg overflow-hidden border border-white/30">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-3 py-2 text-sm font-medium transition ${
                    lang === "en" ? "bg-white text-primary" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang("bn")}
                  className={`px-3 py-2 text-sm font-medium transition font-bangla ${
                    lang === "bn" ? "bg-white text-primary" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  বাংলা
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {!isLoginPage && (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary/20 bg-white safe-area-pb"
        aria-label="Main navigation"
      >
        <div className="max-w-2xl mx-auto px-2 py-2 flex items-stretch gap-1">
          {navItems.map(({ href, key, icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/" && pathname?.startsWith(href)) ||
              (key === "patients" && pathname?.startsWith("/patients"));
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl min-h-[56px] transition ${
                  isActive ? "bg-primary text-white" : "text-primary hover:bg-surface"
                }`}
              >
                <span className="text-xl" aria-hidden>{icon}</span>
                <span className="text-xs font-semibold truncate w-full text-center">
                  {t("nav." + key)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}

function SignOutButton({ t }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="px-3 py-1.5 rounded-lg border border-white/40 text-white/90 text-xs font-medium hover:bg-white/20 transition"
    >
      {t("login.signOut")}
    </button>
  );
}
