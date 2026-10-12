"use client";

import { useLanguage } from "./language-provider";
import { Languages } from "lucide-react";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className="inline-flex items-center gap-0.5 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xs"
    >
      <Languages className="w-3.5 h-3.5 text-orange-500 ml-1 mr-0.5 hidden xs:block" />
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          lang === "en"
            ? "bg-orange-600 text-white shadow-xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("ne")}
        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          lang === "ne"
            ? "bg-orange-600 text-white shadow-xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        title="नेपाली (Nepali)"
      >
        नेपाली
      </button>
    </div>
  );
}
