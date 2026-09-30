import { t, useLocale } from "../../i18n/runtime";
import { useState, type FormEvent } from "react";
import { api, errorMessage } from "../../services/api";
import { Notice } from "../../components/UI";
import type { RecordDetail, Review } from "../../types";
export const assessmentLabels = () => ({
  reviewed: t("ReviewForm.revision_completada"),
  follow_up: t("ReviewForm.requiere_seguimiento"),
  contact_needed: t("ReviewForm.requiere_contacto_con_el_paciente"),
});
export function ReviewForm({
  recordId,
  onReviewed,
}: {
  recordId: string;
  onReviewed: (record: RecordDetail) => void;
}) {
  useLocale();
  const [assessment, setAssessment] =
    useState<Review["assessment"]>("reviewed");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onReviewed(
        await api<RecordDetail>(`/records/${recordId}/reviews`, {
          method: "POST",
          body: JSON.stringify({ assessment, note }),
        }),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="review-form">
      {error && <Notice kind="error">{error}</Notice>}
      <label>
        {t("ReviewForm.valoracion_del_profesional")}
        <select
          value={assessment}
          onChange={(e) =>
            setAssessment(e.target.value as Review["assessment"])
          }
        >
          {Object.entries(assessmentLabels()).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("ReviewForm.nota_profesional")}
        <textarea
          required
          minLength={5}
          maxLength={3000}
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t(
            "ReviewForm.registra_tu_valoracion_de_la_informacion_disponible",
          )}
        />
        <small>
          {t(
            "ReviewForm.la_nota_sera_visible_para_el_paciente_se_guardara_con_tu_usu",
          )}
        </small>
      </label>
      <button
        className="button primary"
        disabled={busy || note.trim().length < 5}
      >
        {busy
          ? t("ReviewForm.guardando_revision")
          : t("ReviewForm.guardar_y_marcar_como_revisado")}
      </button>
    </form>
  );
}
