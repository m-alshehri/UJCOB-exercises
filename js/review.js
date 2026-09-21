(async () => {
  const host = document.getElementById("reviewList"),
    filter = document.getElementById("reviewCourse"),
    state = document.getElementById("reviewState");
  try {
    const rows = Pathways.schedule(await Learning.history());
    const courses = [
      ...new Set(rows.map((a) => a.questions?.courses?.code).filter(Boolean)),
    ];
    for (const code of courses) filter.add(new Option(code, code));
    const draw = () => {
      const shown = rows.filter(
        (a) =>
          (!filter.value || a.questions?.courses?.code === filter.value) &&
          (!state.value || String(a.due) === state.value),
      );
      host.replaceChildren();
      for (const a of shown) {
        const q = a.questions;
        if (!q) continue;
        const card = document.createElement("article");
        card.className = "learningCard";
        const esc = Tamareen.escape;
        card.innerHTML = `<p class="eyebrow">${esc(q.courses?.code)} · ${esc(q.topics?.name)} · ${a.due ? "Due for review" : "Reviewed"}</p><h2>${esc(q.question)}</h2><p>${I18n.t("Next review")}: ${new Date(a.dueAt).toLocaleDateString(I18n.lang)}</p><p>Your earlier answer: <strong>${esc(a.selected_answer)}</strong></p><details><summary>Review answer and explanation</summary><p>Correct answer: <strong>${esc(q.correct_answer)}</strong></p><p>${esc(q.explanation)}</p>${Object.entries(
          q.option_explanations || {},
        )
          .map(([o, r]) => `<p><strong>${esc(o)}</strong>: ${esc(r)}</p>`)
          .join("")}</details>`;
        if (q.is_active) {
          const link = document.createElement("a");
          link.href =
            "/?course=" +
            encodeURIComponent(q.courses.code) +
            "&reviewQuestion=" +
            q.id;
          link.textContent = "Practice this question again →";
          card.append(link);
        } else
          card.append(
            "This question is archived. Review the explanation above.",
          );
        host.append(card);
      }
      if (!shown.length)
        host.textContent =
          "No mistakes match these filters. Complete a quiz to build your review list.";
      document.getElementById("reviewCount").textContent =
        shown.length + " questions";
      const btn = document.getElementById("reviewPractice");
      btn.disabled = !shown.some((a) => a.due && a.questions?.is_active);
      btn.onclick = () => {
        const course =
          filter.value ||
          shown.find((a) => a.due && a.questions?.is_active)?.questions.courses.code;
        location.href =
          "/?course=" + encodeURIComponent(course) + "&spaced=1";
      };
    };
    filter.onchange = state.onchange = draw;
    draw();
  } catch (err) {
    host.textContent = "Could not load review history. " + err.message;
  }
})();
