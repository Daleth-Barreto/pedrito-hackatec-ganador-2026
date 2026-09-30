import { test, expect } from "@playwright/test";

test("paciente nuevo: video, generación, vista previa, pedido y seguimiento", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const password = "synthetic-password-2026";
  await page.goto("/register");
  await page.getByLabel("Nombre", { exact: true }).fill("Paciente nuevo");
  await page
    .getByLabel("Correo", { exact: true })
    .fill(`protesis-${info.project.name}-${Date.now()}@demo.local`);
  await page.getByLabel("Contraseña (al menos 12 caracteres)").fill(password);
  await page.getByLabel("Repite la contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/prosthesis$/);
  await expect(
    page.getByText("Cuenta creada.", { exact: false }),
  ).toBeVisible();

  const next = page.locator(".demo-foot .button.primary");
  const skip = page.getByRole("button", { name: "Saltar al final" });
  await page.getByRole("button", { name: "Usar el video de ejemplo" }).click();
  await expect(next).toBeEnabled({ timeout: 15000 });
  await next.click();
  for (let i = 0; i < 2; i++) {
    await skip.click();
    await next.click();
  }
  await page.getByRole("tab", { name: /^2\./ }).click();
  await page.getByRole("tab", { name: /^3\./ }).click();
  await expect(next).toBeEnabled({ timeout: 60000 });
  await next.click();

  const piece = page.getByRole("button", { name: "Siguiente pieza" });
  while (await piece.isEnabled()) await piece.click();
  await page.getByRole("button", { name: "Ver mi prótesis" }).click();

  await expect(
    page.getByRole("heading", { name: "Así se verá tu futura prótesis" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ordenar mi prótesis" }).click();
  await page.getByLabel("Nombre completo").fill("Paciente nuevo");
  await page.getByLabel("Calle y número").fill("Av. Morelos 12");
  await page.getByLabel("Ciudad").fill("Zacatepec");
  await page.getByLabel("Código postal").fill("62780");
  await page.getByLabel("Teléfono").fill("7771234567");
  await page.getByRole("button", { name: "Confirmar pedido" }).click();

  await expect(
    page.getByRole("heading", { name: "¡Tu prótesis está en camino!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Activar mi mes gratis" }).click();
  await expect(
    page.getByText("Seguimiento activado", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ir a mi seguimiento" }).click();
  await expect(
    page.getByRole("link", { name: "Mi prótesis", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
