"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

function LoginForm() {
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
        redirect: false,
      });
      if (res?.error) {
        setError(t("login.error"));
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (_) {
      setError(t("login.error"));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header Bar */}
      <header className="bg-primary text-white py-3 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10" />
            <div>
              <p className="text-xs font-medium opacity-90 uppercase tracking-wide">
                {lang === "bn" ? "ইউনিয়ন স্বাস্থ্য কমপ্লেক্স" : "UNION HEALTH COMPLEX"}
              </p>
              <p className="text-sm font-bold">
                {t("login.title")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${
                lang === "en"
                  ? "bg-white text-primary"
                  : "bg-primary/20 text-white hover:bg-white/20"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("bn")}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${
                lang === "bn"
                  ? "bg-white text-primary"
                  : "bg-primary/20 text-white hover:bg-white/20"
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {/* Logo and Branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="SHUNO Logo" className="w-28 h-28" />
            </div>
            <h1 className="font-bold text-4xl text-gray-800 mb-2">
              SHUNO
            </h1>
            <p className="text-primary text-lg font-semibold mb-3">
              Voice-Enabled Clinical Assessment
            </p>
            <p className="text-gray-600 text-sm mb-1.5 leading-relaxed">
              Streamline patient consultations with AI-assisted voice history taking
            </p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Fast, accurate, and accessible medical history documentation for rural health centers
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 placeholder:text-gray-400"
                    placeholder="your.email@uhc.gov.bd"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 placeholder:text-gray-400"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                <div className="text-right mt-2">
                  <a href="#" className="text-xs text-primary font-medium hover:underline">
                    Forgot password?
                  </a>
                </div>
              </div>
              {error && (
                <p className="text-red-600 text-sm font-medium" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Signing in...
                  </span>
                ) : (
                  <>Sign in →</>
                )}
              </button>
            </form>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <span className="text-blue-600">🔒</span>
              <p className="text-xs text-blue-800 flex-1">
                Secure login. Your data is encrypted and protected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary/70">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
