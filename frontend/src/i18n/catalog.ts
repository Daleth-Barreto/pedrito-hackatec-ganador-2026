import spanish from "./locales/es-MX.json";
import nahuatl from "./locales/nhe-machine.json";
import zapoteco from "./locales/zap-machine.json";
import mixteco from "./locales/mix-051601.json";

export type MessageKey = keyof typeof spanish.messages;
export type LocaleId = "es-MX" | "nhe" | "zap-machine" | "mix-051601";
export interface Catalog {
  meta: {
    status: string;
    reviewers: string[];
    reviewedAt: string | null;
    sourceRevision: string;
    languageTag: string | null;
    communityConfirmed?: boolean;
    provider?: string;
    generatedAt?: string;
  };
  messages: Record<string, string | null>;
}
export const catalogs: Record<LocaleId, Catalog> = {
  "es-MX": spanish,
  nhe: nahuatl,
  "zap-machine": zapoteco,
  "mix-051601": mixteco,
};
export const locales = [
  { id: "es-MX", label: "Español", variant: "Español de México", source: "" },
  {
    id: "nhe",
    label: "Náhuatl",
    variant: "Náhuatl de la Huasteca oriental (Google Translate)",
    source: "https://translate.google.com/?sl=es&tl=nhe",
  },
  {
    id: "zap-machine",
    label: "Zapoteco",
    variant: "Zapoteco de Google Translate; variante no especificada",
    source: "https://translate.google.com/?sl=es&tl=zap",
  },
] as const;

export function isLocale(value: string | null): value is LocaleId {
  return locales.some((locale) => locale.id === value);
}

// Only reviewed, complete catalogs may render without the Spanish reference.
export function isReleased(id: LocaleId): boolean {
  if (id === "es-MX") return true;
  const catalog = catalogs[id];
  return (
    catalog.meta.status === "reviewed" &&
    catalog.meta.reviewers.length >= 2 &&
    Boolean(catalog.meta.reviewedAt) &&
    Boolean(catalog.meta.languageTag) &&
    catalog.meta.communityConfirmed === true &&
    catalog.meta.sourceRevision === spanish.meta.sourceRevision &&
    Object.keys(spanish.messages).every(
      (key) =>
        typeof catalog.messages[key] === "string" &&
        catalog.messages[key]!.trim().length > 0,
    )
  );
}

export function isMachinePreview(id: LocaleId): boolean {
  const catalog = catalogs[id];
  return (
    catalog.meta.status === "machine" &&
    catalog.meta.sourceRevision === spanish.meta.sourceRevision &&
    Boolean(
      catalog.meta.provider &&
      catalog.meta.generatedAt &&
      catalog.meta.languageTag,
    ) &&
    Object.values(catalog.messages).some(
      (value) => typeof value === "string" && value.trim(),
    )
  );
}

export function translationCount(id: LocaleId): number {
  return Object.values(catalogs[id].messages).filter(
    (value) => typeof value === "string" && value.trim(),
  ).length;
}

export function normalizeLocale(value: string | null): LocaleId {
  if (value === "nah-021130") return "nhe";
  if (value === "zap-051362") return "zap-machine";
  return isLocale(value) ? value : "es-MX";
}

export function resolveMessage(
  id: LocaleId,
  key: MessageKey,
  params: Record<string, string | number> = {},
): string {
  const original = spanish.messages[key];
  const translated = catalogs[id].messages[key];
  const machine = isMachinePreview(id) && !key.startsWith("language.");
  const message =
    machine && typeof original === "string"
      ? translated
        ? translated + " / " + original
        : original + " [español]"
      : ((isReleased(id) ? translated : null) ?? original);
  if (typeof message !== "string")
    throw new Error(`Missing translation key: ${key}`);
  return message.replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in params))
      throw new Error(`Missing interpolation: ${key}.${name}`);
    return String(params[name]);
  });
}

