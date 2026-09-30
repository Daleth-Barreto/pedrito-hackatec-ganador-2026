import { test, expect } from "@playwright/test";

test("cuenta, consentimiento, ARCO y cambio de contraseña", async ({
  page,
}, info) => {
  const email = `privacy-${info.project.name}-${Date.now()}@demo.local`;
  const password = "synthetic-password-2026";
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/register");
  await page.getByLabel("Nombre", { exact: true }).fill("Persona de prueba");
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña (al menos 12 caracteres)").fill(password);
  await page.getByLabel("Repite la contraseña").fill(password);
  await page
    .getByRole("button", { name: "Crear cuenta" })
    .click();
  await expect(
    page.getByText("Cuenta creada.", { exact: false }),
  ).toBeVisible();
  async function login(secret: string) {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(secret);
    await page
      .getByRole("button", { name: "Iniciar sesión", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Mi cuenta y privacidad" }),
    ).toBeVisible();
  }
  // El registro inicia sesión automáticamente y abre el recorrido de la prótesis.
  await expect(page).toHaveURL(/\/prosthesis$/);
  await expect(
    page.getByRole("link", { name: "Mi cuenta y privacidad" }),
  ).toBeVisible();
  await page.goto("/records/new");
  await expect(
    page.getByRole("heading", { name: "Consentimiento informado" }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.getByLabel("Elegir fotografía")).toHaveCount(0);
  await page.screenshot({
    path: `test-results/${info.project.name}-consent-v2.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "No acepto; volver a mi cuenta" })
    .click();
  await expect(page.getByText(/No autorizado · Versión 2/)).toBeVisible();
  const arco = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "Solicitar derechos ARCO",
        exact: true,
      }),
    });
  await arco.getByLabel("Derecho que deseas ejercer").selectOption("access");
  await arco
    .getByLabel("Datos y petición")
    .fill("Solicito consultar los datos de mi cuenta de demostración.");
  await arco.getByLabel("Contraseña actual").fill(password);
  await arco.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(
    page.getByRole("heading", { name: "Acceso · Recibida" }),
  ).toBeVisible();
  const deletion = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "Solicitar eliminación de cuenta",
        exact: true,
      }),
    });
  await deletion
    .getByLabel("Para confirmar, escribe ELIMINAR MI CUENTA")
    .fill("ELIMINAR MI CUENTA");
  await deletion.getByLabel("Contraseña actual").fill(password);
  await deletion
    .getByRole("button", { name: "Confirmar solicitud de eliminación" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Eliminación de cuenta · Recibida" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cancelar eliminación", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Eliminación de cuenta · Cancelada" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${info.project.name}-account.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  const change = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "Cambiar contraseña",
        exact: true,
      }),
    });
  await change
    .getByLabel("Nueva contraseña", { exact: true })
    .fill(password + "-new");
  await change.getByLabel("Repite la nueva contraseña").fill(password + "-new");
  await change.getByLabel("Contraseña actual").fill(password);
  await change
    .getByRole("button", { name: "Cambiar y cerrar sesiones" })
    .click();
  await expect(page).toHaveURL(/login/);
  await login(password + "-new");
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { name: "Responsable del tratamiento" }),
  ).toBeVisible();
  await expect(
    page.getByText("Pendiente de configuración y revisión", { exact: true }),
  ).toHaveCount(3);
  expect(errors).toEqual([]);
});
