import { t, useLocale } from "../../i18n/runtime";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PriorityBadge, StatusBadge } from "../../components/UI";
import { formatDate } from "../../services/api";
import type { RecordSummary } from "../../types";
export function RecordTable({
  records,
  clinical = false,
}: {
  records: RecordSummary[];
  clinical?: boolean;
}) {
  useLocale();
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>
              {clinical
                ? t("RecordTable.paciente_registro")
                : t("RecordTable.registro")}
            </th>
            <th>{t("RecordTable.fotografia")}</th>
            <th>{t("RecordTable.prioridad_sugerida")}</th>
            <th>{t("RecordTable.revision")}</th>
            <th>
              <span className="sr-only">{t("RecordTable.acciones")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                <Link className="record-name" to={`/records/${record.id}`}>
                  {clinical
                    ? record.patient_name
                    : t("RecordTable.registro_del_value0", {
                        value0: formatDate(record.created_at),
                      })}
                </Link>
                <small className="table-sub">
                  {record.id.slice(0, 8).toUpperCase()}
                  {record.is_demo ? t("RecordTable.demostracion") : ""}
                </small>
              </td>
              <td data-label={t("RecordTable.fotografia")}>
                {formatDate(record.photo_date)}
              </td>
              <td data-label={t("RecordTable.prioridad_sugerida")}>
                <PriorityBadge priority={record.priority} />
              </td>
              <td data-label={t("RecordTable.revision")}>
                <StatusBadge status={record.status} />
              </td>
              <td>
                <Link
                  className="row-link"
                  to={`/records/${record.id}`}
                  aria-label={t("RecordTable.ver_registro_value0", {
                    value0: record.id.slice(0, 8),
                  })}
                >
                  {t("RecordTable.ver")}
                  <ArrowUpRight size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
