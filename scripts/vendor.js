// Third-party browser files served from the site itself (/vendor/...) instead
// of a CDN. Versions come from package.json; the build copies these into dist
// and the dev server serves them straight from node_modules.
export const vendor = {
  "vendor/supabase/supabase.js":
    "node_modules/@supabase/supabase-js/dist/umd/supabase.js",
  "vendor/chart.js/chart.umd.js": "node_modules/chart.js/dist/chart.umd.js",
  "vendor/sql.js/sql-wasm.js": "node_modules/sql.js/dist/sql-wasm.js",
  "vendor/sql.js/sql-wasm.wasm": "node_modules/sql.js/dist/sql-wasm.wasm",
  "vendor/pyodide/pyodide.js": "node_modules/pyodide/pyodide.js",
  "vendor/pyodide/pyodide.asm.js": "node_modules/pyodide/pyodide.asm.js",
  "vendor/pyodide/pyodide.asm.wasm": "node_modules/pyodide/pyodide.asm.wasm",
  "vendor/pyodide/python_stdlib.zip": "node_modules/pyodide/python_stdlib.zip",
  "vendor/pyodide/pyodide-lock.json": "node_modules/pyodide/pyodide-lock.json",
};
