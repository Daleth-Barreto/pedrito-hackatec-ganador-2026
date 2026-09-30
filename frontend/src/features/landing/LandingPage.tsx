import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  Box,
  Check,
  Clock,
  Eye,
  Hand,
  HeartHandshake,
  PiggyBank,
  Stethoscope,
  Truck,
  UserRound,
  Video,
} from "lucide-react";
import { PublicFooter, PublicHeader } from "../../components/PublicSite";
import { t, useLocale } from "../../i18n/runtime";
import type { MessageKey } from "../../i18n/catalog";
import {
  FOLLOW_UP_MONTHLY,
  PACKAGES,
  PACKAGE_INCLUDES,
  SCAN_PRICE_PER_INCH,
  formatMXN,
} from "../commerce/pricing";

const STEPS: { icon: typeof Video; title: MessageKey; text: MessageKey }[] = [
  { icon: Video, title: "Landing.paso1_titulo", text: "Landing.paso1_texto" },
  { icon: Box, title: "Landing.paso2_titulo", text: "Landing.paso2_texto" },
  { icon: Eye, title: "Landing.paso3_titulo", text: "Landing.paso3_texto" },
  { icon: Truck, title: "Landing.paso4_titulo", text: "Landing.paso4_texto" },
];

function CheckList({ items }: { items: MessageKey[] }) {
  return (
    <ul className="check-list">
      {items.map((item) => (
        <li key={item}>
          <Check size={17} aria-hidden="true" />
          {t(item)}
        </li>
      ))}
    </ul>
  );
}

function ScanCalculator() {
  const [inches, setInches] = useState(12);
  const safe = Number.isFinite(inches) && inches > 0 ? inches : 0;
  return (
    <div className="scan-calculator">
      <h3>{t("Landing.calculadora_titulo")}</h3>
      <label>
        {t("Landing.calculadora_pulgadas")}
        <input
          type="number"
          inputMode="decimal"
          min={1}
          max={200}
          step={1}
          value={Number.isNaN(inches) ? "" : inches}
          onChange={(event) => setInches(event.target.valueAsNumber)}
        />
        <small>{t("Landing.calculadora_ayuda")}</small>
      </label>
      <div className="scan-total" aria-live="polite">
        <span>{t("Landing.calculadora_total")}</span>
        <strong>{formatMXN(safe * SCAN_PRICE_PER_INCH)}</strong>
        <small>
          {t("Landing.calculadora_formula", {
            inches: safe,
            price: formatMXN(SCAN_PRICE_PER_INCH),
          })}
        </small>
      </div>
    </div>
  );
}

export function LandingPage() {
  useLocale();
  return (
    <div className="site">
      <PublicHeader />
      <main id="main-content">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="eyebrow">{t("Landing.eyebrow")}</p>
            <h1>{t("Landing.titulo")}</h1>
            <p className="landing-lead">{t("Landing.subtitulo")}</p>
            <div className="button-group">
              <Link to="/demo" className="button primary large">
                {t("Landing.cta_vista_previa")}
                <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="button secondary large">
                {t("Landing.cta_crear_cuenta")}
              </Link>
            </div>
            <ul className="landing-facts">
              <li>
                <Video size={18} aria-hidden="true" />
                {t("Landing.dato_video")}
              </li>
              <li>
                <BellRing size={18} aria-hidden="true" />
                {t("Landing.dato_mes_gratis")}
              </li>
              <li>
                <Stethoscope size={18} aria-hidden="true" />
                {t("Landing.dato_revision")}
              </li>
            </ul>
          </div>
          <div className="landing-hero-visual">
            <span className="hero-mark" aria-hidden="true">
              <Hand size={120} strokeWidth={1.4} />
            </span>
            <span className="hero-chip one">
              <Check size={15} aria-hidden="true" />
              {t("Landing.chip_escaneo")}
            </span>
            <span className="hero-chip two">
              <Box size={15} aria-hidden="true" />
              {t("Landing.chip_ajuste")}
            </span>
            <span className="hero-chip three">
              <Truck size={15} aria-hidden="true" />
              {t("Landing.chip_envio")}
            </span>
          </div>
        </section>

        <section className="landing-section" id="como-funciona">
          <header className="landing-heading">
            <p className="eyebrow">{t("Landing.pasos_eyebrow")}</p>
            <h2>{t("Landing.pasos_titulo")}</h2>
          </header>
          <ol className="landing-steps">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title}>
                <span className="landing-step-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="landing-step-number">{index + 1}</span>
                <h3>{t(title)}</h3>
                <p>{t(text)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section tinted" id="pacientes">
          <header className="landing-heading">
            <p className="eyebrow">{t("Landing.audiencias_eyebrow")}</p>
            <h2>{t("Landing.audiencias_titulo")}</h2>
          </header>
          <div className="audience-grid">
            <article className="audience-card">
              <span className="audience-icon">
                <UserRound size={24} aria-hidden="true" />
              </span>
              <h3>{t("Landing.pacientes_titulo")}</h3>
              <p>{t("Landing.pacientes_texto")}</p>
              <CheckList
                items={[
                  "Landing.pacientes_b1",
                  "Landing.pacientes_b2",
                  "Landing.pacientes_b3",
                ]}
              />
              <Link to="/register" className="button primary">
                {t("Landing.pacientes_cta")}
                <ArrowRight size={17} />
              </Link>
            </article>
            <article className="audience-card" id="medicos">
              <span className="audience-icon">
                <Stethoscope size={24} aria-hidden="true" />
              </span>
              <h3>{t("Landing.medicos_titulo")}</h3>
              <p>{t("Landing.medicos_texto")}</p>
              <CheckList
                items={[
                  "Landing.medicos_b1",
                  "Landing.medicos_b2",
                  "Landing.medicos_b3",
                ]}
              />
              <Link to="/login" className="button secondary">
                {t("Landing.medicos_cta")}
                <ArrowRight size={17} />
              </Link>
            </article>
          </div>
        </section>

        <section className="landing-section" id="precios">
          <header className="landing-heading">
            <p className="eyebrow">{t("Landing.precios_eyebrow")}</p>
            <h2>{t("Landing.precios_titulo")}</h2>
            <p>{t("Landing.precios_texto")}</p>
          </header>
          <div className="price-grid">
            {PACKAGES.map((item) => (
              <article
                key={item.id}
                className={`price-card${item.featured ? " featured" : ""}`}
              >
                {item.featured && (
                  <span className="price-badge">
                    {t("Pricing.recomendado")}
                  </span>
                )}
                <h3>{t(item.name)}</h3>
                <p className="price-examples">{t(item.examples)}</p>
                <p className="price-amount">
                  <strong>{formatMXN(item.price)}</strong>
                  <span>{t("Pricing.pago_unico")}</span>
                </p>
                <CheckList items={PACKAGE_INCLUDES} />
              </article>
            ))}
          </div>

          <article className="follow-up-card">
            <div>
              <p className="eyebrow">{t("Landing.seguimiento_eyebrow")}</p>
              <h3>{t("Landing.seguimiento_titulo")}</h3>
              <p>{t("Landing.seguimiento_texto")}</p>
              <CheckList
                items={[
                  "Landing.seguimiento_b1",
                  "Landing.seguimiento_b2",
                  "Landing.seguimiento_b3",
                  "Landing.seguimiento_b4",
                ]}
              />
            </div>
            <div className="follow-up-price">
              <span className="price-badge soft">
                {t("Pricing.incluye_mes_gratis")}
              </span>
              <p className="price-amount">
                <strong>{formatMXN(FOLLOW_UP_MONTHLY)}</strong>
                <span>{t("Pricing.por_mes")}</span>
              </p>
              <small>{t("Landing.seguimiento_nota")}</small>
              <Link to="/demo" className="button primary full">
                {t("Landing.elegir_paquete")}
                <ArrowRight size={17} />
              </Link>
            </div>
          </article>
          <p className="price-note">{t("Public.precios_aproximados")}</p>
        </section>

        <section className="landing-section dark" id="clinicas">
          <div className="b2b-grid">
            <div>
              <p className="eyebrow">{t("Landing.empresas_eyebrow")}</p>
              <h2>{t("Landing.empresas_titulo")}</h2>
              <p className="landing-lead">{t("Landing.empresas_texto")}</p>
              <p className="price-amount inverse">
                <strong>{formatMXN(SCAN_PRICE_PER_INCH)}</strong>
                <span>{t("Pricing.por_pulgada")}</span>
              </p>
              <ul className="b2b-benefits">
                <li>
                  <PiggyBank size={22} aria-hidden="true" />
                  <strong>{t("Landing.empresas_b1_titulo")}</strong>
                  <span>{t("Landing.empresas_b1_texto")}</span>
                </li>
                <li>
                  <Clock size={22} aria-hidden="true" />
                  <strong>{t("Landing.empresas_b2_titulo")}</strong>
                  <span>{t("Landing.empresas_b2_texto")}</span>
                </li>
                <li>
                  <HeartHandshake size={22} aria-hidden="true" />
                  <strong>{t("Landing.empresas_b3_titulo")}</strong>
                  <span>{t("Landing.empresas_b3_texto")}</span>
                </li>
              </ul>
            </div>
            <div className="b2b-side">
              <ScanCalculator />
              <Link to="/demo" className="button secondary full">
                {t("Landing.empresas_cta")}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-section narrow">
          <header className="landing-heading">
            <h2>{t("Landing.faq_titulo")}</h2>
          </header>
          <div className="faq">
            {(
              [
                ["Landing.faq1_q", "Landing.faq1_a"],
                ["Landing.faq2_q", "Landing.faq2_a"],
                ["Landing.faq3_q", "Landing.faq3_a"],
              ] as const
            ).map(([question, answer]) => (
              <details key={question}>
                <summary>{t(question)}</summary>
                <p>{t(answer)}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <h2>{t("Landing.cta_final_titulo")}</h2>
          <p>{t("Landing.cta_final_texto")}</p>
          <Link to="/demo" className="button primary large">
            {t("Landing.cta_vista_previa")}
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
