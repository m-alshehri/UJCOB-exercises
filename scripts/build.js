import { mkdir, cp, readdir, rm, readFile } from "node:fs/promises";
import vm from "node:vm";
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const item of await readdir("."))
  if (
    item.endsWith(".html") ||
    [
      "supabase-client.js",
      "question-banks.js",
      "js",
      "styles",
      "workers",
      "assets",
      "courses",
    ].includes(item)
  )
    await cp(item, "dist/" + item, { recursive: true });
for (const dir of ["js", "workers"])
  for (const file of await readdir(dir)) {
    if (file.endsWith(".js"))
      new vm.Script(await readFile(dir + "/" + file, "utf8"), {
        filename: dir + "/" + file,
      });
  }
console.log("Static site built; browser scripts passed syntax validation.");
