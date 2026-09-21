import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
const sandbox = {
  window: {},
  URL,
  location: { origin: "https://tamareen.online" },
};
vm.runInNewContext(await readFile("js/shared.js", "utf8"), sandbox);
const shared = sandbox.window.Tamareen;
test("login return paths cannot leave the site", () => {
  for (const path of [
    "https://evil.example",
    "//evil.example",
    "javascript:alert(1)",
    "/\\evil.example",
  ])
    assert.equal(shared.internalPath(path), "/dashboard.html");
  assert.equal(
    shared.internalPath("/python-lab.html?x=1"),
    "/python-lab.html?x=1",
  );
});
test("HTML output is escaped", () =>
  assert.equal(
    shared.escape('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  ));
test("pagination fetches more than the server page size", async () => {
  const data = await shared.all(() => ({
    range: async (from, to) => ({
      data: Array.from(
        { length: Math.max(0, Math.min(to + 1, 1234) - from) },
        (_, i) => from + i,
      ),
      error: null,
    }),
  }));
  assert.equal(data.length, 1234);
  assert.equal(data.at(-1), 1233);
});
test("database errors are thrown rather than treated as success", async () =>
  assert.rejects(
    shared.checked(
      Promise.resolve({ data: null, error: new Error("Save failed") }),
    ),
    /Save failed/,
  ));
