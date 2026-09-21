let running = false;
const E = LAB_CONTENT["sql-lab"];
let i = 0,
  SQL = null,
  topicFilter = "All",
  levelFilter = "All",
  solved = new Set(),
  wrongAttempts = {};
const COURSE = "BCIS 311",
  LAB = "sql-lab";
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
  if (el && el.value === "-- Write your query here\n")
    el.value = readDraft(i, "-- Write your query here\n");
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
  document.getElementById("run").disabled = running || !has;
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
  $("editor").value = readDraft(i, "-- Write your query here\n");
  $("console").textContent = "Ready.";
  $("feedback").className = "feedback";
  window.refreshLabSupport?.();
  let ts = ["All", ...new Set(E.map((q) => q[0]))];
  $("topics").innerHTML = ts
    .map(
      (t) =>
        `<button class="chip ${topicFilter === t ? "active" : ""}" onclick="setTopic('${t}')">${t}</button>`,
    )
    .join("");
  $("levels").innerHTML = ["All", "Beginner", "Intermediate", "Advanced"]
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
function resetCode() {
  $("editor").value = "-- Write your query here\n";
  $("console").textContent = "Ready.";
  $("feedback").className = "feedback";
  window.refreshLabSupport?.();
}
const PRACTICE_SCHEMA =
  "CREATE TABLE Customers(CustomerID INTEGER PRIMARY KEY,Name TEXT,City TEXT);CREATE TABLE Products(ProductID INTEGER PRIMARY KEY,ProductName TEXT,Category TEXT,Price REAL);CREATE TABLE Orders(OrderID INTEGER PRIMARY KEY,CustomerID INTEGER,OrderDate TEXT);CREATE TABLE OrderItems(OrderID INTEGER,ProductID INTEGER,Quantity INTEGER);INSERT INTO Customers VALUES(1,'Ahmed','Jeddah'),(2,'Sara','Riyadh'),(3,'Khalid','Jeddah'),(4,'Lina','Makkah'),(5,'Omar','Riyadh');INSERT INTO Products VALUES(1,'Keyboard','Accessories',90),(2,'Mouse','Accessories',75),(3,'Monitor','Displays',650),(4,'Headset','Audio',180),(5,'USB Cable','Accessories',35),(6,'Speakers','Audio',220);INSERT INTO Orders VALUES(101,1,'2026-09-01'),(102,2,'2026-09-02'),(103,1,'2026-09-03'),(104,3,'2026-09-04');INSERT INTO OrderItems VALUES(101,1,2),(101,2,1),(102,3,1),(103,4,2),(104,5,3);";
function renderResults(results) {
  const box = $("console");
  box.replaceChildren();
  if (!results.length) {
    box.textContent = "Query executed successfully.";
    return;
  }
  const result = results.at(-1),
    table = document.createElement("table");
  const head = document.createElement("tr");
  result.columns.forEach((value) => {
    const cell = document.createElement("th");
    cell.textContent = value;
    head.append(cell);
  });
  table.append(head);
  result.values.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = String(value ?? "NULL");
      tr.append(cell);
    });
    table.append(tr);
  });
  box.append(table);
}
async function runSQL() {
  if (running || !visible().length) return;
  running = true;
  const button = $("run"),
    exercise = i;
  button.disabled = true;
  $("console").textContent = "Running SQL in an isolated worker…";
  try {
    const r = await runInWorker("sql", {
      code: $("editor").value,
      expected: E[exercise][4],
      schema: PRACTICE_SCHEMA,
    });
    if (exercise !== i) return;
    renderResults(r.result);
    $("status").textContent = "SQLite runs locally in an isolated worker.";
    $("feedback").className = "feedback " + (r.ok ? "good" : "bad");
    $("feedback").textContent = r.ok
      ? "Correct! Your SQL passed the checker."
      : "Not correct yet. Check columns, filtering and ordering.";
    if (r.ok) await saveProgress(exercise);
    else {
      wrongAttempts[exercise] = (wrongAttempts[exercise] || 0) + 1;
    }
  } catch (e) {
    $("console").textContent = "SQL error: " + e.message;
    $("feedback").className = "feedback bad";
    $("feedback").textContent = "Correct the query and try again.";
  } finally {
    running = false;
    button.disabled = !visible().length;
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
