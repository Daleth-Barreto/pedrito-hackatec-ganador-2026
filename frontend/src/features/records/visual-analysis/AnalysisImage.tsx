import { t, useLocale } from "../../../i18n/runtime";
import type { RecordDetail } from "../../../types";
import type { VisualResult } from "./types";

export function AnalysisImage({
  record,
  result,
  showContours,
  onError,
}: {
  record: RecordDetail;
  result: VisualResult | null;
  showContours: boolean;
  onError: () => void;
}) {
  useLocale();
  const width = record.image_metadata.width;
  const height = record.image_metadata.height;
  const labelSize = Math.max(width, height) / 32;
  return (
    <div className="analysis-image">
      <img
        className="record-photo"
        src={`/api/records/${record.id}/image`}
        alt={t(
          "RecordDetailPage.fotografia_enviada_para_revision_de_la_herida",
        )}
        onError={onError}
      />
      {showContours && result && (
        <svg
          className="analysis-overlay"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={t("visual.contours_alt")}
        >
          {result.regions.map((region, index) => {
            const [x, y] = region.bbox_xyxy;
            const cx = Math.max(labelSize, Math.min(width - labelSize, x));
            const cy = Math.max(labelSize, Math.min(height - labelSize, y));
            return (
              <g key={index}>
                <polygon
                  points={region.polygon_xy
                    .map((point) => point.join(","))
                    .join(" ")}
                  fill="var(--contour-fill)"
                  stroke="var(--ink)"
                  strokeWidth="5"
                  vectorEffect="non-scaling-stroke"
                />
                <polygon
                  points={region.polygon_xy
                    .map((point) => point.join(","))
                    .join(" ")}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={labelSize * 0.7}
                  fill="var(--ink)"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={cx}
                  y={cy}
                  dy=".35em"
                  textAnchor="middle"
                  fill="white"
                  fontSize={labelSize}
                  fontWeight="700"
                >
                  {index + 1}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
