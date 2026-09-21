(async () => {
  const $ = (id) => document.getElementById(id),
    e = Tamareen.escape,
    t = I18n.t;
  let data;
  try {
    data = await Tamareen.api("/api/learning-admin", { action: "quality" });
  } catch (err) {
    $("qualityStatus").textContent = t(err.message);
    return;
  }
  for (const c of [
    ...new Set(data.questions.map((q) => q.courses?.code)),
  ].filter(Boolean))
    $("qualityCourse").add(new Option(c, c));
  function draw() {
    const rows = data.questions.filter(
      (q) =>
        (!$("qualityCourse").value ||
          q.courses?.code === $("qualityCourse").value) &&
        q.question
          .toLowerCase()
          .includes($("qualitySearch").value.toLowerCase()) &&
        (!$("reportedOnly").checked || q.reports.some((r) => !r.resolved)),
    );
    $("qualityStatus").textContent = rows.length + " " + t("questions");
    $("qualityList").innerHTML = rows
      .map(
        (q) =>
          `<article class="learningCard"><p>${e(q.courses?.code)} · ${t(q.is_active ? "Active" : "Archived")}</p><h2>${e(q.question)}</h2><p>${t("Learners")}: ${q.learners} · ${t("Accuracy")}: ${q.accuracy ?? "—"}% · ${q.insufficient ? t("Insufficient evidence") : t("Review with context")}</p><details><summary>${t("Option selections")}</summary>${Object.entries(
            q.choices,
          )
            .map(([o, n]) => `<p>${e(o)}: ${n}</p>`)
            .join(
              "",
            )}</details>${q.reports.map((r) => `<div class="assignment"><p>${t(r.reason)} · ${e(r.note)} · ${t(r.resolved ? "Resolved" : "Open")}</p>${r.resolved ? "" : `<button data-report="${r.id}">${t("Mark resolved")}</button>`}</div>`).join("")}<a href="/content-studio.html">${t("Edit content")} →</a></article>`,
      )
      .join("");
    for (const b of document.querySelectorAll("[data-report]"))
      b.onclick = async () => {
        b.disabled = true;
        try {
          await Tamareen.api("/api/learning-admin", {
            action: "resolveReport",
            id: b.dataset.report,
          });
          data.questions
            .flatMap((q) => q.reports)
            .find((r) => r.id === b.dataset.report).resolved = true;
          draw();
        } catch (err) {
          $("qualityStatus").textContent = err.message;
          b.disabled = false;
        }
      };
  }
  $("qualitySearch").oninput =
    $("qualityCourse").onchange =
    $("reportedOnly").onchange =
      draw;
  window.addEventListener("languagechange", draw);
  draw();
})();
