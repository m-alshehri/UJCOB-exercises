// Shared multiple-choice concept lab. Configure with
// <script src="/js/concept-lab.js" data-lab="erp-lab" data-course="BCIS 324">.
(() => {
  const { lab: LAB, course: COURSE } = document.currentScript.dataset;
  const DATA = LAB_CONTENT[LAB];
  const esc = Tamareen.escape;
  const tracker = new LabProgress(
    COURSE,
    LAB,
    DATA.map((q) => ({ id: q.id, legacyIndex: q.legacyIndex, title: q.title })),
  );
  let solved = new Set();
  // Per-question option order and chosen answer, kept across filter changes.
  const orders = new Map();
  const answers = new Map();
  let current = "All";

  function updateSolved() {
    const el =
      document.getElementById("solved") || document.getElementById("done");
    if (el)
      el.textContent =
        el.id === "done"
          ? solved.size
          : `Solved: ${solved.size}/${DATA.length}`;
  }
  // progress.js calls this after a queued completion syncs.
  window.updateSolved = updateSolved;

  async function initProgress() {
    await tracker.ready;
    solved = tracker.solved;
    updateSolved();
  }
  async function saveProgress(n) {
    if (await tracker.save(n)) {
      solved = tracker.solved;
      updateSolved();
    }
  }

  function optionOrder(i) {
    if (!orders.has(i))
      orders.set(i, Tamareen.shuffle(DATA[i].options.map((_, j) => j)));
    return orders.get(i);
  }
  function feedback(x, j) {
    return j === x.a
      ? { cls: "feedback done", text: "Correct. " + x.explain }
      : { cls: "feedback wrong", text: "Not quite. " + x.explain };
  }
  function card(x, i) {
    const chosen = answers.get(i);
    const answered = chosen !== undefined;
    const opts = optionOrder(i)
      .map((j) => {
        const cls = [
          "opt",
          answered && j === x.a ? "good" : "",
          answered && j === chosen && j !== x.a ? "bad" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<button class="${cls}" data-q="${i}" data-j="${j}"${answered ? " disabled" : ""}>${esc(x.options[j])}</button>`;
      })
      .join("");
    const f = answered ? feedback(x, chosen) : { cls: "feedback", text: "" };
    return `<div class="card"><div class="tag">${esc(x.cat.toUpperCase())} · PRACTICE ${i + 1}</div><h3>${esc(x.title)}</h3><p>${esc(x.context)}</p><div class="task">${esc(x.q)}</div><div class="opts">${opts}</div><div class="${f.cls}" id="f${i}">${esc(f.text)}</div></div>`;
  }
  function render() {
    document.getElementById("grid").innerHTML = DATA.map((x, i) => [x, i])
      .filter(([x]) => current === "All" || x.cat === current)
      .map(([x, i]) => card(x, i))
      .join("");
  }
  function check(i, j) {
    if (answers.has(i)) return;
    answers.set(i, j);
    if (j === DATA[i].a) saveProgress(i);
    render();
    updateSolved();
  }
  function filter(cat, button) {
    current = cat;
    document
      .querySelectorAll(".chip")
      .forEach((x) => x.classList.toggle("on", x === button));
    render();
  }

  const cats = [...new Set(DATA.map((x) => x.cat))];
  document.getElementById("total").textContent = DATA.length;
  document.getElementById("chips").innerHTML = cats
    .map((c) => `<button class="chip" data-cat="${esc(c)}">${esc(c)}</button>`)
    .join("");
  document.querySelector(".filters").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) filter(chip.dataset.cat ?? "All", chip);
  });
  document.getElementById("grid").addEventListener("click", (e) => {
    const opt = e.target.closest(".opt");
    if (opt && !opt.disabled) check(+opt.dataset.q, +opt.dataset.j);
  });

  render();
  initProgress();
})();
