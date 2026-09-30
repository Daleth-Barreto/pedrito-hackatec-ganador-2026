import { Brand } from "../components/Brand";
import { t, useLocale } from "../i18n/runtime";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  Plus,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { Notice } from "../components/UI";
import { errorMessage } from "../services/api";
export function Layout() {
  useLocale();
  const { user, logout } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  async function exit() {
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t("Layout.saltar_al_contenido")}
      </a>
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <Brand />
        </NavLink>
        <div className="workspace-label">
          {user.role === "patient"
            ? t("Layout.mi_espacio")
            : t("Layout.espacio_profesional")}
        </div>
        <nav aria-label={t("Layout.navegacion_principal")}>
          <NavLink to="/" end>
            <LayoutDashboard size={19} />
            {user.role === "patient"
              ? t("Layout.mi_seguimiento")
              : t("Layout.panel_de_revision")}
          </NavLink>
          {user.role === "patient" && (
            <>
              <NavLink to="/records/new">
                <Plus size={19} />
                {t("Layout.nuevo_registro")}
              </NavLink>
              <NavLink to="/history">
                <History size={19} />
                {t("Layout.mi_historial")}
              </NavLink>
              <NavLink to="/prosthesis">
                <Sparkles size={19} />
                {t("Layout.mi_protesis")}
              </NavLink>
              <NavLink to="/account">
                {t("Layout.mi_cuenta_y_privacidad")}
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <ShieldCheck size={21} />
            <strong>{t("Layout.informacion_con_proposito")}</strong>
            <p>
              {t(
                "Layout.tus_registros_apoyan_la_revision_no_sustituyen_una_valoracio",
              )}
            </p>
          </div>
          <div className="profile">
            <span className="avatar">
              {user.role === "patient" ? "PA" : "PS"}
            </span>
            <div>
              <strong>
                {user.role === "patient"
                  ? t("Layout.paciente")
                  : t("Layout.personal_de_salud")}
              </strong>
              <small>
                {user.is_demo ? t("Layout.cuenta_de_demostracion") : user.name}
              </small>
            </div>
          </div>
          <button className="logout" onClick={exit} disabled={busy}>
            <LogOut size={17} />
            {busy ? t("Layout.cerrando") : t("Layout.cerrar_sesion")}
          </button>
        </div>
      </aside>
      <div className="main-area">
        <div className="topbar">
          <span>{t("Layout.seguimiento_de_heridas_postamputacion")}</span>
        </div>
        <main className="content" id="main-content" tabIndex={-1}>
          {error && <Notice kind="error">{error}</Notice>}
          <Outlet />
        </main>
        <footer className="app-footer">
          {t(
            "Layout.apoyo_a_la_priorizacion_sin_diagnostico_automatico_revision_",
          )}
          <NavLink to="/privacy">{t("Layout.aviso_de_privacidad")}</NavLink>
        </footer>
      </div>
    </div>
  );
}
