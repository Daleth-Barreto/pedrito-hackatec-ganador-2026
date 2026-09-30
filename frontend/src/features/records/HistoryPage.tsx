import { t, useLocale } from "../../i18n/runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, Loading, Notice, PageTitle } from "../../components/UI";
import { RecordTable } from "./RecordTable";
import { useRecords } from "./useRecords";
export function HistoryPage() {
  useLocale();
  const [page, setPage] = useState(0);
  const { data, loading, error, reload } = useRecords(
    `offset=${page * 20}&limit=20`,
  );
  return (
    <>
      <PageTitle
        eyebrow={t("HistoryPage.mis_registros")}
        title={t("HistoryPage.tu_historial")}
        action={
          <Link className="button primary" to="/records/new">
            {t("HistoryPage.nuevo_registro")}
          </Link>
        }
      >
        {t(
          "HistoryPage.consulta_tu_evolucion_en_orden_cronologico_del_registro_mas_",
        )}
      </PageTitle>
      <section className="panel">
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="panel-body">
            <Notice kind="error">{error}</Notice>
            <button className="button secondary" onClick={reload}>
              {t("HistoryPage.reintentar")}
            </button>
          </div>
        ) : data.items.length ? (
          <RecordTable records={data.items} />
        ) : (
          <EmptyState title={t("HistoryPage.aun_no_hay_registros")}>
            {t("HistoryPage.los_envios_que_completes_apareceran_aqui")}
          </EmptyState>
        )}
        <div className="pagination">
          <span>{t("records.count", { count: data.total })}</span>
          <button
            disabled={!page || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("HistoryPage.anterior")}
          </button>
          <button
            disabled={(page + 1) * 20 >= data.total || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("HistoryPage.siguiente")}
          </button>
        </div>
      </section>
    </>
  );
}
