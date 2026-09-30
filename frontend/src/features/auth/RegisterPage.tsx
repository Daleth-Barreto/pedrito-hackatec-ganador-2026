import { Brand } from "../../components/Brand";
import { t, useLocale } from "../../i18n/runtime";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, errorMessage } from "../../services/api";
import { Notice } from "../../components/UI";
import { useAuth } from "./AuthContext";
export function RegisterPage() {
  useLocale();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  // Al registrarse, el paciente entra directo al recorrido de su protesis.
  if (user && !busy) return <Navigate to="/account" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("repeat")) {
      setError(t("RegisterPage.las_contrasenas_no_coinciden"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
      return;
    }
    try {
      await login(String(data.get("email")), String(data.get("password")));
      // `busy` sigue activo para que esta pantalla no redirija a /account.
      navigate("/prosthesis", { replace: true, state: { welcome: true } });
    } catch {
      // Si el inicio automatico falla, la cuenta ya existe: se pide iniciar sesion.
      setDone(true);
      setBusy(false);
    }
  }
  return (
    <main className="legal-page">
      <Link to="/" className="public-brand">
        <Brand />
      </Link>
      <Link to="/login" className="text-link">
        {t("RegisterPage.volver_al_acceso")}
      </Link>
      <h1>{t("RegisterPage.crea_tu_cuenta")}</h1>
      <p>
        {t(
          "RegisterPage.cuenta_de_paciente_para_demostracion_usa_datos_ficticios_no_",
        )}
      </p>
      <p>
        {t("RegisterPage.consulta_el")}
        <Link to="/privacy">{t("RegisterPage.aviso_de_privacidad")}</Link>
        {t(
          "RegisterPage.las_fotografias_y_respuestas_requieren_un_consentimiento_adi",
        )}
      </p>
      {error && <Notice kind="error">{error}</Notice>}
      {done ? (
        <Notice>
          {t("RegisterPage.cuenta_creada")}
          <Link to="/login">{t("RegisterPage.inicia_sesion")}</Link>
          {t("RegisterPage.para_continuar")}
        </Notice>
      ) : (
        <form className="account-form panel panel-body" onSubmit={submit}>
          <label>
            {t("RegisterPage.nombre")}
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            {t("RegisterPage.correo")}
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            {t("RegisterPage.contrasena_al_menos_12_caracteres")}
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={200}
            />
          </label>
          <label>
            {t("RegisterPage.repite_la_contrasena")}
            <input
              name="repeat"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={200}
            />
          </label>
          <button className="button primary" disabled={busy}>
            {busy
              ? t("RegisterPage.creando")
              : t("RegisterPage.crear_cuenta_de_demostracion")}
          </button>
        </form>
      )}
    </main>
  );
}
