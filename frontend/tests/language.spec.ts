import { test, expect } from "@playwright/test";

test("traducciones automáticas locales cambian acceso, formularios y privacidad", async ({
  page,
}, info) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:5173"))
      external.push(request.url());
  });
  for (const locale of ["nhe", "zap-machine"]) {
    await page.goto("/login");
    await page
      .getByRole("combobox", { name: "Idioma", exact: true })
      .selectOption(locale);
    await expect(
      page.getByText(/Traducción automática sin revisión/),
    ).toBeVisible();
    const create = page.getByRole("link", { name: /Crear cuenta/ });
    await expect(create).not.toHaveText("Crear cuenta");
    await expect(create).toContainText(" / Crear cuenta");
    await page.reload();
    await expect(
      page.getByRole("combobox", { name: "Idioma", exact: true }),
    ).toHaveValue(locale);
    await page.screenshot({
      path: `test-results/${info.project.name}-${locale}-login.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.getByRole("link", { name: /Crear cuenta/ }).click();
    await expect(
      page.getByRole("heading", { name: /Crea tu cuenta/ }),
    ).toContainText(" / ");
    await page
      .getByRole("button", { name: /Crear cuenta/ })
      .click();
    const message = await page
      .getByLabel(/Nombre/)
      .evaluate((e: HTMLInputElement) => e.validationMessage);
    expect(message).toContain("Completa este campo para continuar.");
    expect(message).not.toBe("Completa este campo para continuar.");
    await page.getByRole("link", { name: /aviso de privacidad/ }).click();
    await expect(
      page.getByRole("heading", { name: /Aviso de privacidad/ }),
    ).toContainText(" / ");
    await expect(
      page.getByText(/Traducción automática sin revisión/),
    ).toBeVisible();
  }
  expect(external).toEqual([]);
});

test("preferencia anterior de mixteco vuelve a español sin ofrecer mixteco", async ({page}) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.setItem("seguimiento.locale.v1", "mix-051601"));
  await page.reload();
  const selector = page.getByRole("combobox", {name:"Idioma", exact:true});
  await expect(selector).toHaveValue("es-MX");
  await expect(selector.locator("option")).toHaveCount(3);
  await expect(selector.locator('option[value="mix-051601"]')).toHaveCount(0);
  await expect(page.getByRole("heading", {name:"Bienvenido a tu espacio"})).toBeVisible();
});

test("acceso sin superposiciones en móvil, tableta y escritorio", async ({
  page,
}, info) => {
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/login");
    await expect(
      page.getByText("Prototipo de demostración", { exact: true }),
    ).toHaveCount(0);
    const nav = page.getByRole("navigation", { name: "Acceso y privacidad" });
    await expect(nav).toBeVisible();
    const links = await nav.locator("a").all();
    const a = await links[0].boundingBox(),
      b = await links[1].boundingBox();
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(
      a!.x + a!.width <= b!.x ||
        b!.x + b!.width <= a!.x ||
        a!.y + a!.height <= b!.y ||
        b!.y + b!.height <= a!.y,
    ).toBe(true);
    const heading = await page
      .getByRole("heading", { name: "Bienvenido a tu espacio" })
      .boundingBox();
    expect(Math.max(a!.y + a!.height, b!.y + b!.height)).toBeLessThanOrEqual(
      heading!.y,
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/${info.project.name}-access-${width}.png`,
      fullPage: true,
    });
    await nav.locator("a").evaluateAll((elements) =>
      elements.forEach((element) => {
        element.textContent = `${element.textContent} — texto largo para comprobar el espacio disponible`;
      }),
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
});
