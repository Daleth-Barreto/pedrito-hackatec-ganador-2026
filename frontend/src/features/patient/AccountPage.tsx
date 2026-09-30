import { t, useLocale } from "../../i18n/runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageTitle, Notice } from "../../components/UI";
import { api, errorMessage, formatDate } from "../../services/api";
import { ProfileForms, postForm } from "./AccountForms";
import { PrivacyRequests } from "./PrivacyRequests";
export function AccountPage() {
  useLocale();
  const [consent, setConsent] = useState<{
    accepted: boolean;
    accepted_at: string;
    version: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    api<typeof consent>("/consents/current", { signal: abort.signal })
      .then(setConsent)
      .catch((e) => {
        if (!abort.signal.aborted) setError(errorMessage(e));
      });
    return () => abort.abort();
  }, []);
  async function revoke() {
    setBusy(true);
    setError("");
    try {
      const result = await postForm("/consents", {
        accepted: false,
        version: "2",
      });
      setConsent(result as typeof consent);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow={t("AccountPage.cuenta_y_privacidad")}
        title={t("AccountPage.tus_datos_tus_decisiones")}
      >
        {t(
          "AccountPage.consulta_tus_datos_protege_tu_acceso_y_da_seguimiento_a_tus_",
        )}
      </PageTitle>
      <div className="account-stack">
        <section className="panel panel-body">
          <h2>{t("AccountPage.consentimiento_informado")}</h2>
          <p>
            {t("AccountPage.el")}
            <Link to="/privacy">{t("AccountPage.aviso_de_privacidad")}</Link>
            {t(
              "AccountPage.explica_quien_accede_a_tus_datos_y_para_que_se_usan",
            )}
          </p>
          {error && <Notice kind="error">{error}</Notice>}
          <p>
            {consent
              ? t("AccountPage.value0_version_value1_value2", {
                  value0: consent.accepted
                    ? t("AccountPage.aceptado")
                    : t("AccountPage.no_autorizado"),
                  value1: consent.version,
                  value2: formatDate(consent.accepted_at),
                })
              : t("AccountPage.no_hay_una_aceptacion_vigente_de_la_version_2")}
          </p>
          {consent?.accepted && (
            <>
              <p>
                {t(
                  "AccountPage.revocar_impide_enviar_nuevos_registros_los_anteriores_se_con",
                )}
              </p>
              <button
                className="button secondary"
                onClick={revoke}
                disabled={busy}
              >
                {busy
                  ? t("AccountPage.guardando")
                  : t(
                      "AccountPage.revocar_consentimiento_para_nuevos_registros",
                    )}
              </button>
            </>
          )}
        </section>
        <ProfileForms />
        <PrivacyRequests />
      </div>
    </>
  );
}
