import { RecordVisualPanel } from "./visual-analysis/RecordVisualPanel";
import { t, useLocale, serverText } from "../../i18n/runtime";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, ShieldCheck, Trash2 } from "lucide-react";
import { api, errorMessage, formatDate } from "../../services/api";
import { useAuth } from "../auth/AuthContext";
import {
  EmptyState,
  Loading,
  Notice,
  PageTitle,
  PriorityBadge,
  StatusBadge,
} from "../../components/UI";
import { QuestionnaireSummary } from "./QuestionnaireFields";
import { assessmentLabels, ReviewForm } from "./ReviewForm";
import { RecordTable } from "./RecordTable";
import { useRecords } from "./useRecords";
import type { RecordDetail } from "../../types";
function PatientTimeline({ patientId }: { patientId: string }) {
  useLocale();
  const { data, loading, error, reload } = useRecords(
    `patient_id=${patientId}&limit=100`,
  );
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t("RecordDetailPage.historial_del_paciente")}</h2>
          <p>
            {t(
              "RecordDetailPage.hasta_100_registros_recientes_usa_el_filtro_por_paciente_del",
            )}
          </p>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="panel-body">
          <Notice kind="error">{error}</Notice>
          <button onClick={reload}>{t("RecordDetailPage.reintentar")}</button>
        </div>
      ) : data.items.length ? (
        <RecordTable records={data.items} />
      ) : (
        <EmptyState title={t("RecordDetailPage.sin_registros_vigentes")}>
          {t("RecordDetailPage.no_hay_registros_disponibles")}
        </EmptyState>
      )}
    </section>
  );
}
export function RecordDetailPage() {
  useLocale();
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [remove, setRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setSaved(false);
    setRemove(false);
    api<RecordDetail>(`/records/${id}`, { signal: controller.signal })
      .then(setRecord)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, revision]);
  async function deleteRecord() {
    setBusy(true);
    setError("");
    try {
      await api<void>(`/records/${id}`, { method: "DELETE" });
      navigate("/history", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return <Loading text={t("RecordDetailPage.cargando_registro")} />;
  if (!record)
    return (
      <>
        <Notice kind="error">{error}</Notice>
        <button
          className="button secondary"
          onClick={() => setRevision((v) => v + 1)}
        >
          {t("RecordDetailPage.reintentar")}
        </button>
      </>
    );
  const clinical = user?.role === "clinician";
  return (
    <>
      <Link className="back-link" to={clinical ? "/" : "/history"}>
        <ArrowLeft size={16} />
        {clinical
          ? t("RecordDetailPage.volver_al_panel")
          : t("RecordDetailPage.volver_al_historial")}
      </Link>
      <PageTitle
        eyebrow={t("record.identifier", {
          id: record.id.slice(0, 8).toUpperCase(),
        })}
        title={
          clinical
            ? record.patient_name
            : t("RecordDetailPage.tu_registro_de_seguimiento")
        }
        action={<StatusBadge status={record.status} />}
      >
        {t("RecordDetailPage.enviado_el")}
        {formatDate(record.created_at)}
        {t("RecordDetailPage.fotografia_del")} {formatDate(record.photo_date)}
      </PageTitle>
      {location.state?.created && (
        <Notice kind="success">
          {t(
            "RecordDetailPage.tu_registro_se_guardo_correctamente_y_esta_disponible_para_e",
          )}
        </Notice>
      )}
      {saved && (
        <Notice kind="success">
          {t(
            "RecordDetailPage.revision_profesional_guardada_el_paciente_puede_consultarla_",
          )}
        </Notice>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="detail-grid">
        <div className="detail-main">
          <RecordVisualPanel
            key={record.id}
            record={record}
            clinical={clinical}
          />
          <section className="panel panel-body">
            <div className="section-heading">
              <FileText size={21} />
              <div>
                <h2>{t("RecordDetailPage.cuestionario_del_paciente")}</h2>
                <p>
                  {t(
                    "RecordDetailPage.informacion_reportada_no_hallazgos_clinicos_confirmados",
                  )}
                </p>
              </div>
            </div>
            <QuestionnaireSummary value={record.questionnaire} />
          </section>
          <section className="panel panel-body professional-panel">
            <div className="section-heading">
              <ShieldCheck size={23} />
              <div>
                <p className="eyebrow">
                  {t("RecordDetailPage.revision_humana")}
                </p>
                <h2>{t("RecordDetailPage.valoracion_del_profesional")}</h2>
              </div>
            </div>
            {record.review ? (
              <>
                <span className="badge priority-normal">
                  {assessmentLabels()[record.review.assessment]}
                </span>
                <p className="professional-note">{record.review.note}</p>
                <small>
                  {t("RecordDetailPage.revisado_el")}
                  {formatDate(record.review.created_at)}
                  {t("RecordDetailPage.profesional")}{" "}
                  {record.review.clinician_id.slice(0, 8).toUpperCase()}
                </small>
              </>
            ) : clinical ? (
              <ReviewForm
                recordId={record.id}
                onReviewed={(value) => {
                  setRecord(value);
                  setSaved(true);
                }}
              />
            ) : (
              <p>
                {t(
                  "RecordDetailPage.tu_registro_esta_pendiente_aqui_aparecera_la_nota_cuando_el_",
                )}
              </p>
            )}
          </section>
        </div>
        <aside className="detail-aside">
          <section className="panel panel-body suggestion-panel">
            <p className="eyebrow">
              {t("RecordDetailPage.sugerencia_del_sistema")}
            </p>
            <h2>{t("RecordDetailPage.prioridad_de_revision")}</h2>
            <PriorityBadge priority={record.priority} />
            <p>{serverText(record.patient_message)}</p>
            <h3>{t("RecordDetailPage.que_motivo_este_resultado")}</h3>
            <ul className="reason-list">
              {record.reasons.map((reason) => (
                <li key={reason}>{serverText(reason)}</li>
              ))}
            </ul>
            <small>
              {t("record.rules", { version: record.rules_version })}
            </small>
          </section>
          <section className="panel panel-body">
            <h3>{t("visual.priority_separation")}</h3>
            <p>{t("visual.priority_help")}</p>
            <a className="text-link" href="#visual-analysis">
              {t("visual.go_analysis")}
            </a>
          </section>
          <section className="panel panel-body">
            <h3>{t("RecordDetailPage.alcance_del_reporte")}</h3>
            <ul className="limitations">
              {record.report.limitations.map((item) => (
                <li key={item}>{serverText(item)}</li>
              ))}
            </ul>
            <small>{serverText(record.report.generator)}</small>
          </section>
          <div className="retention-note">
            <strong>
              {t("RecordDetailPage.conservacion_de_este_registro")}
            </strong>
            <p>
              {t("record.retention", { date: formatDate(record.expires_at) })}
            </p>
            {!clinical && (
              <button
                className="text-link danger"
                onClick={() => setRemove(true)}
              >
                <Trash2 size={15} />
                {t("RecordDetailPage.eliminar_registro")}
              </button>
            )}
          </div>
        </aside>
      </div>
      {remove && (
        <section className="panel panel-body delete-confirm" role="alert">
          <h3>
            {t("RecordDetailPage.eliminar_este_registro_y_su_fotografia")}
          </h3>
          <p>
            {t(
              "RecordDetailPage.se_eliminaran_tambien_las_respuestas_y_la_revision_asociada_",
            )}
          </p>
          <div className="button-group">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setRemove(false)}
            >
              {t("RecordDetailPage.conservar_registro")}
            </button>
            <button
              className="button danger-button"
              disabled={busy}
              onClick={deleteRecord}
            >
              {busy
                ? t("RecordDetailPage.eliminando")
                : t("RecordDetailPage.confirmar_eliminacion")}
            </button>
          </div>
        </section>
      )}
      {clinical && (
        <PatientTimeline
          key={record.review?.id ?? "pending"}
          patientId={record.patient_id}
        />
      )}
    </>
  );
}
