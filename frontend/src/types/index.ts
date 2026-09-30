export type Role = "patient" | "clinician";
export type Priority = "normal" | "vigilancia" | "alerta" | null;
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_demo: boolean;
}
export interface Consent {
  id: string;
  version: string;
  accepted_at: string;
}
export interface Questionnaire {
  photo_date: string;
  pain: number | null;
  increased_pain: boolean | null;
  fever: boolean | null;
  discharge: boolean | null;
  odor: boolean | null;
  wound_opening: boolean | null;
  changes: "none" | "changed" | "unknown";
  changes_description: string;
}
export interface RecordSummary {
  id: string;
  patient_id: string;
  patient_name: string;
  is_demo: boolean;
  created_at: string;
  photo_date: string;
  priority: Priority;
  status: "pending" | "reviewed";
  automatic_status: string;
}
export interface Review {
  id: string;
  clinician_id: string;
  created_at: string;
  assessment: "reviewed" | "follow_up" | "contact_needed";
  note: string;
}
export interface RecordDetail extends RecordSummary {
  questionnaire: Questionnaire;
  image_metadata: {
    width: number;
    height: number;
    quality_issues: string[];
    quality_scope: string;
  };
  inference: {
    mode: string;
    status: string;
    label: string;
    visual_observations: string[];
    limitations: string[];
  };
  reasons: string[];
  rules_version: string;
  expires_at: string;
  review: Review | null;
  patient_message: string;
  report: { limitations: string[]; generator: string };
}
export interface RecordList {
  items: RecordSummary[];
  total: number;
}
