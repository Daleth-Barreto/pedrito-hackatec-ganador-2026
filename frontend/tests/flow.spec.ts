import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const password = process.env.DEMO_PASSWORD;
test.skip(
  !password,
  "Configura DEMO_PASSWORD y ejecuta el seed antes de estas pruebas.",
);

test("paciente envía, profesional revisa y paciente elimina", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  async function login(email: string) {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(email);
    await page.getByLabel("Contraseña").fill(password!);
    await page
      .getByRole("button", { name: new RegExp("Iniciar sesión"), exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: new RegExp("Cerrar sesión") }),
    ).toBeVisible();
  }
  await login("paciente@demo.local");
  await page
    .getByRole("combobox", { name: new RegExp("Idioma"), exact: true })
    .selectOption(testInfo.project.name === "mobile" ? "zap-machine" : "nhe");
  await expect(
    page.getByText(/Traducción automática sin revisión/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: new RegExp("Cada cambio cuenta") }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-patient.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: new RegExp("Crear nuevo registro") })
    .click();
  await expect(page.getByLabel("Elegir fotografía")).toHaveCount(0);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: new RegExp("Aceptar y continuar") })
    .click();
  await page.getByLabel("Elegir fotografía").setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.getByRole("alert")).toContainText("JPEG");
  await page.getByLabel("Elegir fotografía").setInputFiles({
    name: "synthetic.png",
    mimeType: "image/png",
    buffer: readFileSync("tests/fixtures/synthetic.png"),
  });
  await page.getByLabel("Dolor actual").selectOption("3");
  for (const question of [
    "¿El dolor aumentó desde tu último registro?",
    "¿Has observado secreción?",
    "¿Has notado mal olor?",
    "¿Has observado que la herida se abrió?",
  ]) {
    await page
      .getByRole("group", {
        name: new RegExp(question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        exact: true,
      })
      .getByLabel(/(?:^| \/ )No(?: \[español\])?$/, { exact: true })
      .check();
  }
  await page
    .getByRole("group", {
      name: new RegExp("¿Has tenido fiebre\\?"),
      exact: true,
    })
    .getByLabel(/(?:^| \/ )Sí(?: \[español\])?$/, { exact: true })
    .check();
  await page
    .getByLabel("¿Qué cambió desde el último registro?")
    .selectOption("none");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-form.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: new RegExp("Revisar antes de enviar") })
    .click();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: new RegExp("Confirmar y enviar") })
    .click();
  await expect(
    page.getByRole("heading", {
      name: new RegExp("Tu registro de seguimiento"),
    }),
  ).toBeVisible();
  const recordPath = new URL(page.url()).pathname;
  await expect(
    page.getByText(/(?:^| \/ )Alerta(?: \[español\])?$/, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Análisis visual/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Autorizar análisis visual/ }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /He leído la explicación/ }).check();
  await page.getByRole("button", { name: /Autorizar análisis visual/ }).click();
  await expect(page.getByText(/Autorización aceptada/)).toBeVisible();
  await expect(
    page.getByAltText("Fotografía enviada para revisión de la herida"),
  ).toBeVisible();
  await page.getByRole("button", { name: new RegExp("Cerrar sesión") }).click();
  await login("salud@demo.local");
  await expect(
    page.getByRole("heading", { name: new RegExp("Panel de revisión") }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: new RegExp("Prioridad"), exact: true })
    .selectOption("alerta");
  await expect(page.locator(`a[href="${recordPath}"]`).first()).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-dashboard.png`,
    fullPage: true,
  });
  await page.locator(`a[href="${recordPath}"]`).first().click();
  await expect(
    page.getByRole("button", { name: /Analizar imagen/ }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: /Comprendo que los contornos/ })
    .check();
  await page.getByRole("button", { name: /Analizar imagen/ }).click();
  await expect(
    page.getByRole("heading", { name: /Resultado del análisis visual/ }),
  ).toBeVisible({ timeout: 45000 });
  await expect(page.locator(".suggestion-panel")).toContainText("Alerta");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-visual-analysis.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Resultado del análisis visual/ }),
  ).toBeVisible();

  await page
    .getByRole("combobox", {
      name: new RegExp("Valoración del profesional"),
      exact: true,
    })
    .selectOption("follow_up");
  await page
    .getByLabel("Nota profesional")
    .fill(
      "Revisión de demostración completada. Registro sintético para comprobar el flujo.",
    );
  await page
    .getByRole("button", { name: new RegExp("Guardar y marcar como revisado") })
    .click();
  await expect(
    page.getByText("Revisión profesional guardada.", { exact: false }),
  ).toBeVisible();
  await expect(
    page
      .locator("tbody tr")
      .filter({
        has: page.locator(`a[href="${recordPath}"]`),
      })
      .getByText(/(?:^| \/ )Revisado(?: \[español\])?$/, { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-review.png`,
    fullPage: true,
  });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  await page.getByRole("button", { name: new RegExp("Cerrar sesión") }).click();
  await login("paciente@demo.local");
  await page.goto(recordPath);
  await expect(
    page.getByText(/(?:^| \/ )Requiere seguimiento(?: \[español\])?$/, {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: new RegExp("Eliminar registro"), exact: true })
    .click();
  await page
    .getByRole("button", { name: new RegExp("Confirmar eliminación") })
    .click();
  await expect(
    page.getByRole("heading", { name: new RegExp("Tu historial") }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
