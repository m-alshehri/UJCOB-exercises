(() => {
  const filter = document.getElementById("projectCourse"),
    host = document.getElementById("projectList");
  for (const course of [...new Set(PROJECTS.map((p) => p.course))])
    filter.add(new Option(course, course));
  function draw() {
    const ar = I18n.lang === "ar",
      e = Tamareen.escape,
      t = I18n.t;
    host.innerHTML = PROJECTS.filter(
      (p) => !filter.value || p.course === filter.value,
    )
      .map(
        (p) =>
          `<article class="learningCard" id="${p.id}"><p class="eyebrow">${p.course}</p><h2>${e(ar ? p.ar : p.title)}</h2><p>${e(ar ? p.briefAr : p.brief)}</p><h3>${t("Deliverables")}</h3><p>${e(ar ? p.deliverablesAr : p.deliverables)}</p><h3>${t("Example")}</h3><pre dir="ltr">${e(p.example)}</pre><p>${t("Assessment rubric")}: ${t("Correctness")} 0–4 · ${t("Clarity")} 0–4 · ${t("Testing")} 0–4</p><p>${t(p.executable ? "Executable tests in the lab" : "Instructor-reviewed project: submit your work and evidence.")}</p><div class="actions"><a href="/${p.lab}.html${p.executable ? "?exercise=" + p.id : ""}">${t("Open related lab")} →</a><a href="/submissions.html?exercise=${p.id}">${t("Start project submission")} →</a></div></article>`,
      )
      .join("");
  }
  filter.onchange = draw;
  window.addEventListener("languagechange", draw);
  draw();
})();
