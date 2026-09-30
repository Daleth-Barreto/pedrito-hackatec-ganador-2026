import { t, useLocale } from "../../i18n/runtime";
import { useEffect, useState } from "react";
import { Filter, UsersRound } from "lucide-react";
import { EmptyState, Loading, Notice, PageTitle } from "../../components/UI";
import { api, errorMessage } from "../../services/api";
import type { User } from "../../types";
import { RecordTable } from "../records/RecordTable";
import { useRecords } from "../records/useRecords";
export function DashboardPage() {
  useLocale();
  const [patients, setPatients] = useState<User[]>([]);
  const [patientsError, setPatientsError] = useState("");
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    patient_id: "",
    from_date: "",
    to_date: "",
  });
  const [page, setPage] = useState(0);
  const params = new URLSearchParams({
    offset: String(page * 20),
    limit: "20",
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const { data, loading, error, reload } = useRecords(params.toString());
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setPatientsError("");
    api<User[]>("/patients", { signal: controller.signal })
      .then(setPatients)
      .catch((err) => {
        if (!controller.signal.aborted) setPatientsError(errorMessage(err));
      });
    return () => controller.abort();
  }, [attempt]);
  function filter(key: keyof typeof filters, value: string) {
    setFilters((v) => ({ ...v, [key]: value }));
    setPage(0);
  }
  return (
    <>
      <PageTitle
        eyebrow={t("DashboardPage.espacio_profesional")}
        title={t("DashboardPage.panel_de_revision")}
      >
        <span>
          {t(
            "DashboardPage.una_vista_compartida_de_los_registros_que_necesitan_tu_valor",
          )}
        </span>
      </PageTitle>
      <div className="clinical-intro">
        <div className="clinical-summary">
          <UsersRound size={26} />
          <div>
            <strong>{patients.length}</strong>
            <span>{t("DashboardPage.pacientes_asignados")}</span>
          </div>
        </div>
        <div>
          <strong>
            {t(
              "DashboardPage.la_prioridad_es_una_sugerencia_la_valoracion_es_tuya",
            )}
          </strong>
          <p>
            {t(
              "DashboardPage.las_reglas_del_cuestionario_apoyan_el_orden_de_revision_el_a",
            )}
          </p>
        </div>
      </div>
      {patientsError && (
        <Notice kind="error">
          {patientsError}{" "}
          <button onClick={() => setAttempt((v) => v + 1)}>
            {t("DashboardPage.reintentar_pacientes")}
          </button>
        </Notice>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t("DashboardPage.registros_de_seguimiento")}</h2>
            <p>
              {t(
                "DashboardPage.revisa_la_fotografia_y_el_contexto_antes_de_registrar_tu_val",
              )}
            </p>
          </div>
          <span className="count-badge">
            {t("records.count", { count: data.total })}
          </span>
        </div>
        <div className="filters">
          <div className="filter-heading">
            <Filter size={16} />
            {t("DashboardPage.filtrar_registros")}
          </div>
          <div className="filter-grid">
            <label>
              {t("DashboardPage.paciente")}
              <select
                value={filters.patient_id}
                onChange={(e) => filter("patient_id", e.target.value)}
              >
                <option value="">
                  {t("DashboardPage.todos_los_asignados")}
                </option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("DashboardPage.prioridad")}
              <select
                value={filters.priority}
                onChange={(e) => filter("priority", e.target.value)}
              >
                <option value="">{t("DashboardPage.todas")}</option>
                <option value="alerta">{t("DashboardPage.alerta")}</option>
                <option value="vigilancia">
                  {t("DashboardPage.vigilancia")}
                </option>
                <option value="normal">{t("DashboardPage.normal")}</option>
                <option value="unavailable">
                  {t("DashboardPage.sin_evaluacion")}
                </option>
              </select>
            </label>
            <label>
              {t("DashboardPage.estado")}
              <select
                value={filters.status}
                onChange={(e) => filter("status", e.target.value)}
              >
                <option value="">{t("DashboardPage.todos")}</option>
                <option value="pending">{t("DashboardPage.pendiente")}</option>
                <option value="reviewed">{t("DashboardPage.revisado")}</option>
              </select>
            </label>
            <label>
              {t("DashboardPage.desde")}
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => filter("from_date", e.target.value)}
              />
            </label>
            <label>
              {t("DashboardPage.hasta")}
              <input
                type="date"
                min={filters.from_date}
                value={filters.to_date}
                onChange={(e) => filter("to_date", e.target.value)}
              />
            </label>
          </div>
          <button
            className="text-link"
            onClick={() => {
              setFilters({
                priority: "",
                status: "",
                patient_id: "",
                from_date: "",
                to_date: "",
              });
              setPage(0);
            }}
          >
            {t("DashboardPage.limpiar_filtros")}
          </button>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="panel-body">
            <Notice kind="error">{error}</Notice>
            <button className="button secondary" onClick={reload}>
              {t("DashboardPage.reintentar")}
            </button>
          </div>
        ) : data.items.length ? (
          <RecordTable clinical records={data.items} />
        ) : (
          <EmptyState
            title={t("DashboardPage.no_hay_registros_para_estos_filtros")}
          >
            {t(
              "DashboardPage.cuando_un_paciente_asignado_envie_un_registro_podras_revisar",
            )}
          </EmptyState>
        )}
        <div className="pagination">
          <span>
            {t("DashboardPage.ordenados_del_mas_reciente_al_anterior")}
          </span>
          <button
            disabled={!page || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("DashboardPage.anterior")}
          </button>
          <button
            disabled={(page + 1) * 20 >= data.total || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("DashboardPage.siguiente")}
          </button>
        </div>
      </section>
      <p className="field-help">
        {t(
          "DashboardPage.sin_evaluacion_requiere_revision_humana_nunca_equivale_a_una",
        )}
      </p>
    </>
  );
}
