import { t, useLocale } from "../../i18n/runtime";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { api, errorMessage, formatDate } from "../../services/api";
import { Notice, PageTitle } from "../../components/UI";
import {
  QuestionnaireFields,
  QuestionnaireSummary,
} from "./QuestionnaireFields";
import type { Consent, Questionnaire, RecordDetail } from "../../types";
const initial: Questionnaire = {
  photo_date: new Date().toLocaleDateString("en-CA"),
  pain: null,
  increased_pain: null,
  fever: null,
  discharge: null,
  odor: null,
  wound_opening: null,
  changes: "unknown",
  changes_description: "",
};
export function NewRecordPage() {
  useLocale();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [answers, setAnswers] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const selection = useRef(0);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (file) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [file]);
  async function acceptConsent() {
    setBusy(true);
    setError("");
    try {
      const result = await api<Consent>("/consents", {
        method: "POST",
        body: JSON.stringify({ accepted: true, version: "2" }),
      });
      setConsent(result);
      setStep(1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function rejectConsent() {
    setBusy(true);
    setError("");
    try {
      await api("/consents", {
        method: "POST",
        body: JSON.stringify({ accepted: false, version: "2" }),
      });
      navigate("/account");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function chooseImage(next: File | undefined) {
    const current = ++selection.current;
    setFile(null);
    setError("");
    if (!next) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
      setError(t("NewRecordPage.selecciona_una_imagen_jpeg_png_o_webp"));
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      setError(
        t("NewRecordPage.la_fotografia_supera_8_mb_selecciona_una_mas_pequena"),
      );
      return;
    }
    setChecking(true);
    try {
      const bitmap = await createImageBitmap(next);
      const valid =
        Math.min(bitmap.width, bitmap.height) >= 320 &&
        bitmap.width * bitmap.height <= 20000000;
      bitmap.close();
      if (!valid)
        throw new Error(
          t(
            "NewRecordPage.usa_una_fotografia_de_al_menos_320_320_px_y_hasta_20_megapix",
          ),
        );
      if (selection.current === current) setFile(next);
    } catch (err) {
      if (selection.current === current)
        setError(
          err instanceof Error
            ? err.message
            : t("NewRecordPage.no_se_pudo_leer_la_imagen"),
        );
    } finally {
      if (selection.current === current) setChecking(false);
    }
  }
  function next(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError(
        t("NewRecordPage.agrega_una_fotografia_valida_antes_de_continuar"),
      );
      return;
    }
    setError("");
    setStep(2);
    setConfirmed(false);
    window.scrollTo(0, 0);
  }
  async function submit() {
    if (!file || !consent || busy || !confirmed) return;
    setError("");
    setBusy(true);
    const body = new FormData();
    body.append("image", file);
    body.append(
      "payload",
      JSON.stringify({ consent_id: consent.id, questionnaire: answers }),
    );
    try {
      const record = await api<RecordDetail>("/records", {
        method: "POST",
        body,
      });
      navigate(`/records/${record.id}`, {
        replace: true,
        state: { created: true },
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow={t("NewRecordPage.nuevo_registro")}
        title={t("NewRecordPage.comparte_tu_evolucion")}
      >
        {t(
          "NewRecordPage.tomate_el_tiempo_que_necesites_tus_respuestas_se_guardan_cua",
        )}
      </PageTitle>
      <ol className="stepper">
        {[
          t("NewRecordPage.tu_consentimiento"),
          t("NewRecordPage.fotografia_y_cambios"),
          t("NewRecordPage.confirmar_envio"),
        ].map((label, i) => (
          <li
            key={label}
            className={i === step ? "current" : i < step ? "complete" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step ? <Check size={17} /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {error && <Notice kind="error">{error}</Notice>}
      {step === 0 && (
        <section className="panel consent-panel">
          <div className="section-icon">
            <ShieldCheck size={27} />
          </div>
          <h2>{t("NewRecordPage.consentimiento_informado")}</h2>
          <h3>{t("NewRecordPage.antes_de_continuar_tu_decides")}</h3>
          <p>
            {t(
              "NewRecordPage.la_ia_puede_equivocarse_en_esta_demostracion_aun_no_hay_un_m",
            )}
          </p>
          <p>
            {t("NewRecordPage.consulta_el")}
            <Link to="/privacy">{t("NewRecordPage.aviso_de_privacidad")}</Link>
            {t(
              "NewRecordPage.explica_el_responsable_pendiente_de_configuracion_el_acceso_",
            )}
          </p>
          <p>
            {t(
              "NewRecordPage.guardaremos_tu_fotografia_y_tus_respuestas_para_que_tu_y_el_",
            )}
          </p>
          <ul className="readable-list">
            <li>
              {t(
                "NewRecordPage.el_sistema_organiza_los_datos_y_aplica_reglas_de_demostracio",
              )}
            </li>
            <li>
              {t(
                "NewRecordPage.no_diagnostica_ni_sustituye_una_consulta_la_decision_final_c",
              )}
            </li>
            <li>
              {t(
                "NewRecordPage.las_imagenes_no_se_envian_a_servicios_externos_de_inteligenc",
              )}
            </li>
            <li>
              {t(
                "NewRecordPage.puedes_eliminar_tus_registros_desde_su_detalle_la_aceptacion",
              )}
            </li>
            <li>
              {t(
                "NewRecordPage.este_entorno_es_de_demostracion_no_subas_fotografias_de_paci",
              )}
            </li>
          </ul>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              {t(
                "NewRecordPage.comprendo_el_proposito_y_los_limites_y_acepto_el_almacenamie",
              )}
            </span>
          </label>
          <button
            className="button primary"
            disabled={!accepted || busy}
            onClick={acceptConsent}
          >
            {busy
              ? t("NewRecordPage.guardando_consentimiento")
              : t("NewRecordPage.aceptar_y_continuar")}
            <ArrowRight size={17} />
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={busy}
            onClick={rejectConsent}
          >
            {t("NewRecordPage.no_acepto_volver_a_mi_cuenta")}
          </button>
          <small className="consent-version">
            {t(
              "NewRecordPage.consentimiento_version_2_se_registran_tu_decision_y_su_fecha",
            )}
          </small>
        </section>
      )}
      {step === 1 && (
        <form onSubmit={next} className="record-form">
          <section className="panel panel-body">
            <div className="section-heading">
              <span className="section-number">01</span>
              <div>
                <h2>{t("NewRecordPage.fotografia")}</h2>
                <p>
                  {t(
                    "NewRecordPage.procura_buena_luz_y_una_imagen_enfocada_sin_datos_que_te_ide",
                  )}
                </p>
              </div>
            </div>
            {preview ? (
              <div className="upload-preview">
                <img
                  src={preview}
                  alt={t(
                    "NewRecordPage.vista_previa_de_la_fotografia_seleccionada",
                  )}
                />
                <div>
                  <strong>{t("NewRecordPage.fotografia_seleccionada")}</strong>
                  <p>
                    {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ""}
                  </p>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setFile(null)}
                  >
                    {t("NewRecordPage.sustituir_fotografia")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="upload-area">
                <Camera size={32} />
                <h3>{t("NewRecordPage.agrega_una_fotografia")}</h3>
                <p>
                  {t(
                    "NewRecordPage.jpeg_png_o_webp_hasta_8_mb_minimo_320_320_px",
                  )}
                </p>
                <div className="button-group">
                  <label className="button secondary file-button">
                    <Upload size={16} />
                    {t("NewRecordPage.elegir_archivo")}
                    <input
                      aria-label={t("NewRecordPage.elegir_fotografia")}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        void chooseImage(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <label className="button secondary file-button">
                    <Camera size={16} />
                    {t("NewRecordPage.usar_camara")}
                    <input
                      aria-label={t("NewRecordPage.tomar_fotografia")}
                      type="file"
                      capture="environment"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        void chooseImage(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {checking && (
                  <p role="status">{t("NewRecordPage.comprobando_imagen")}</p>
                )}
              </div>
            )}
            <p className="field-help">
              {t(
                "NewRecordPage.se_comprobara_el_archivo_al_enviarlo_una_fotografia_legible_",
              )}
            </p>
          </section>
          <section className="panel panel-body">
            <div className="section-heading">
              <span className="section-number">02</span>
              <div>
                <h2>{t("NewRecordPage.lo_que_has_observado")}</h2>
                <p>
                  {t(
                    "NewRecordPage.responde_segun_tu_experiencia_si_no_sabes_una_respuesta_indi",
                  )}
                </p>
              </div>
            </div>
            <QuestionnaireFields value={answers} onChange={setAnswers} />
          </section>
          <div className="form-actions">
            <span>
              {t("NewRecordPage.tu_fotografia_todavia_no_se_ha_enviado")}
            </span>
            <button className="button primary" disabled={!file || checking}>
              {t("NewRecordPage.revisar_antes_de_enviar")}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
      )}
      {step === 2 && (
        <section className="panel panel-body">
          <h2>{t("NewRecordPage.revisa_tu_registro")}</h2>
          <p className="subtitle">
            {t("record.confirm_photo", {
              date: formatDate(answers.photo_date),
            })}
          </p>
          <div className="confirmation-grid">
            <img
              className="confirmation-image"
              src={preview}
              alt={t("NewRecordPage.fotografia_que_se_enviara")}
            />
            <QuestionnaireSummary value={answers} />
          </div>
          <Notice>
            {t(
              "NewRecordPage.el_envio_quedara_pendiente_de_revision_humana_no_recibiras_u",
            )}
          </Notice>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              {t(
                "NewRecordPage.revise_la_fotografia_y_las_respuestas_y_confirmo_que_quiero_",
              )}
            </span>
          </label>
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setStep(1)}
            >
              <ArrowLeft size={17} />
              {t("NewRecordPage.editar_registro")}
            </button>
            <button
              className="button primary"
              disabled={!confirmed || busy}
              onClick={submit}
            >
              {busy
                ? t("NewRecordPage.enviando_registro")
                : t("NewRecordPage.confirmar_y_enviar")}
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      )}
    </>
  );
}
