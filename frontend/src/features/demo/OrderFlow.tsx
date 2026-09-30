import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BellRing,
  Check,
  CircleCheck,
  Factory,
  Home,
  PackageCheck,
  Truck,
} from "lucide-react";
import { Notice } from "../../components/UI";
import { dateLocale, t, useLocale } from "../../i18n/runtime";
import {
  FOLLOW_UP_MONTHLY,
  FREE_FOLLOW_UP_MONTHS,
  PACKAGES,
  formatMXN,
  packageById,
  type PackageId,
} from "../commerce/pricing";

export interface Order {
  code: string;
  packageId: PackageId;
  city: string;
}

export function OrderSteps({ step }: { step: 0 | 1 | 2 }) {
  useLocale();
  const labels = [
    t("Order.paso_vista"),
    t("Order.paso_pedido"),
    t("Order.paso_confirmacion"),
  ];
  return (
    <ol className="stepper order-stepper">
      {labels.map((label, i) => (
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
  );
}

function newOrderCode() {
  const n = Math.floor(Math.random() * 90000) + 10000;
  return `KNV-${n}`;
}

export function OrderView({
  initial,
  onBack,
  onConfirm,
  showSteps = true,
}: {
  initial: PackageId;
  onBack: () => void;
  onConfirm: (order: Order) => void;
  showSteps?: boolean;
}) {
  useLocale();
  const [selected, setSelected] = useState<PackageId>(initial);
  const chosen = packageById(selected);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onConfirm({
      code: newOrderCode(),
      packageId: selected,
      city: String(data.get("city") ?? "").trim(),
    });
  }

  return (
    <div className="order-view">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        {t("Order.volver")}
      </button>
      {showSteps && <OrderSteps step={1} />}
      <div className="page-title">
        <h1>{t("Order.titulo")}</h1>
        <p className="subtitle">{t("Order.subtitulo")}</p>
      </div>
      <form className="order-grid" onSubmit={submit}>
        <div className="order-main">
          <fieldset className="panel order-section">
            <legend>{t("Order.paquete")}</legend>
            <div className="package-options">
              {PACKAGES.map((item) => (
                <label
                  key={item.id}
                  className={`package-option${item.id === selected ? " on" : ""}${item.available ? "" : " unavailable"}`}
                >
                  <input
                    type="radio"
                    name="package"
                    value={item.id}
                    checked={item.id === selected}
                    disabled={!item.available}
                    onChange={() => setSelected(item.id)}
                  />
                  <span className="package-option-text">
                    <strong>{t(item.name)}</strong>
                    <small>{t(item.examples)}</small>
                  </span>
                  <span className="package-option-price">
                    {formatMXN(item.price)}
                  </span>
                  {item.id === initial && (
                    <span className="price-badge soft">
                      {t("Preview.paquete_recomendado")}
                    </span>
                  )}
                  {!item.available && (
                    <span className="price-badge muted">
                      {t("Pricing.no_disponible")}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="panel order-section">
            <legend>{t("Order.envio_titulo")}</legend>
            <div className="order-fields">
              <label className="span-2">
                {t("Order.nombre")}
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={120}
                />
              </label>
              <label className="span-2">
                {t("Order.direccion")}
                <input
                  name="street"
                  autoComplete="street-address"
                  required
                  maxLength={200}
                />
              </label>
              <label>
                {t("Order.ciudad")}
                <input
                  name="city"
                  autoComplete="address-level2"
                  required
                  maxLength={80}
                />
              </label>
              <label>
                {t("Order.codigo_postal")}
                <input
                  name="postal"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  required
                  maxLength={5}
                />
              </label>
              <label className="span-2">
                {t("Order.telefono")}
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={20}
                />
              </label>
            </div>
          </fieldset>
        </div>

        <aside className="panel order-summary">
          <h2>{t("Order.resumen")}</h2>
          <dl>
            <div>
              <dt>
                {t("Order.paquete")} · {t(chosen.name)}
              </dt>
              <dd>{formatMXN(chosen.price)}</dd>
            </div>
            <div>
              <dt>{t("Order.envio")}</dt>
              <dd>{t("Order.incluido")}</dd>
            </div>
            <div>
              <dt>{t("Order.seguimiento_primer_mes")}</dt>
              <dd>{t("Order.gratis")}</dd>
            </div>
            <div className="order-total">
              <dt>{t("Order.total")}</dt>
              <dd>{formatMXN(chosen.price)}</dd>
            </div>
          </dl>
          <button className="button primary full large">
            <PackageCheck size={18} />
            {t("Order.confirmar")}
          </button>
          <small>{t("Order.sin_cargos")}</small>
          <small>{t("Public.precios_aproximados")}</small>
        </aside>
      </form>
    </div>
  );
}

export function ConfirmationView({
  order,
  showSteps = true,
  inApp = false,
}: {
  order: Order;
  showSteps?: boolean;
  inApp?: boolean;
}) {
  useLocale();
  const [followUp, setFollowUp] = useState<"ask" | "active" | "declined">(
    "ask",
  );
  const firstCharge = new Date();
  firstCharge.setMonth(firstCharge.getMonth() + FREE_FOLLOW_UP_MONTHS);
  const timeline = [
    {
      icon: Factory,
      title: t("Order.linea_fabricacion"),
      text: t("Order.linea_fabricacion_texto"),
    },
    {
      icon: Truck,
      title: t("Order.linea_envio"),
      text: t("Order.linea_envio_texto"),
    },
    {
      icon: Home,
      title: t("Order.linea_entrega"),
      text: t("Order.linea_entrega_texto"),
    },
  ];

  return (
    <div className="order-view">
      {showSteps && <OrderSteps step={2} />}
      <section className="panel confirmation-hero">
        <CircleCheck size={44} aria-hidden="true" />
        <h1>{t("Order.confirmado_titulo")}</h1>
        <p>
          {t("Order.confirmado_texto", { code: order.code, city: order.city })}
        </p>
        <ol className="order-timeline">
          {timeline.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className={i === 0 ? "current" : ""}>
              <span>
                <Icon size={20} aria-hidden="true" />
              </span>
              <strong>{title}</strong>
              <small>{text}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel follow-up-offer" aria-live="polite">
        <span className="audience-icon">
          <BellRing size={24} aria-hidden="true" />
        </span>
        <div className="follow-up-offer-body">
          <h2>{t("Order.seguimiento_titulo")}</h2>
          <p>
            {t("Order.seguimiento_texto", {
              price: formatMXN(FOLLOW_UP_MONTHLY),
            })}
          </p>
          {followUp === "ask" && (
            <div className="button-group">
              <button
                type="button"
                className="button primary"
                onClick={() => setFollowUp("active")}
              >
                {t("Order.activar")}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setFollowUp("declined")}
              >
                {t("Order.ahora_no")}
              </button>
            </div>
          )}
          {followUp === "active" && (
            <Notice kind="success">
              {t("Order.activado", {
                date: firstCharge.toLocaleDateString(dateLocale(), {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              })}
            </Notice>
          )}
          {followUp === "declined" && <Notice>{t("Order.rechazado")}</Notice>}
        </div>
      </section>

      {inApp ? (
        <div className="button-group order-end">
          <Link to="/" className="button primary">
            {t("Order.ir_a_mi_seguimiento")}
          </Link>
          <Link to="/records/new" className="button secondary">
            {t("Order.primer_registro")}
          </Link>
        </div>
      ) : (
        <div className="button-group order-end">
          <Link to="/register" className="button primary">
            {t("Order.crear_cuenta")}
          </Link>
          <Link to="/" className="button secondary">
            {t("Order.volver_inicio")}
          </Link>
        </div>
      )}
      <small className="order-disclaimer">{t("Order.sin_cargos")}</small>
    </div>
  );
}
