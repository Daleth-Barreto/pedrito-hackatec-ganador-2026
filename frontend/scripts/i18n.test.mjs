import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

test("automatic catalogs change text, retain Spanish and never claim review", () => {
  const { resolveMessage, isReleased, isMachinePreview, normalizeLocale } =
    loadCatalog();
  for (const locale of ["nhe", "zap-machine"]) {
    assert.equal(isReleased(locale), false);
    assert.equal(isMachinePreview(locale), true);
    const translated = resolveMessage(locale, "LoginPage.crear_cuenta");
    assert.ok(translated.includes(" / Crear cuenta"));
    assert.notEqual(translated, "Crear cuenta");
    assert.equal(
      resolveMessage(locale, "LoginPage.nombre_ejemplo_com"),
      "nombre@ejemplo.com [español]",
    );
    assert.equal(resolveMessage(locale, "language.section"), "Idioma");
  }
  assert.equal(normalizeLocale("nah-021130"), "nhe");
  assert.equal(normalizeLocale("zap-051362"), "zap-machine");
  assert.equal(normalizeLocale("bad"), "es-MX");
  assert.equal(normalizeLocale("mix-051601"), "es-MX");
});

test("changing the source invalidates automatic translations", () => {
  const { catalogs, isMachinePreview, resolveMessage } = loadCatalog();
  const old = catalogs.nhe.meta.sourceRevision;
  try {
    catalogs.nhe.meta.sourceRevision = "obsolete";
    assert.equal(isMachinePreview("nhe"), false);
    assert.equal(
      resolveMessage("nhe", "LoginPage.crear_cuenta"),
      "Crear cuenta",
    );
  } finally {
    catalogs.nhe.meta.sourceRevision = old;
  }
});

function loadCatalog() {
  const filename = new URL("../src/i18n/catalog.ts", import.meta.url);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: createRequire(filename) });
  return exports;
}

test("pending variants always fall back to Spanish", () => {
  const { resolveMessage, isReleased } = loadCatalog();
  for (const locale of ["mix-051601"]) {
    assert.equal(isReleased(locale), false);
    assert.equal(resolveMessage(locale, "language.section"), "Idioma");
    assert.equal(
      resolveMessage(locale, "records.count", { count: 3 }),
      "Registros: 3",
    );
  }
});
test("a filled fragment cannot publish an unreviewed catalog", () => {
  const { catalogs, resolveMessage } = loadCatalog();
  catalogs["mix-051601"].messages["language.section"] =
    "TEST ONLY — NOT A TRANSLATION";
  assert.equal(resolveMessage("mix-051601", "language.section"), "Idioma");
  catalogs["mix-051601"].messages["language.section"] = null;
});
test("missing keys and interpolation parameters are detected", () => {
  const { resolveMessage } = loadCatalog();
  assert.throws(
    () => resolveMessage("es-MX", "missing.key"),
    /Missing translation key/,
  );
  assert.throws(
    () => resolveMessage("es-MX", "records.count"),
    /Missing interpolation/,
  );
});
test("literal patient input cannot become markup during interpolation", () => {
  const { resolveMessage } = loadCatalog();
  assert.equal(
    resolveMessage("es-MX", "privacy.receipt", { id: "<script>test</script>" }),
    "Folio: <script>test</script>",
  );
});
