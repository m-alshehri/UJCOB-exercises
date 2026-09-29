// Browser scripts generated from the JSON sources in content/. Edit the JSON,
// then run `pnpm build` (or this script) to regenerate the committed files.
import { readFile, writeFile } from "node:fs/promises";

const header = (source) => `// Generated from ${source} by scripts/generate-content.js. Do not edit.\n`;

// Coding-lab exercises are arrays of fields that also carry id/legacyIndex
// properties; in JSON they are stored as { id, legacyIndex, fields }.
export async function labContentSource() {
  const labs = JSON.parse(await readFile("content/labs.json", "utf8"));
  const item = (q) =>
    q.fields
      ? `Object.assign(${JSON.stringify(q.fields)}, ${JSON.stringify({ id: q.id, legacyIndex: q.legacyIndex })})`
      : JSON.stringify(q);
  return (
    header("content/labs.json") +
    "// Exercise IDs travel with their definitions. Never change an existing ID.\n" +
    "window.LAB_CONTENT = {\n" +
    Object.entries(labs)
      .map(
        ([lab, list]) =>
          `  ${JSON.stringify(lab)}: [\n${list.map((q) => "    " + item(q) + ",\n").join("")}  ],\n`,
      )
      .join("") +
    "};\n"
  );
}

export async function arabicSource() {
  const dictionary = await readFile("content/i18n-ar.json", "utf8");
  return header("content/i18n-ar.json") + "window.I18N_AR = " + dictionary.trimEnd() + ";\n";
}

export const generated = {
  "js/lab-content.js": labContentSource,
  "js/i18n-ar.js": arabicSource,
};

export async function writeGenerated() {
  for (const [path, source] of Object.entries(generated))
    await writeFile(path, await source());
}

if (import.meta.url === `file://${process.argv[1]}`) await writeGenerated();
