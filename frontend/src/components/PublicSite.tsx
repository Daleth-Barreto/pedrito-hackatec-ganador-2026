import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Brand } from "./Brand";
import { t, useLocale } from "../i18n/runtime";

// Encabezado y pie compartidos por la landing, la vista previa y el acceso.
export function PublicHeader() {
  useLocale();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand" aria-label={t("Public.ir_al_inicio")}>
          <Brand />
        </Link>
        <button
          type="button"
          className="site-menu-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? t("Public.cerrar_menu") : t("Public.abrir_menu")}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav
          id="site-nav"
          className={`site-nav${open ? " open" : ""}`}
          aria-label={t("Public.navegacion_del_sitio")}
        >
          <a href="/#como-funciona" onClick={close}>
            {t("Public.como_funciona")}
          </a>
          <a href="/#pacientes" onClick={close}>
            {t("Public.pacientes")}
          </a>
          <a href="/#precios" onClick={close}>
            {t("Public.precios")}
          </a>
          <a href="/#clinicas" onClick={close}>
            {t("Public.clinicas")}
          </a>
          <NavLink to="/demo" onClick={close}>
            {t("Public.vista_previa")}
          </NavLink>
          <span className="site-nav-actions">
            <Link to="/login" className="button secondary" onClick={close}>
              {t("Public.iniciar_sesion")}
            </Link>
            <Link to="/register" className="button primary" onClick={close}>
              {t("Public.crear_cuenta")}
            </Link>
          </span>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  useLocale();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <Brand />
          <p>{t("Public.pie_descripcion")}</p>
        </div>
        <nav aria-label={t("Public.navegacion_del_sitio")}>
          <a href="/#como-funciona">{t("Public.como_funciona")}</a>
          <a href="/#precios">{t("Public.precios")}</a>
          <a href="/#clinicas">{t("Public.clinicas")}</a>
          <Link to="/demo">{t("Public.vista_previa")}</Link>
          <Link to="/privacy">{t("Public.aviso_de_privacidad")}</Link>
        </nav>
      </div>
      <small className="site-footer-legal">{t("Public.derechos")}</small>
    </footer>
  );
}
