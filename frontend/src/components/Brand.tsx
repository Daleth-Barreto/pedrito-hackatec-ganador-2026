import { t, useLocale } from "../i18n/runtime";
import "../styles/brand.css";

export const BRAND_NAME = "KINEVA";

export function Brand({ prominent = false }: { prominent?: boolean }) {
  useLocale();
  return (
    <span className={`kineva-brand${prominent ? " prominent" : ""}`}>
      <svg
        className="kineva-symbol"
        viewBox="354 251 276 287"
        aria-hidden="true"
        focusable="false"
      >
        <image href="/brand/kineva-reference.png" width="1600" height="900" />
      </svg>
      <span className="kineva-wordmark">
        <span className="kineva-name">{BRAND_NAME}</span>
        <span className="kineva-caption">
          {t("Layout.heridas_postamputacion")}
        </span>
      </span>
    </span>
  );
}
