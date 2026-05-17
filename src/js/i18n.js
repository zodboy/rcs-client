// i18n core — string lookup by key, with placeholder interpolation.
// EN/ZH have full strings. ES/JA/FR/DE are scaffolded with English fallback;
// hand off the .js files in src/i18n to a translator and the UI picks them up.

import { en } from "../i18n/en.js";
import { zh } from "../i18n/zh.js";
import { es } from "../i18n/es.js";
import { ja } from "../i18n/ja.js";
import { fr } from "../i18n/fr.js";
import { de } from "../i18n/de.js";

export const LANGUAGES = [
  { code: "en", label: "English",   native: "English",  status: "full"  },
  { code: "zh", label: "Chinese",   native: "中文",      status: "full"  },
  { code: "es", label: "Spanish",   native: "Español",   status: "full" },
  { code: "ja", label: "Japanese",  native: "日本語",    status: "full" },
  { code: "fr", label: "French",    native: "Français",  status: "full" },
  { code: "de", label: "German",    native: "Deutsch",   status: "full" },
];

const TABLES = { en, zh, es, ja, fr, de };

let current = detectInitial();
const listeners = new Set();

function detectInitial() {
  try {
    const saved = localStorage.getItem("rcs.lang");
    if (saved && TABLES[saved]) return saved;
  } catch (_) {}
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("de")) return "de";
  return "en";
}

export function getLang() { return current; }

export function setLang(code) {
  if (!TABLES[code]) return;
  current = code;
  try { localStorage.setItem("rcs.lang", code); } catch (_) {}
  document.documentElement.setAttribute("lang", code);
  listeners.forEach((fn) => { try { fn(code); } catch (_) {} });
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* t("auth.title") -> string for the active language; falls back to EN; falls
   back to the key itself if not found anywhere. interpolation: t("k", {n: 4}) */
export function t(key, vars) {
  const tbl = TABLES[current] || TABLES.en;
  let s = tbl[key] != null ? tbl[key] : (TABLES.en[key] != null ? TABLES.en[key] : key);
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.replace(new RegExp(`{${k}}`, "g"), String(vars[k]));
    }
  }
  return s;
}

/* relative time formatter, locale-aware */
export function fmtRel(unixSec) {
  if (!unixSec) return t("time.never");
  const diff = unixSec - Math.floor(Date.now() / 1000);
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(current === "zh" ? "zh-CN" : current, { numeric: "auto" });
  if (abs < 60)    return rtf.format(Math.round(diff), "second");
  if (abs < 3600)  return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), "month");
  return rtf.format(Math.round(diff / (86400 * 365)), "year");
}

export function fmtDate(unixSec) {
  if (!unixSec) return "—";
  const d = new Date(unixSec * 1000);
  return d.toLocaleDateString(current === "zh" ? "zh-CN" : current,
    { year: "numeric", month: "short", day: "numeric" });
}
