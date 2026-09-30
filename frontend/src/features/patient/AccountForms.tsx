import { t, useLocale } from "../../i18n/runtime";
import { useState, type FormEvent, type ReactNode } from "react";
import { api, errorMessage } from "../../services/api";
import { Notice } from "../../components/UI";
import type { User } from "../../types";
import { useAuth } from "../auth/AuthContext";
export function SecureForm({
  title,
  children,
  action,
  label,
  onDone,
  success,
}: {
  title: string;
  children?: ReactNode;
  action: (data: FormData) => Promise<unknown>;
  label: string;
  onDone?: () => void;
  success: string;
}) {
  useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setDone(false);
    setError("");
    try {
      await action(new FormData(form));
      form.reset();
      setDone(true);
      onDone?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel panel-body">
      <h2>{title}</h2>
      {error && <Notice kind="error">{error}</Notice>}
      {done && <Notice>{success}</Notice>}
      <form className="account-form" onSubmit={submit}>
        <fieldset disabled={busy}>
          {children}
          <label>
            {t("AccountForms.contrasena_actual")}
            <input
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
            />
          </label>
        </fieldset>
        <button className="button primary" disabled={busy}>
          {busy ? t("AccountForms.guardando") : label}
        </button>
      </form>
    </section>
  );
}
export const postForm = (path: string, values: Record<string, unknown>) =>
  api(path, { method: "POST", body: JSON.stringify(values) });
export function ProfileForms() {
  useLocale();
  const { user, updateUser } = useAuth();
  return (
    <>
      <SecureForm
        title={t("AccountForms.datos_de_tu_cuenta")}
        label={t("AccountForms.guardar_nombre")}
        success={t("AccountForms.nombre_actualizado")}
        action={async (data) => {
          const result = await postForm("/account/profile", {
            name: data.get("name"),
            current_password: data.get("current_password"),
          });
          updateUser(result as User);
        }}
      >
        <p>
          {t("AccountForms.correo_de_acceso")}
          <strong>{user?.email}</strong>
          {t(
            "AccountForms.para_solicitar_su_rectificacion_usa_el_formulario_arco_no_ca",
          )}
        </p>
        <label>
          {t("AccountForms.nombre")}
          <input
            name="name"
            defaultValue={user?.name}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
        </label>
      </SecureForm>
      <SecureForm
        title={t("AccountForms.cambiar_contrasena")}
        label={t("AccountForms.cambiar_y_cerrar_sesiones")}
        success={t("AccountForms.contrasena_cambiada")}
        action={async (data) => {
          if (data.get("new_password") !== data.get("repeat"))
            throw new Error(t("AccountForms.las_contrasenas_no_coinciden"));
          await postForm("/account/password", {
            current_password: data.get("current_password"),
            new_password: data.get("new_password"),
          });
          window.dispatchEvent(new Event("session-expired"));
        }}
      >
        <p>
          {t(
            "AccountForms.usa_al_menos_12_caracteres_al_cambiarla_se_cerraran_todas_la",
          )}
        </p>
        <label>
          {t("AccountForms.nueva_contrasena")}
          <input
            name="new_password"
            type="password"
            required
            minLength={12}
            maxLength={200}
            autoComplete="new-password"
          />
        </label>
        <label>
          {t("AccountForms.repite_la_nueva_contrasena")}
          <input
            name="repeat"
            type="password"
            required
            minLength={12}
            maxLength={200}
            autoComplete="new-password"
          />
        </label>
      </SecureForm>
    </>
  );
}
