import { Brand } from "../../components/Brand";
import { t, useLocale, configuredText } from "../../i18n/runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../../services/api";
import { Loading, Notice } from "../../components/UI";
interface NoticeData {
  version: string;
  controller: string;
  address: string;
  contact: string;
  retention_days: number;
}
export function PrivacyNotice() {
  useLocale();
  const [data, setData] = useState<NoticeData>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    api<NoticeData>("/privacy/notice", { signal: abort.signal })
      .then(setData)
      .catch((e) => {
        if (!abort.signal.aborted) setError(errorMessage(e));
      });
    return () => abort.abort();
  }, [retry]);
  return (
    <main className="legal-page">
      <Link to="/" className="public-brand">
        <Brand />
      </Link>
      <Link to="/" className="text-link">
        {t("PrivacyNotice.volver_al_inicio")}
      </Link>
      <h1>{t("PrivacyNotice.aviso_de_privacidad")}</h1>
      <Notice>
        {t(
          "PrivacyNotice.prototipo_de_demostracion_este_aviso_requiere_completar_los_",
        )}
      </Notice>
      {error ? (
        <>
          <Notice kind="error">{error}</Notice>
          <button onClick={() => setRetry((x) => x + 1)}>
            {t("PrivacyNotice.volver_a_intentar")}
          </button>
        </>
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <p>{t("privacy.version", { version: data.version })}</p>
          <h2>{t("PrivacyNotice.responsable_del_tratamiento")}</h2>
          <dl>
            <dt>{t("PrivacyNotice.nombre_o_razon_social")}</dt>
            <dd>{configuredText(data.controller)}</dd>
            <dt>{t("PrivacyNotice.domicilio")}</dt>
            <dd>{configuredText(data.address)}</dd>
            <dt>{t("PrivacyNotice.contacto_de_privacidad")}</dt>
            <dd>{configuredText(data.contact)}</dd>
          </dl>
          <h2>{t("PrivacyNotice.informacion_y_finalidad")}</h2>
          <p>
            {t(
              "PrivacyNotice.la_aplicacion_guarda_nombre_correo_contrasena_protegida_deci",
            )}
          </p>
          <h2>{t("PrivacyNotice.analisis_automatizado_y_acceso")}</h2>
          <p>
            {t(
              "PrivacyNotice.esta_version_aplica_reglas_al_cuestionario_y_genera_reportes",
            )}
          </p>
          <p>
            {t(
              "PrivacyNotice.puedes_ver_tus_registros_y_puede_consultarlos_el_personal_de",
            )}
          </p>
          <h2>{t("PrivacyNotice.conservacion_y_eliminacion")}</h2>
          <p>{t("privacy.retention", { days: data.retention_days })}</p>
          <p>
            {t(
              "PrivacyNotice.la_solicitud_de_eliminar_la_cuenta_es_independiente_de_los_d",
            )}
          </p>
          <h2>{t("PrivacyNotice.tus_derechos_y_decisiones")}</h2>
          <p>
            {t(
              "PrivacyNotice.puedes_solicitar_acceso_a_tus_datos_rectificacion_de_datos_i",
            )}
          </p>
          <p>
            {t(
              "PrivacyNotice.se_solicita_tu_contrasena_actual_para_comprobar_el_control_d",
            )}
          </p>
          <p>
            {t(
              "PrivacyNotice.la_atencion_formal_sus_plazos_requisitos_y_posibles_excepcio",
            )}
          </p>
          <p>
            {t("PrivacyNotice.referencias")}{" "}
            <a href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf">
              {t(
                "PrivacyNotice.ley_federal_de_proteccion_de_datos_personales_en_posesion_de",
              )}
            </a>{" "}
            {t("PrivacyNotice.y")}{" "}
            <a href="https://www.unesco.org/es/legal-affairs/recommendation-ethics-artificial-intelligence">
              {t(
                "PrivacyNotice.recomendacion_de_la_unesco_sobre_la_etica_de_la_ia",
              )}
            </a>
            {t(
              "PrivacyNotice.sus_principios_de_transparencia_privacidad_y_supervision_hum",
            )}
          </p>
        </>
      )}
    </main>
  );
}
