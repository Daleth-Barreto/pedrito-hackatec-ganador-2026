import { t, useLocale } from "../../i18n/runtime";
import {
  ArrowRight,
  Plus,
  Camera,
  ClipboardList,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, Loading, Notice, PageTitle } from "../../components/UI";
import { RecordTable } from "../records/RecordTable";
import { useRecords } from "../records/useRecords";
export function PatientHome() {
  useLocale();
  const { data, error, loading, reload } = useRecords("limit=5");
  return (
    <>
      <PageTitle
        eyebrow={t("PatientHome.mi_seguimiento")}
        title={t("PatientHome.cada_cambio_cuenta")}
      >
        {t(
          "PatientHome.un_espacio_para_registrar_tu_evolucion_y_compartirla_con_tu_",
        )}
      </PageTitle>
      <section className="patient-hero">
        <div>
          <span className="eyebrow">
            {t("PatientHome.tu_proximo_registro")}
          </span>
          <h2>{t("PatientHome.cuentanos_como_vas_hoy")}</h2>
          <p>
            {t(
              "PatientHome.una_fotografia_y_unas_preguntas_breves_ayudan_a_organizar_la",
            )}
          </p>
          <Link className="button primary" to="/records/new">
            <Plus size={18} />
            {t("PatientHome.crear_nuevo_registro")}
          </Link>
          <small>
            {t(
              "PatientHome.no_necesitas_interpretar_la_fotografia_tu_equipo_la_revisara",
            )}
          </small>
        </div>
        <div className="journey">
          <div>
            <span>
              <Camera size={20} />
            </span>
            <div>
              <strong>{t("PatientHome.1_comparte_una_fotografia")}</strong>
              <small>
                {t("PatientHome.con_tu_consentimiento_y_acceso_restringido")}
              </small>
            </div>
          </div>
          <div>
            <span>
              <ClipboardList size={20} />
            </span>
            <div>
              <strong>{t("PatientHome.2_describe_tus_cambios")}</strong>
              <small>
                {t("PatientHome.responde_lo_que_sabes_puedes_indicar_dudas")}
              </small>
            </div>
          </div>
          <div>
            <span>
              <UserRoundCheck size={20} />
            </span>
            <div>
              <strong>{t("PatientHome.3_consulta_la_revision")}</strong>
              <small>
                {t(
                  "PatientHome.la_valoracion_corresponde_al_personal_de_salud",
                )}
              </small>
            </div>
          </div>
        </div>
      </section>
      <section className="panel prosthesis-card">
        <span className="audience-icon">
          <Sparkles size={22} aria-hidden="true" />
        </span>
        <div>
          <h2>{t("PatientHome.tu_protesis")}</h2>
          <p>{t("PatientHome.tu_protesis_texto")}</p>
        </div>
        <Link className="button secondary" to="/demo">
          {t("PatientHome.ver_vista_previa")}
          <ArrowRight size={16} />
        </Link>
      </section>
      <Notice>
        <strong>
          {t(
            "PatientHome.el_analisis_visual_no_esta_disponible_en_esta_demostracion",
          )}
        </strong>{" "}
        {t(
          "PatientHome.las_respuestas_pueden_sugerir_una_prioridad_de_revision_no_c",
        )}
      </Notice>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t("PatientHome.tus_ultimos_registros")}</h2>
            <p>
              {t(
                "PatientHome.fotografias_respuestas_y_estado_de_revision_en_un_mismo_luga",
              )}
            </p>
          </div>
          <Link className="text-link" to="/history">
            {t("PatientHome.ver_historial")}
            <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="panel-body">
            <Notice kind="error">{error}</Notice>
            <button className="button secondary" onClick={reload}>
              {t("PatientHome.reintentar")}
            </button>
          </div>
        ) : data.items.length ? (
          <RecordTable records={data.items} />
        ) : (
          <EmptyState title={t("PatientHome.tu_seguimiento_empieza_aqui")}>
            {t(
              "PatientHome.cuando_envies_tu_primer_registro_podras_consultar_su_estado_",
            )}
          </EmptyState>
        )}
      </section>
    </>
  );
}
