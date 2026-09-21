const DATA = LAB_CONTENT["analytics-lab"];
let solved = new Set();
const COURSE = "BCIS 421",
  LAB = "analytics-lab";
const tracker = new LabProgress(
  COURSE,
  LAB,
  DATA.map((q) => ({ id: q.id, legacyIndex: q.legacyIndex, title: q.title })),
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
const cats = [...new Set(DATA.map((x) => x.cat))];
document.getElementById("total").textContent = DATA.length;
document.getElementById("chips").innerHTML = cats
  .map(
    (c) =>
      '<button class="chip" onclick="filter(\'' +
      c +
      "',this)\">" +
      c +
      "</button>",
  )
  .join("");
function render(list = DATA) {
  document.getElementById("grid").innerHTML = list
    .map((x, i) => {
      const real = DATA.indexOf(x);
      return (
        '<div class="card"><div class="tag">' +
        x.cat.toUpperCase() +
        " · PRACTICE " +
        (real + 1) +
        "</div><h3>" +
        x.title +
        "</h3><p>" +
        x.context +
        '</p><div class="task">' +
        x.q +
        '</div><div class="opts">' +
        Tamareen.shuffle(x.options.map((o, j) => ({ o, j })))
          .map(
            ({ o, j }) =>
              '<button class="opt" onclick="check(' +
              real +
              "," +
              j +
              ',this)">' +
              o +
              "</button>",
          )
          .join("") +
        '</div><div class="feedback" id="f' +
        real +
        '"></div></div>'
      );
    })
    .join("");
}
function check(i, j, b) {
  const x = DATA[i],
    card = b.closest(".card");
  card.querySelectorAll(".opt").forEach((el, k) => {
    el.disabled = true;
    if (el.textContent === x.options[x.a]) el.classList.add("good");
  });
  const f = document.getElementById("f" + i);
  if (j === x.a) {
    saveProgress(i);
    f.className = "feedback done";
    f.textContent = "Correct. " + x.explain;
  } else {
    b.classList.add("bad");
    f.className = "feedback wrong";
    f.textContent = "Not quite. " + x.explain;
  }
  document.getElementById("done").textContent = solved.size;
}
function filter(c, b) {
  document.querySelectorAll(".chip").forEach((x) => x.classList.remove("on"));
  b.classList.add("on");
  render(c === "All" ? DATA : DATA.filter((x) => x.cat === c));
}
render();
initProgress();
