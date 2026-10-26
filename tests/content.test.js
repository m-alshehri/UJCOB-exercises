import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { generated } from "../scripts/generate-content.js";

// Evaluate a browser script and return a window global, keeping array
// properties (id, legacyIndex) so they are part of the comparison.
function load(source, name) {
  const context = { window: {} };
  context.window = context;
  vm.runInNewContext(source, context);
  return JSON.stringify(context[name], (key, value) =>
    Array.isArray(value) && "id" in value
      ? { fields: [...value], id: value.id, legacyIndex: value.legacyIndex }
      : value,
  );
}

for (const [path, name] of [
  ["js/lab-content.js", "LAB_CONTENT"],
  ["js/i18n-ar.js", "I18N_AR"],
])
  test(`${path} matches its content/ source (run pnpm build)`, async () =>
    assert.equal(
      load(await readFile(path, "utf8"), name),
      load(await generated[path](), name),
    ));

test("exercise IDs are unique within each lab", async () => {
  const labs = JSON.parse(await readFile("content/labs.json", "utf8"));
  for (const [lab, list] of Object.entries(labs)) {
    const ids = list.map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length, lab);
  }
});
