importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");
onmessage = async ({ data }) => {
  try {
    const py = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
    });
    py.globals.set("USER_CODE", data.code);
    py.globals.set("TESTS_JSON", JSON.stringify(data.tests));
    await py.runPythonAsync(`
import io,contextlib,json,traceback
out=io.StringIO()
try:
 ns={}
 with contextlib.redirect_stdout(out): exec(USER_CODE,ns)
 printed=out.getvalue().strip(); rr=[]
 for t in json.loads(TESTS_JSON):
  got,expected=(printed,t[1]) if t[0]=='out' else (eval(t[1],ns),t[2])
  # JSON normalizes dictionary keys and Python tuples for consistent comparison.
  normalized=json.loads(json.dumps(got))
  ok=(normalized==expected) or (isinstance(got,(int,float)) and isinstance(expected,(int,float)) and abs(got-expected)<1e-9)
  rr.append([ok,repr(got),repr(expected)])
 RESULT_JSON=json.dumps({'ok':all(r[0] for r in rr),'r':rr,'printed':printed})
except Exception: RESULT_JSON=json.dumps({'ok':False,'error':traceback.format_exc()})
`);
    postMessage(JSON.parse(String(py.globals.get("RESULT_JSON"))));
  } catch (e) {
    postMessage({ error: String(e) });
  }
};
