import { dateLocale, serverText, t, useLocale } from "../../../i18n/runtime";
import { formatDate } from "../../../services/api";
import type { VisualResult } from "./types";

export function VisualResults({ result }: { result: VisualResult }) {
  useLocale();
  const number = new Intl.NumberFormat(dateLocale(), {
    maximumFractionDigits: 2,
  });
  return (
    <div className="visual-results">
      <h3>{t("visual.results_title")}</h3>
      <p role="status">
        {result.regions.length
          ? t("visual.region_count", { count: result.regions.length })
          : t("visual.no_regions")}
      </p>
      {result.regions.length > 0 && (
        <ol className="visual-regions">
          {result.regions.map((region, index) => (
            <li key={index}>
              <h4>{t("visual.region", { number: index + 1 })}</h4>
              <dl>
                <div>
                  <dt>{t("visual.area")}</dt>
                  <dd>
                    {t("visual.pixels", {
                      value: number.format(region.area_px),
                    })}
                  </dd>
                </div>
                <div>
                  <dt>{t("visual.proportion")}</dt>
                  <dd>{number.format(region.image_area_percent)} %</dd>
                </div>
                <div>
                  <dt>{t("visual.score")}</dt>
                  <dd>{region.technical_score.toFixed(3)}</dd>
                </div>
                <div>
                  <dt>{t("visual.position")}</dt>
                  <dd>
                    {t(`visual.${region.position_vertical}`)} ·{" "}
                    {t(`visual.${region.position_horizontal}`)}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
      <p className="field-help">{t("visual.measurement_help")}</p>
      <details className="visual-method">
        <summary>{t("visual.method")}</summary>
        <p>
          {t("visual.model", {
            model: result.model_id,
            threshold: result.threshold,
          })}
        </p>
        <ul className="limitations">
          {result.limitations.map((item) => (
            <li key={item}>{serverText(item)}</li>
          ))}
        </ul>
      </details>
      {result.analyzed_at && (
        <p className="field-help">
          {t("visual.saved_at", { date: formatDate(result.analyzed_at) })}
        </p>
      )}
    </div>
  );
}
