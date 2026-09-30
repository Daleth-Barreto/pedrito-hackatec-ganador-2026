import { t, serverText, dateLocale } from "../i18n/runtime";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: "include",
      headers:
        options.body instanceof FormData
          ? { "X-Requested-With": "Seguimiento", ...options.headers }
          : {
              "Content-Type": "application/json",
              "X-Requested-With": "Seguimiento",
              ...options.headers,
            },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      0,
      "network_error",
      t("api.no_pudimos_conectar_con_el_servicio_comprueba_tu_conexion_e_"),
    );
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const code = data?.error?.code ?? "request_error";
    if (response.status === 401 && code !== "invalid_credentials")
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(
      response.status,
      code,
      (data?.error?.message ? serverText(data.error.message) : undefined) ??
        t("api.no_pudimos_completar_la_operacion"),
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : t("api.ocurrio_un_error_inesperado");
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat(dateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value));
