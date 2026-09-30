import { t, useLocale } from "../i18n/runtime";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Priority } from "../types";
export function Notice({
  children,
  kind = "info",
}: {
  children: ReactNode;
  kind?: "info" | "error" | "success";
}) {
  useLocale();
  return (
    <div
      className={`notice ${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {kind === "success" ? (
        <CheckCircle2 size={19} />
      ) : (
        <AlertCircle size={19} />
      )}
      <div>{children}</div>
    </div>
  );
}
export function Loading({
  text = t("UI.cargando_informacion"),
}: {
  text?: string;
}) {
  useLocale();
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={23} />
      {text}
    </div>
  );
}
export function PriorityBadge({ priority }: { priority: Priority }) {
  useLocale();
  const label = priority
    ? {
        normal: t("UI.normal"),
        vigilancia: t("UI.vigilancia"),
        alerta: t("UI.alerta"),
      }[priority]
    : t("UI.sin_evaluacion");
  const Icon =
    priority === "normal"
      ? CheckCircle2
      : priority === "alerta"
        ? AlertCircle
        : Clock3;
  return (
    <span className={`badge priority-${priority ?? "none"}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}
export function StatusBadge({ status }: { status: "pending" | "reviewed" }) {
  useLocale();
  return (
    <span className={`review-status ${status}`}>
      {status === "reviewed" ? (
        <CheckCircle2 size={14} />
      ) : (
        <Clock3 size={14} />
      )}
      {status === "reviewed" ? t("UI.revisado") : t("UI.pendiente")}
    </span>
  );
}
export function PageTitle({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  useLocale();
  return (
    <header className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children && <p className="subtitle">{children}</p>}
      </div>
      {action}
    </header>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  useLocale();
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <ShieldCheck size={28} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
