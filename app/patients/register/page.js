"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useStore } from "@/context/StoreContext";

export default function RegisterPatientPage() {
  const { t } = useLanguage();
  const { addPatient } = useStore();
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    village: "",
    phone: "",
    nationalId: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const age = parseInt(form.age, 10);
    if (!form.name.trim() || !age || age < 1 || age > 120) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      await addPatient({
        name: form.name.trim(),
        age,
        gender: form.gender || undefined,
        village: form.village.trim() || undefined,
        phone: form.phone.trim() || undefined,
        nationalId: form.nationalId.trim() || undefined,
      });
      setSuccess(true);
      setForm({ name: "", age: "", gender: "", village: "", phone: "", nationalId: "" });
    } catch (err) {
      setSubmitError(
        (typeof err?.message === "string" && err.message.trim()) ||
          t("patients.apiError")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="card rounded-xl bg-green-50 border-green-200 p-6 text-center">
          <p className="text-green-800 font-semibold font-bangla text-lg">
            {t("patients.registered")}
          </p>
          <div className="flex gap-3 mt-4 justify-center">
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="btn btn-primary"
            >
              {t("patients.registerNew")}
            </button>
            <Link href="/patients" className="btn btn-ghost">
              {t("patients.back")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold text-primary font-bangla">{t("patients.registerNew")}</h2>
        <p className="text-primary/80 text-sm mt-1">{t("patients.subtitle")}</p>
      </section>

      <form onSubmit={handleSubmit} className="card rounded-xl space-y-4">
        <div>
          <label htmlFor="name" className="label font-bangla">{t("patients.name")}</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="input"
            placeholder={t("patients.namePlaceholder")}
            required
          />
        </div>
        <div>
          <label htmlFor="age" className="label font-bangla">{t("patients.age")}</label>
          <input
            id="age"
            type="number"
            min={1}
            max={120}
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            className="input"
            placeholder={t("patients.agePlaceholder")}
            required
          />
        </div>
        <div>
          <label htmlFor="gender" className="label font-bangla">{t("patients.gender")}</label>
          <select
            id="gender"
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            className="input"
          >
            <option value="">{t("patients.genderOption")}</option>
            <option value="male">{t("patients.male")}</option>
            <option value="female">{t("patients.female")}</option>
            <option value="other">{t("patients.other")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="village" className="label font-bangla">{t("patients.village")}</label>
          <input
            id="village"
            type="text"
            value={form.village}
            onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
            className="input"
            placeholder={t("patients.villagePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="phone" className="label font-bangla">{t("patients.phone")}</label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="input"
            placeholder={t("patients.phonePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="nationalId" className="label font-bangla">{t("patients.nationalId")}</label>
          <input
            id="nationalId"
            type="text"
            value={form.nationalId}
            onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
            className="input"
            placeholder={t("patients.nationalIdPlaceholder")}
          />
        </div>
        {submitError && (
          <p className="text-red-600 text-sm" role="alert">{submitError}</p>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
            {submitting ? t("common.loading") : t("patients.submit")}
          </button>
          <Link href="/patients" className="btn btn-ghost">
            {t("patients.back")}
          </Link>
        </div>
      </form>
    </div>
  );
}
