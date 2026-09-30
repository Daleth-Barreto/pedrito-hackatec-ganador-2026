import { useSyncExternalStore } from "react";
import {
  catalogs,
  normalizeLocale,
  isReleased,
  resolveMessage,
  type LocaleId,
  type MessageKey,
} from "./catalog";
import sources from "./server-sources.json";
import legacySources from "./legacy-sources.json";

const storageKey = "seguimiento.locale.v1";
let selected: LocaleId = "es-MX";
let persistent = true;
try {
  const saved = localStorage.getItem(storageKey);
  selected = normalizeLocale(saved);
} catch {
  persistent = false;
}
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const useLocale = () => useSyncExternalStore(subscribe, () => selected);
export const storageAvailable = () => persistent;
export function selectLocale(locale: LocaleId) {
  selected = locale;
  try {
    localStorage.setItem(storageKey, locale);
    persistent = true;
  } catch {
    persistent = false;
  }
  // Pending and bilingual previews retain Spanish as the document language.
  document.documentElement.lang = effectiveLanguage();
  listeners.forEach((listener) => listener());
}
export const effectiveLanguage = () =>
  isReleased(selected)
    ? (catalogs[selected].meta.languageTag ?? "es-MX")
    : "es-MX";
export const dateLocale = () => {
  const locale = effectiveLanguage();
  return Intl.DateTimeFormat.supportedLocalesOf([locale]).length
    ? locale
    : "es-MX";
};
export const t = (key: MessageKey, params?: Record<string, string | number>) =>
  resolveMessage(selected, key, params);
const knownSources: Record<string, string> = { ...legacySources, ...sources };
export function serverText(source: string): string {
  const key = knownSources[source];
  return key ? t(key as MessageKey) : source;
}
window.addEventListener("storage", (event) => {
  if (event.key !== storageKey) return;
  selected = normalizeLocale(event.newValue);
  document.documentElement.lang = effectiveLanguage();
  listeners.forEach((listener) => listener());
});
document.documentElement.lang = effectiveLanguage();

export function configuredText(value: string): string {
  const key = "server.config.pendiente_de_configuraci_n_y_revisi_n";
  return value === catalogs["es-MX"].messages[key] ? t(key) : value;
}

