import { Languages } from "lucide-react";
import {
  catalogs,
  isLocale,
  isReleased,
  isMachinePreview,
  locales,
  translationCount,
} from "./catalog";
import { selectLocale, storageAvailable, t, useLocale } from "./runtime";

export function LanguageBar() {
  const selected = useLocale();
  const current = locales.find((locale) => locale.id === selected)!;
  const released = isReleased(selected);
  const machine = isMachinePreview(selected);
  return (
    <section
      className="language-section"
      aria-label={t("language.section")}
      lang="es-MX"
    >
      <div className="language-controls">
        <label htmlFor="language-choice">
          <Languages size={20} aria-hidden="true" />
          {t("language.section")}
        </label>
        <select
          id="language-choice"
          value={selected}
          aria-describedby="language-status"
          onChange={(event) => {
            if (isLocale(event.target.value)) selectLocale(event.target.value);
          }}
        >
          {locales.map((locale) => (
            <option key={locale.id} value={locale.id}>
              {locale.label}
              {isMachinePreview(locale.id)
                ? t("language.machine_option")
                : !isReleased(locale.id)
                  ? t("language.pending_option")
                  : ""}
            </option>
          ))}
        </select>
        <span id="language-status" role="status">
          {machine
            ? t("language.machine_status")
            : released
              ? t("language.available", { language: current.label })
              : t("language.fallback")}
        </span>
      </div>
      {!released && (
        <div className="language-explanation">
          <p>
            <strong>
              {t(
                machine
                  ? "language.provider_variant"
                  : "language.proposed_variant",
              )}
            </strong>{" "}
            {current.variant}.{" "}
            {t(
              machine
                ? "language.machine_explanation"
                : "language.pending_explanation",
            )}
          </p>
          <a href={current.source} target="_blank" rel="noreferrer">
            {t(machine ? "language.provider_source" : "language.source")}
          </a>
          {machine && (
            <p>
              {t("language.machine_coverage", {
                translated: translationCount(selected),
                total: Object.keys(catalogs["es-MX"].messages).length,
              })}
            </p>
          )}
        </div>
      )}
      {!storageAvailable() && (
        <p role="status">{t("language.storage_unavailable")}</p>
      )}
    </section>
  );
}
