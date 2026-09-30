import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ScanLine } from "lucide-react";
import { Loading, Notice } from "../../../components/UI";
import { serverText, t, useLocale } from "../../../i18n/runtime";
import { api, errorMessage, formatDate } from "../../../services/api";
import type { RecordDetail } from "../../../types";
import { AnalysisImage } from "./AnalysisImage";
import { VisualResults } from "./VisualResults";
import type { VisualResult, VisualState } from "./types";
import "./visual-analysis.css";

export function RecordVisualPanel({
  record,
  clinical,
}: {
  record: RecordDetail;
  clinical: boolean;
}) {
  useLocale();
  const [state, setState] = useState<VisualState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showContours, setShowContours] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageRevision, setImageRevision] = useState(0);
  const [revision, setRevision] = useState(0);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<VisualState>(`/records/${record.id}/segmentation`, {
      signal: controller.signal,
    })
      .then(setState)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      pending.current?.abort();
    };
  }, [record.id, revision]);

  async function submit(decision?: boolean) {
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    try {
      if (decision !== undefined) {
        const updated = await api<VisualState>(
          `/records/${record.id}/visual-consent`,
          {
            method: "POST",
            signal: controller.signal,
            body: JSON.stringify({ accepted: decision, version: "visual-1" }),
          },
        );
        setState(updated);
        setAccepted(false);
      } else {
        const result = await api<VisualResult>(
          `/records/${record.id}/segmentation`,
          {
            method: "POST",
            signal: controller.signal,
            body: JSON.stringify({ limitations_acknowledged: true }),
          },
        );
        setState((current) => current && { ...current, result });
        setShowContours(true);
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(errorMessage(err));
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return (
    <section className="panel photo-panel" aria-labelledby="visual-photo-title">
      <div className="panel-heading">
        <h2 id="visual-photo-title">
          {t("RecordDetailPage.fotografia_del_registro")}
        </h2>
        <span className="pill">
          {record.is_demo
            ? t("RecordDetailPage.dato_de_demostracion")
            : t("RecordDetailPage.acceso_restringido")}
        </span>
      </div>
      {imageError ? (
        <div className="panel-body">
          <Notice kind="error">{t("visual.image_error")}</Notice>
          <button
            className="button secondary"
            onClick={() => {
              setImageError(false);
              setImageRevision((value) => value + 1);
            }}
          >
            {t("visual.retry_image")}
          </button>
        </div>
      ) : (
        <AnalysisImage
          key={imageRevision}
          record={record}
          result={state?.result ?? null}
          showContours={showContours}
          onError={() => setImageError(true)}
        />
      )}
      <div className="photo-caption">
        <span>
          {record.image_metadata.width} × {record.image_metadata.height}{" "}
          {t("RecordDetailPage.px")}
        </span>
        <span>
          {t("RecordDetailPage.visible_solo_para_usuarios_autorizados")}
        </span>
      </div>
      <div className="visual-analysis panel-body" id="visual-analysis">
        <div className="visual-title">
          <h2>{t("visual.title")}</h2>
          <span className="pill">{t("visual.experimental")}</span>
        </div>
        <p>{t("visual.description")}</p>
        {loading && <Loading text={t("visual.loading")} />}
        {error && <Notice kind="error">{error}</Notice>}
        {!state && !loading && (
          <button
            className="button secondary"
            onClick={() => setRevision((value) => value + 1)}
          >
            {t("visual.retry")}
          </button>
        )}
        {state && (
          <>
            {!state.enabled && <Notice>{t("visual.disabled")}</Notice>}
            {!clinical && (
              <div className="visual-consent">
                <h3>{t("visual.consent_title")}</h3>
                <p>{t("visual.consent_text")}</p>
                <p>
                  <Link to="/privacy">{t("visual.privacy")}</Link>
                </p>
                {state.consent && (
                  <p role="status">
                    {t(
                      state.consent.accepted
                        ? "visual.consent_accepted"
                        : "visual.consent_rejected",
                      { date: formatDate(state.consent.decided_at) },
                    )}
                  </p>
                )}
                {!state.consent?.accepted ? (
                  <>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                        disabled={busy}
                      />
                      {t("visual.patient_ack")}
                    </label>
                    <div className="button-group">
                      <button
                        className="button primary"
                        disabled={!accepted || busy}
                        onClick={() => submit(true)}
                      >
                        {t("visual.authorize")}
                      </button>
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => submit(false)}
                      >
                        {t("visual.decline")}
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => submit(false)}
                  >
                    {t("visual.revoke")}
                  </button>
                )}
                <p className="field-help">{t("visual.consent_version")}</p>
              </div>
            )}
            {clinical && (
              <>
                {!state.consent?.accepted && (
                  <Notice>{t("visual.awaiting_consent")}</Notice>
                )}
                {state.consent?.accepted && state.enabled && (
                  <>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                        disabled={busy}
                      />
                      {t("visual.clinician_ack")}
                    </label>
                    <button
                      className="button primary"
                      onClick={() => submit()}
                      disabled={
                        !accepted ||
                        busy ||
                        imageError ||
                        record.image_metadata.quality_issues.length > 0
                      }
                    >
                      <ScanLine size={18} aria-hidden="true" />
                      {t(state.result ? "visual.rerun" : "visual.run")}
                    </button>
                  </>
                )}
              </>
            )}
            {record.image_metadata.quality_issues.map((issue) => (
              <Notice key={issue}>{serverText(issue)}</Notice>
            ))}
            {busy && (
              <Loading
                text={t(clinical ? "visual.running" : "visual.saving")}
              />
            )}
            {state.result && (
              <>
                {state.result.regions.length > 0 && (
                  <button
                    className="button secondary contour-toggle"
                    aria-pressed={showContours}
                    onClick={() => setShowContours((value) => !value)}
                  >
                    {t(
                      showContours
                        ? "visual.hide_contours"
                        : "visual.show_contours",
                    )}
                  </button>
                )}
                <VisualResults result={state.result} />
              </>
            )}
            {!state.result && state.consent?.accepted && !clinical && (
              <p className="field-help">{t("visual.waiting_result")}</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
