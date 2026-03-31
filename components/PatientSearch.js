"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function PatientSearch({ patients, onSelect, selectedId, className = "" }) {
  const { t } = useLanguage();
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
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("patients.searchPlaceholder")}
          className="input w-full pl-10 text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/50 hover:text-primary"
          >
            ✕
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto border-2 border-primary/20 rounded-lg bg-white">
        {filteredPatients.length === 0 ? (
          <div className="p-4 text-center text-primary/60 text-sm">
            {searchQuery ? t("patients.noResults") : t("patients.noPatients")}
          </div>
        ) : (
          <ul className="divide-y divide-primary/10">
            {filteredPatients.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className={`w-full text-left p-3 hover:bg-primary/5 transition ${
                    selectedId === p.id ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-primary truncate">{p.name}</p>
                      <div className="flex gap-3 text-xs text-primary/60 mt-1">
                        {p.age && <span>{p.age}y</span>}
                        {p.gender && <span>{p.gender}</span>}
                        {p.village && <span>{p.village}</span>}
                      </div>
                      {p.phone && (
                        <p className="text-xs text-primary/50 mt-1">{p.phone}</p>
                      )}
                    </div>
                    {selectedId === p.id && (
                      <span className="text-green-600 text-xl shrink-0">✓</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {searchQuery && filteredPatients.length > 0 && (
        <p className="text-xs text-primary/60">
          {t("patients.showingResults")
            .replace("{count}", filteredPatients.length)
            .replace("{total}", patients.length)}
        </p>
      )}
    </div>
  );
}
