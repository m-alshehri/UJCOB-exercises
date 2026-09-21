const E = LAB_CONTENT["web-lab"];
const SOL = [
  "<!doctype html>\n<html>\n<head><style>body{font-family:Arial;padding:30px}</style></head>\n<body>\n<h1>Welcome to Tamareen</h1>\n</body>\n</html>",
  "<!doctype html>\n<html>\n<head><style>button{padding:10px 16px;border-radius:8px}</style></head>\n<body>\n<button>Start Practice</button>\n</body>\n</html>",
  '<!doctype html>\n<html>\n<body>\n<a href="https://tamareen.online">Tamareen</a>\n</body>\n</html>',
  '<!doctype html>\n<html>\n<body>\n<p id="message">Ready</p>\n<button onclick="changeText()">Change text</button>\n<script>function changeText(){document.getElementById("message").textContent="Changed!"}<\/script>\n</body>\n</html>',
  '<!doctype html>\n<html>\n<head><style>.container{display:grid;grid-template-columns:1fr 1fr}@media(max-width:600px){.container{grid-template-columns:1fr}}</style></head>\n<body><div class="container"><div>One</div><div>Two</div></div></body>\n</html>',
];
let i = 0,
  wrongAttempts = {},
  solved = new Set();
const COURSE = "BCIS 317",
  LAB = "web-lab";
const tracker = new LabProgress(
  COURSE,
  LAB,
  E.map((q) => ({ id: q.id, legacyIndex: q.legacyIndex, title: q[0] })),
);
async function initProgress() {
  await tracker.ready;
  solved = tracker.solved;
  updateSolved();
}
function updateSolved() {
  const el =
    document.getElementById("solved") || document.getElementById("done");
  if (el)
    el.textContent =
      el.id === "done" ? solved.size : `Solved: ${solved.size}/${E.length}`;
}
async function saveProgress(n) {
  if (await tracker.save(n)) {
    solved = tracker.solved;
    updateSolved();
  }
}
const $ = (x) => document.getElementById(x);
function draw() {
  $("count").textContent = "Exercise " + (i + 1) + " of " + E.length;
  $("title").textContent = E[i][0];
  $("task").textContent = E[i][1];
  $("code").value = E[i][2];
  $("status").className = "status";
  $("status").textContent = "Edit the code, then run and check your work.";
  run();
  window.refreshLabSupport?.();
}
function run() {
  $("preview").srcdoc = $("code").value;
}
function reset() {
  draw();
}
function next() {
  i = (i + 1) % E.length;
  draw();
}
let t;
$("code").addEventListener("input", () => {
  clearTimeout(t);
  t = setTimeout(run, 350);
});
draw();

initProgress();
// Inspect the rendered, sandboxed document instead of matching source text.
async function check() {
  clearTimeout(t);
  const exercise = i,
    frame = $("preview"),
    token = crypto.randomUUID();
  const probe = `(()=>{let ok=false;try{const type=${exercise};if(type===0)ok=[...document.querySelectorAll('h1')].some(e=>e.textContent.trim()==='Welcome to Tamareen');if(type===1){const b=document.querySelector('button');if(b){const s=getComputedStyle(b);ok=parseFloat(s.paddingTop)>0&&parseFloat(s.borderTopLeftRadius)>0;}}if(type===2)ok=[...document.querySelectorAll('a')].some(a=>a.href.replace(/[/]$/,'')==='https://tamareen.online'&&a.textContent.trim()==='Tamareen');if(type===3){const p=document.getElementById('message'),b=document.querySelector('button');if(p&&b){const before=p.textContent;b.click();ok=p.textContent!==before;}}if(type===4){const c=document.querySelector('.container');ok=!!c&&getComputedStyle(c).gridTemplateColumns.split(' ').length===1&&[...document.styleSheets].some(s=>[...s.cssRules].some(r=>r instanceof CSSMediaRule&&/max-width\\s*:\\s*600px/.test(r.conditionText)&&matchMedia(r.conditionText).matches));}}catch{}parent.postMessage({tamareenCheck:${JSON.stringify(token)},ok},'*');})();`;
  frame.style.width = exercise === 4 ? "500px" : "100%";
  const result = new Promise((resolve) => {
    const timer = setTimeout(() => {
      window.removeEventListener("message", receive);
      resolve(false);
    }, 2500);
    function receive(e) {
      if (e.source === frame.contentWindow && e.data?.tamareenCheck === token) {
        clearTimeout(timer);
        window.removeEventListener("message", receive);
        resolve(e.data.ok === true);
      }
    }
    window.addEventListener("message", receive);
  });
  frame.srcdoc = $("code").value + "<script>" + probe + "</script>";
  $("status").textContent = "Checking the rendered result…";
  const ok = await result;
  frame.style.width = "100%";
  if (i !== exercise) return;
  $("status").className = "status" + (ok ? " good" : "");
  $("status").textContent = ok
    ? "Correct! The rendered page passes this task."
    : "Not complete yet. Check the rendered page and its behavior.";
  if (ok) await saveProgress(exercise);
  else {
    wrongAttempts[i] = (wrongAttempts[i] || 0) + 1;
  }
}
