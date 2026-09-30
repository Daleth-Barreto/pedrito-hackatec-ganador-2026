import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createHash } from "node:crypto";

const directory = "src/i18n/locales";
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"));
const source = read("es-MX.json");
const keys = Object.keys(source.messages);
const issues = [];
const sourceRevision = `sha256:${createHash("sha256").update(JSON.stringify(source.messages)).digest("hex")}`;
if (source.meta.sourceRevision !== sourceRevision)
  issues.push(
    "es-MX: source changed; update sourceRevision and invalidate affected reviews",
  );
const placeholders = (text) =>
  [...text.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");
for (const name of fs
  .readdirSync(directory)
  .filter((name) => name.endsWith(".json"))) {
  const catalog = read(name);
  let pending = 0;
  for (const key of keys) {
    if (!(key in catalog.messages)) {
      issues.push(`${name}: missing ${key}`);
      continue;
    }
    const value = catalog.messages[key];
    if (value === null) {
      pending++;
      if (!["pending", "machine"].includes(catalog.meta.status))
        issues.push(`${name}: unapproved gap ${key}`);
    } else if (typeof value !== "string" || !value.trim())
      issues.push(`${name}: empty ${key}`);
    else if (placeholders(value) !== placeholders(source.messages[key]))
      issues.push(`${name}: interpolation mismatch ${key}`);
  }
  for (const key of Object.keys(catalog.messages))
    if (!keys.includes(key)) issues.push(`${name}: obsolete ${key}`);
  if (
    catalog.meta.status === "machine" &&
    (!catalog.meta.provider ||
      !catalog.meta.generatedAt ||
      !catalog.meta.languageTag ||
      catalog.meta.sourceRevision !== source.meta.sourceRevision ||
      catalog.meta.reviewers.length ||
      catalog.meta.reviewedAt)
  )
    issues.push(`${name}: invalid machine translation provenance`);
  if (
    catalog.meta.status === "reviewed" &&
    (!catalog.meta.communityConfirmed ||
      catalog.meta.reviewers.length < 2 ||
      !catalog.meta.reviewedAt ||
      !catalog.meta.languageTag ||
      catalog.meta.sourceRevision !== source.meta.sourceRevision)
  )
    issues.push(`${name}: missing release evidence`);
  console.log(
    `${name}: ${keys.length - pending}/${keys.length} textos; estado ${catalog.meta.status}`,
  );
}
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : [path.join(dir, entry.name)],
    );
}
for (const file of walk("src").filter((file) => /\.tsx?$/.test(file))) {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(sourceFile) === "t" &&
      ts.isStringLiteral(node.arguments[0]) &&
      !keys.includes(node.arguments[0].text)
    )
      issues.push(`${file}: unknown key ${node.arguments[0].text}`);
    if (ts.isJsxText(node) && /[a-záéíóúñ]/i.test(node.text))
      issues.push(
        `${file}: untranslated JSX text ${node.text.trim().slice(0, 60)}`,
      );
    if (
      ts.isJsxAttribute(node) &&
      /^(alt|title|placeholder|aria-label|data-label|eyebrow|text|label|success)$/.test(
        node.name.getText(sourceFile),
      ) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    )
      issues.push(
        `${file}: untranslated attribute ${node.name.getText(sourceFile)}`,
      );
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}
const server = JSON.parse(
  fs.readFileSync("src/i18n/server-sources.json", "utf8"),
);
for (const [text, key] of Object.entries(server))
  if (source.messages[key] !== text)
    issues.push(`server source mismatch: ${key}`);
if (issues.length) {
  console.error(issues.join("\n"));
  process.exitCode = 1;
}
