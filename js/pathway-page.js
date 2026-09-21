(async () => {
  const select = document.getElementById("pathCourse"),
    host = document.getElementById("pathList"),
    summary = document.getElementById("pathSummary");
  for (const [code, c] of Object.entries(COURSES))
    select.add(new Option(code + " · " + c.name, code));
  const requested = new URLSearchParams(location.search).get("course");
  if (COURSES[requested]) select.value = requested;
  let answers = [],
    attempts = [];
  try {
    const s = await Tamareen.session();
    if (s) {
      answers = await Learning.history();
      attempts = await Tamareen.all(() =>
        Tamareen.client()
          .from("attempts")
          .select("id,purpose,score_percent,completed_at,courses(code)")
          .eq("user_id", s.user.id)
          .eq("purpose", "diagnostic")
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .order("id"),
      );
    }
  } catch (e) {
    summary.textContent = I18n.t("Could not load progress. Try again.");
    return;
  }
  function draw() {
    const code = select.value,
      rows = Pathways.progress(code, answers),
      next = rows.find((x) => !x.strong),
      e = Tamareen.escape,
      t = I18n.t;
    document.getElementById("diagnosticLink").href =
      "/?course=" + encodeURIComponent(code) + "&diagnostic=1";
    const diagnostic = attempts.find((a) => a.courses?.code === code);
    summary.textContent =
      t("Recommended starting point") +
      ": " +
      (next
        ? I18n.lang === "ar"
          ? next.ar
          : next.name
        : t("Apply your skills in the lab")) +
      ". " +
      t("Mastery needs 3 distinct recent questions and 70% accuracy.") +
      (diagnostic
        ? " " +
          t("Latest diagnostic") +
          ": " +
          diagnostic.score_percent +
          "% · " +
          new Date(diagnostic.completed_at).toLocaleDateString(I18n.lang)
        : "");
    const href = next
      ? "/?course=" + encodeURIComponent(code) + "&stage=" + next.index
      : Object.values(LAB_CATALOG).find((l) => l.code === code).url;
    document.getElementById("nextStep").href = href;
    host.innerHTML = rows
      .map(
        (l) =>
          `<article class="learningCard"><p class="eyebrow">${l.index + 1} / ${rows.length} · ${t(l.strong ? "Ready" : "Keep learning")}</p><h2>${e(I18n.lang === "ar" ? l.ar : l.name)}</h2><p>${e(l.topics.join(" · "))}</p><p>${t("Distinct questions")}: ${l.total} · ${t("Accuracy")}: ${l.pct}%</p><a href="/?course=${encodeURIComponent(code)}&stage=${l.index}">${t("Practice this step")} →</a></article>`,
      )
      .join("");
  }
  select.onchange = draw;
  window.addEventListener("languagechange", draw);
  draw();
})();
