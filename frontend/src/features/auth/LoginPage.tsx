import { Brand } from "../../components/Brand";
import { t, useLocale } from "../../i18n/runtime";
import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  LockKeyhole,
  ClipboardCheck,
  ImagePlus,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { Notice } from "../../components/UI";
import { errorMessage } from "../../services/api";
export function LoginPage() {
  useLocale();
  const { user, login, expired } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-intro">
        <Link to="/" className="brand" aria-label={t("Public.ir_al_inicio")}>
          <Brand prominent />
        </Link>
        <div className="login-story">
          <span className="overline">
            {t("LoginPage.cerca_entre_cada_consulta")}
          </span>
          <h1>
            {t("LoginPage.un_registro_hoy")}
            <br />
            <span>{t("LoginPage.mas_informacion_para_cuidarte")}</span>
          </h1>
          <p>
            {t(
              "LoginPage.comparte_como_evoluciona_tu_herida_y_reune_la_informacion_qu",
            )}
          </p>
          <div className="story-steps">
            <div>
              <ImagePlus />
              <span>
                {t("LoginPage.registra_una_fotografia_y_tus_cambios")}
              </span>
            </div>
            <div>
              <ClipboardCheck />
              <span>
                {t("LoginPage.el_equipo_de_salud_revisa_tu_seguimiento")}
              </span>
            </div>
            <div>
              <LockKeyhole />
              <span>{t("LoginPage.acceso_restringido_a_tus_registros")}</span>
            </div>
          </div>
        </div>
        <p className="login-disclaimer">
          {t(
            "LoginPage.herramienta_de_apoyo_al_seguimiento_no_realiza_diagnosticos_",
          )}
        </p>
      </section>
      <section className="login-access">
        <div className="login-form">
          <nav
            className="login-public-links"
            aria-label={t("LoginPage.acceso_y_privacidad")}
          >
            <Link to="/register">{t("LoginPage.crear_cuenta")}</Link>
            <Link to="/privacy">{t("LoginPage.privacidad")}</Link>
          </nav>
          <h2>{t("LoginPage.bienvenido_a_tu_espacio")}</h2>
          <p>
            {t(
              "LoginPage.inicia_sesion_o_crea_una_cuenta_de_paciente_para_continuar",
            )}
          </p>
          {expired && (
            <Notice>
              {t(
                "LoginPage.tu_sesion_vencio_inicia_sesion_de_nuevo_los_datos_que_no_env",
              )}
            </Notice>
          )}
          {error && <Notice kind="error">{error}</Notice>}
          <form onSubmit={submit}>
            <label>
              {t("LoginPage.correo_electronico")}
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("LoginPage.nombre_ejemplo_com")}
              />
            </label>
            <label>
              {t("LoginPage.contrasena")}
              <input
                type="password"
                autoComplete="current-password"
                required
                maxLength={200}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="button primary full" disabled={busy}>
              {busy ? t("LoginPage.ingresando") : t("LoginPage.iniciar_sesion")}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
        <small className="access-footer">
          {t(
            "LoginPage.la_valoracion_final_siempre_corresponde_al_personal_de_salud",
          )}
        </small>
      </section>
    </main>
  );
}
