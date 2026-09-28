import { fixture, config } from "./fixture.js";
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { vendor } from "./vendor.js";
// Serve the same response headers as production (vercel.json), including CSP.
const headerRules = JSON.parse(await readFile("vercel.json", "utf8")).headers.map(
  ({ source, headers }) => [new RegExp("^" + source + "$"), headers],
);
const root = resolve("."),
  types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".wasm": "application/wasm",
    ".zip": "application/zip",
  };
http
  .createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (process.env.TAMAREEN_TEST_FIXTURE === "1") {
        if (fixture(req, res, path)) return;
        if (path === "/supabase-client.js") {
          res.setHeader("Content-Type", "text/javascript");
          return res.end(config);
        }
      }
      if (path.startsWith("/api/")) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        req.body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        };
        const name = path.split("/").at(-1);
        if (!["tutor", "instructor-analytics", "classrooms", "learning-admin", "journey"].includes(name)) {
          res.statusCode = 404;
          return res.end();
        }
        return (await import("../api/" + name + ".js")).default(req, res);
      }
      for (const [pattern, headers] of headerRules)
        if (pattern.test(path))
          for (const { key, value } of headers) res.setHeader(key, value);
      if (path === "/" || path.startsWith("/courses/")) path = "/index.html";
      const vendored = vendor[path.slice(1)];
      if (vendored) {
        res.setHeader("Content-Type", types[extname(path)] || "text/plain");
        return res.end(await readFile(vendored));
      }
      const file = resolve(root, "." + path);
      if (
        !file.startsWith(root + "/") ||
        ![".html", ".js", ".css", ".svg"].includes(extname(file))
      ) {
        res.statusCode = 404;
        return res.end();
      }
      const content = await readFile(file);
      res.setHeader("Content-Type", types[extname(file)] || "text/plain");
      res.end(content);
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  })
  .listen(Number(process.env.PORT || 4173), "127.0.0.1", () =>
    console.log(
      "Tamareen preview: http://127.0.0.1:" + (process.env.PORT || 4173),
    ),
  );
