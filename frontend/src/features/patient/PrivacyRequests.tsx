import { t, useLocale } from "../../i18n/runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage, formatDate } from "../../services/api";
import { Loading, Notice } from "../../components/UI";
import { postForm, SecureForm } from "./AccountForms";
interface RequestItem {
  id: string;
  kind: string;
  status: string;
  details: string;
  response: string;
  created_at: string;
  verified_at: string;
}
const kinds = (): Record<string, string> => ({
  access: t("PrivacyRequests.acceso"),
  rectification: t("PrivacyRequests.rectificacion"),
  cancellation: t("PrivacyRequests.cancelacion"),
  opposition: t("PrivacyRequests.oposicion"),
  account_deletion: t("PrivacyRequests.eliminacion_de_cuenta"),
});
const statuses = (): Record<string, string> => ({
  received: t("PrivacyRequests.recibida"),
  in_review: t("PrivacyRequests.en_revision"),
  needs_information: t("PrivacyRequests.informacion_adicional_requerida"),
  resolved: t("PrivacyRequests.respondida"),
  rejected: t("PrivacyRequests.no_procedente"),
  cancelled: t("PrivacyRequests.cancelada"),
});
export function PrivacyRequests() {
  useLocale();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((x) => x + 1);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    api<RequestItem[]>("/privacy/requests", { signal: abort.signal })
      .then(setItems)
      .catch((e) => {
        if (!abort.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [version]);
  async function cancel() {
    setError("");
    try {
      await postForm("/account/deletion/cancel", {});
      refresh();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <SecureForm
        title={t("PrivacyRequests.solicitar_derechos_arco")}
        label={t("PrivacyRequests.enviar_solicitud")}
        success={t(
          "PrivacyRequests.solicitud_recibida_consulta_el_folio_y_su_estado_abajo",
        )}
        onDone={refresh}
        action={(data) =>
          postForm("/privacy/requests", {
            kind: data.get("kind"),
            details: data.get("details"),
            current_password: data.get("current_password"),
          })
        }
      >
        <p>
          {t(
            "PrivacyRequests.comprobamos_el_control_de_tu_cuenta_con_tu_contrasena_la_acr",
          )}{" "}
          <Link to="/privacy">{t("PrivacyRequests.aviso_de_privacidad")}</Link>.
        </p>
        <label>
          {t("PrivacyRequests.derecho_que_deseas_ejercer")}
          <select name="kind" required>
            <option value="">
              {t("PrivacyRequests.selecciona_un_derecho")}
            </option>
            {Object.entries(kinds())
              .filter(([key]) => key !== "account_deletion")
              .map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
          </select>
        </label>
        <label>
          {t("PrivacyRequests.datos_y_peticion")}
          <textarea
            name="details"
            required
            minLength={10}
            maxLength={3000}
            rows={4}
            placeholder={t(
              "PrivacyRequests.describe_los_datos_y_el_acceso_cambio_cancelacion_u_oposicio",
            )}
          />
        </label>
      </SecureForm>
      <section className="panel panel-body">
        <h2>{t("PrivacyRequests.mis_solicitudes")}</h2>
        <p>
          {t(
            "PrivacyRequests.la_respuesta_se_publica_aqui_este_prototipo_no_envia_correos",
          )}
        </p>
        {error && <Notice kind="error">{error}</Notice>}
        <button
          className="button secondary"
          onClick={refresh}
          disabled={loading}
        >
          {t("PrivacyRequests.actualizar_estados")}
        </button>
        {loading ? (
          <Loading />
        ) : !items.length ? (
          <p>{t("PrivacyRequests.aun_no_has_enviado_solicitudes")}</p>
        ) : (
          <ol className="request-list">
            {items.map((item) => (
              <li key={item.id}>
                <h3>
                  {kinds()[item.kind]} ·{" "}
                  {statuses()[item.status] ?? item.status}
                </h3>
                <p>
                  {t("PrivacyRequests.enviada_el")}
                  {formatDate(item.created_at)}
                  {t("PrivacyRequests.control_de_cuenta_verificado_el")}
                  {formatDate(item.verified_at)}.
                </p>
                <p className="request-id">
                  {t("privacy.receipt", { id: item.id })}
                </p>
                <p>{item.details}</p>
                {item.response && <blockquote>{item.response}</blockquote>}
                {item.kind === "account_deletion" &&
                  item.status === "received" && (
                    <button className="button secondary" onClick={cancel}>
                      {t("PrivacyRequests.cancelar_eliminacion")}
                    </button>
                  )}
              </li>
            ))}
          </ol>
        )}
      </section>
      <SecureForm
        title={t("PrivacyRequests.solicitar_eliminacion_de_cuenta")}
        label={t("PrivacyRequests.confirmar_solicitud_de_eliminacion")}
        success={t(
          "PrivacyRequests.eliminacion_solicitada_aun_no_se_han_borrado_tus_datos_consu",
        )}
        onDone={refresh}
        action={(data) =>
          postForm("/account/deletion", {
            confirmation: data.get("confirmation"),
            current_password: data.get("current_password"),
          })
        }
      >
        <p>
          {t(
            "PrivacyRequests.el_operador_podra_ejecutarla_despues_de_un_minimo_de_24_hora",
          )}
        </p>
        <label>
          {t("PrivacyRequests.para_confirmar_escribe_eliminar_mi_cuenta")}
          <input
            name="confirmation"
            required
            pattern="ELIMINAR MI CUENTA"
            autoComplete="off"
          />
        </label>
      </SecureForm>
    </>
  );
}
