let running=false;
const E = LAB_CONTENT["python-lab"];
let i = 0,
  py = null,
  topicFilter = "All",
  levelFilter = "All",
  solved = new Set(),
  wrongAttempts = {};
const COURSE = "BCIS 313",
  LAB = "python-lab";
const tracker = new LabProgress(
  COURSE,
  LAB,
  E.map((q) => ({ id: q.id, legacyIndex: q.legacyIndex, title: q[2] })),
);
async function initProgress() {
  await tracker.ready;
  solved = tracker.solved;
  updateSolved();
  const el = document.getElementById("editor");
  if (el && el.value === E[i][5]) el.value = readDraft(i, E[i][5]);
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
function visible() {
  return E.map((q, j) => ({ q, j })).filter(
    (x) =>
      (topicFilter === "All" || x.q[0] === topicFilter) &&
      (levelFilter === "All" || x.q[1] === levelFilter),
  );
}
function draw() {
  let q = E[i];
  const has = visible().length > 0;
  document.getElementById("run").disabled = running||!has;
  if (!has) {
    document.getElementById("desc").textContent =
      "No exercises match these filters. Choose another topic or level.";
    return;
  }
  $("count").textContent = `Exercise ${i + 1} of ${E.length}`;
  $("solved").textContent = `Solved: ${solved.size}/${E.length}`;
  $("level").textContent = q[1];
  $("topic").textContent = q[0];
  $("title").textContent = q[2];
  $("desc").textContent = q[3];
  $("example").textContent = q[4];
  $("editor").value = readDraft(i, q[5]);
  $("console").textContent = "Ready.";
  $("feedback").className = "feedback";
  let ts = ["All", ...new Set(E.map((q) => q[0]))];
  $("topics").innerHTML = ts
    .map(
      (t) =>
        `<button class="chip ${topicFilter === t ? "active" : ""}" onclick="setTopic('${t}')">${t}</button>`,
    )
    .join("");
  let ls = ["All", "Beginner", "Intermediate", "Advanced"];
  $("levels").innerHTML = ls
    .map(
      (t) =>
        `<button class="chip ${levelFilter === t ? "active" : ""}" onclick="setLevel('${t}')">${t}</button>`,
    )
    .join("");
}
function setTopic(t) {
  topicFilter = t;
  let v = visible();
  if (v.length) i = v[0].j;
  draw();
}
function setLevel(t) {
  levelFilter = t;
  let v = visible();
  if (v.length) i = v[0].j;
  draw();
}
function nextCode() {
  let v = visible();
  if (!v.length) return;
  let p = v.findIndex((x) => x.j === i);
  i = v[(p + 1) % v.length].j;
  draw();
}
function randomExercise() {
  let v = visible();
  if (!v.length) return;
  i = v[Math.floor(Math.random() * v.length)].j;
  draw();
}
function solutionCode(n) {
  const q = E[n];
  const tests = q[6] || [];
  const title = q[2];
  const known = {
    "Average sales":
      "def average_sales(sales):\n    return sum(sales)/len(sales)",
    "Highest sale": "def highest(sales):\n    return max(sales)",
    "Above target":
      "def above_target(values,target):\n    return [v for v in values if v > target]",
    "Remove duplicates":
      "def unique(values):\n    return list(dict.fromkeys(values))",
    "Order total":
      'def order_total(order):\n    return order["price"] * order["quantity"]',
    "Top seller": "def top_seller(data):\n    return max(data, key=data.get)",
    "Sales summary":
      'def summary(sales):\n    return {"total":sum(sales),"average":sum(sales)/len(sales)}',
    "Frequency table":
      "def frequency(values):\n    return {v:values.count(v) for v in dict.fromkeys(values)}",
    "Moving average":
      "def moving_average(values,k):\n    return [sum(values[j:j+k])/k for j in range(len(values)-k+1)]",
  };
  return (
    known[title] ||
    q[5] + "\n# Review the task and replace pass with the required logic."
  );
}
function resetCode() {
  $("editor").value = E[i][5];
  $("console").textContent = "Ready.";
  $("feedback").className = "feedback";
}
async function runCode() {
  if(running||!visible().length)return;running=true;
  const button = $("run"),
    exercise = i;
  button.disabled = true;
  $("console").textContent = "Running Python in an isolated worker…";
  try {
    const r = await runInWorker(
      "python",
      { code: $("editor").value, tests: E[exercise][6] },
      30000,
    );
    if (exercise !== i) return;
    $("status").textContent = "Python runs locally in an isolated worker.";
    $("console").textContent =
      r.r
        .map(
          (a, j) =>
            `Test ${j + 1}: ${a[0] ? "PASS" : "FAIL"} · got ${a[1]} · expected ${a[2]}`,
        )
        .join("\n") + (r.printed ? "\n\nOutput:\n" + r.printed : "");
    $("feedback").className = "feedback " + (r.ok ? "good" : "bad");
    $("feedback").textContent = r.ok
      ? "Correct! All checks passed."
      : "Not correct yet. Review the test results.";
    if (r.ok) await saveProgress(exercise);
    else wrongAttempts[exercise] = (wrongAttempts[exercise] || 0) + 1;
  } catch (e) {
    $("console").textContent = String(e.message);
    $("feedback").className = "feedback bad";
    $("feedback").textContent = "Check your code and try again.";
  } finally {
    running=false;button.disabled = !visible().length;
  }
}
draw();
initProgress();
function draftKey(n) {
  return (
    "tamareen:draft:" +
    (tracker.user?.id || "pending") +
    ":" +
    LAB +
    ":" +
    E[n].id
  );
}
function readDraft(n, fallback) {
  try {
    return tracker.user
      ? (localStorage.getItem(draftKey(n)) ?? fallback)
      : fallback;
  } catch {
    return fallback;
  }
}
document.getElementById("editor").addEventListener("input", () => {
  try {
    if (tracker.user)
      localStorage.setItem(
        draftKey(i),
        document.getElementById("editor").value,
      );
  } catch {}
});
