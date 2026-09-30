import { test, expect } from "@playwright/test";

// Geometry fixture for UI verification only; not a model prediction or medical example.
test("contornos alineados, comparación y recuperación de un error", async ({
  page,
}, testInfo) => {
  const record = {
    id: "visual-fixture",
    patient_id: "fixture-patient",
    patient_name: "Imagen sintética de prueba",
    is_demo: true,
    created_at: "2026-09-29T12:00:00Z",
    photo_date: "2026-09-29",
    priority: "alerta",
    status: "pending",
    automatic_status: "unavailable",
    questionnaire: {
      photo_date: "2026-09-29",
      pain: 0,
      increased_pain: false,
      fever: true,
      discharge: false,
      odor: false,
      wound_opening: false,
      changes: "none",
      changes_description: "",
    },
    image_metadata: {
      width: 900,
      height: 680,
      quality_issues: [],
      quality_scope: "",
    },
    inference: {
      mode: "unavailable",
      status: "unavailable",
      label: "",
      visual_observations: [],
      limitations: [],
    },
    reasons: [],
    rules_version: "prototype-v1",
    expires_at: "2026-10-29T12:00:00Z",
    review: null,
    patient_message: "",
    report: { limitations: [], generator: "" },
  };
  const result = {
    status: "experimental",
    model_id: "fixture-only",
    affects_priority: false,
    validated_for_postamputation: false,
    threshold: 0.35,
    image_width: 900,
    image_height: 680,
    regions: [
      {
        technical_score: 0.8,
        area_px: 40000,
        image_area_percent: 6.54,
        bbox_xyxy: [350, 240, 550, 440],
        polygon_xy: [
          [350, 240],
          [550, 240],
          [550, 440],
          [350, 440],
        ],
        position_horizontal: "centro",
        position_vertical: "media",
      },
    ],
    message: "",
    limitations: [],
    analyzed_at: "2026-09-29T12:00:00Z",
  };
  let attempts = 0;
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/image"))
      return route.fulfill({
        path: "tests/fixtures/synthetic.png",
        contentType: "image/png",
      });
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          id: "staff-fixture",
          email: "staff@example.test",
          name: "Equipo de prueba",
          role: "clinician",
          is_demo: true,
        },
      });
    if (path.endsWith("/segmentation")) {
      if (route.request().method() === "GET")
        return route.fulfill({
          json: {
            enabled: true,
            consent: {
              accepted: true,
              version: "visual-1",
              decided_at: "2026-09-29T12:00:00Z",
            },
            result: null,
          },
        });
      attempts++;
      if (attempts === 1)
        return route.fulfill({
          status: 503,
          json: {
            error: {
              code: "segmentation_unavailable",
              message: "El análisis de imagen no está disponible.",
            },
          },
        });
      return route.fulfill({ json: result });
    }
    if (path.endsWith("/visual-fixture"))
      return route.fulfill({ json: record });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/records/visual-fixture");
  await page
    .getByRole("checkbox", { name: /Comprendo que los contornos/ })
    .check();
  await page
    .getByRole("button", { name: "Analizar imagen", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("no está disponible");
  await page
    .getByRole("button", { name: "Analizar imagen", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Región 1", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".analysis-overlay polygon")).toHaveCount(2);
  const image = await page.locator(".analysis-image img").boundingBox();
  const overlay = await page.locator(".analysis-overlay").boundingBox();
  expect(overlay).toEqual(image);
  await page.getByRole("button", { name: "Ver fotografía original" }).click();
  await expect(page.locator(".analysis-overlay")).toHaveCount(0);
  await page.getByRole("button", { name: "Mostrar contornos" }).click();
  await expect(page.locator(".analysis-overlay")).toBeVisible();
  await expect(page.locator(".suggestion-panel")).toContainText("Alerta");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
  await page
    .locator(".photo-panel")
    .screenshot({
      path: `test-results/${testInfo.project.name}-contours-fixture.png`,
    });
});
