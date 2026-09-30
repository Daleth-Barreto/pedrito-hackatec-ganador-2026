export interface VisualRegion {
  technical_score: number;
  area_px: number;
  image_area_percent: number;
  bbox_xyxy: [number, number, number, number];
  polygon_xy: [number, number][];
  position_horizontal: "izquierda" | "centro" | "derecha";
  position_vertical: "superior" | "media" | "inferior";
}
export interface VisualResult {
  status: "experimental";
  model_id: string;
  affects_priority: false;
  validated_for_postamputation: false;
  threshold: number;
  image_width: number;
  image_height: number;
  regions: VisualRegion[];
  message: string;
  limitations: string[];
  analyzed_at: string | null;
}
export interface VisualState {
  enabled: boolean;
  consent: { accepted: boolean; version: string; decided_at: string } | null;
  result: VisualResult | null;
}
