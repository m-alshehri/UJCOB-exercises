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
    let currentMode = "list"; // 'list' | 'flashcards'
    let fcIndex = 0;
    let currentShown = [];

    const btnList = document.getElementById("btnListView");
    const btnFc = document.getElementById("btnFlashcardView");
    const deck = document.getElementById("flashcardDeck");
    const cardEl = document.getElementById("flashcard");
    const isAr =
      (typeof I18n !== "undefined" && I18n.lang === "ar") ||
      document.documentElement.lang === "ar";

    function setViewMode(mode) {
      currentMode = mode;
      btnList.classList.toggle("active", mode === "list");
      btnFc.classList.toggle("active", mode === "flashcards");
      host.style.display = mode === "list" ? "block" : "none";
      deck.style.display = mode === "flashcards" ? "flex" : "none";
      if (mode === "flashcards") {
        fcIndex = 0;
        renderFlashcard();
      }
    }
    btnList.onclick = () => setViewMode("list");
    btnFc.onclick = () => setViewMode("flashcards");

    function renderFlashcard() {
      if (!currentShown.length) {
        document.getElementById("fcQuestion").textContent = isAr
          ? "لا توجد أسئلة لمراجعتها في هذا الفلتر."
          : "No questions match these filters.";
        document.getElementById("fcCounter").textContent = "0 / 0";
        document.getElementById("fcProgressFill").style.width = "0%";
        return;
      }
      if (fcIndex < 0) fcIndex = 0;
      if (fcIndex >= currentShown.length) fcIndex = currentShown.length - 1;
      cardEl.classList.remove("flipped");

      const item = currentShown[fcIndex];
      const q = item.questions || {};
      const esc = Tamareen.escape;
      document.getElementById("fcCounter").textContent = isAr
        ? `بطاقة ${fcIndex + 1} من ${currentShown.length}`
        : `Card ${fcIndex + 1} of ${currentShown.length}`;
      document.getElementById("fcProgressFill").style.width =
        Math.round(((fcIndex + 1) / currentShown.length) * 100) + "%";

      document.getElementById("fcCourse").textContent = q.courses?.code || "Course";
      document.getElementById("fcTopic").textContent = q.topics?.name || "Concept";
      document.getElementById("fcQuestion").textContent = q.question || "";
      document.getElementById("fcAnswer").textContent = q.correct_answer || "";
      document.getElementById("fcExplanation").textContent = q.explanation || "";

      const optionsWrap = document.getElementById("fcOptionsExplanation");
      if (optionsWrap) {
        optionsWrap.innerHTML = Object.entries(q.option_explanations || {})
          .map(([o, r]) => `<p><strong>${esc(o)}</strong>: ${esc(r)}</p>`)
          .join("");
      }
      document.getElementById("fcPrev").disabled = fcIndex === 0;
      document.getElementById("fcNext").disabled =
        fcIndex === currentShown.length - 1;
    }

    cardEl.onclick = () => cardEl.classList.toggle("flipped");
    document.getElementById("fcFlip").onclick = () =>
      cardEl.classList.toggle("flipped");
    document.getElementById("fcPrev").onclick = () => {
      if (fcIndex > 0) {
        fcIndex--;
        renderFlashcard();
      }
    };
    document.getElementById("fcNext").onclick = () => {
      if (fcIndex < currentShown.length - 1) {
        fcIndex++;
        renderFlashcard();
      }
    };

    window.addEventListener("keydown", (e) => {
      if (currentMode !== "flashcards") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        cardEl.classList.toggle("flipped");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isAr) {
          if (fcIndex > 0) {
            fcIndex--;
            renderFlashcard();
          }
        } else {
          if (fcIndex < currentShown.length - 1) {
            fcIndex++;
            renderFlashcard();
          }
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (isAr) {
          if (fcIndex < currentShown.length - 1) {
            fcIndex++;
            renderFlashcard();
          }
        } else {
          if (fcIndex > 0) {
            fcIndex--;
            renderFlashcard();
          }
        }
      }
    });

    const draw = () => {
      const shown = rows.filter(
        (a) =>
          (!filter.value || a.questions?.courses?.code === filter.value) &&
          (!state.value || String(a.due) === state.value),
      );
      currentShown = shown;
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
      if (currentMode === "flashcards") {
        renderFlashcard();
      }
    };
    filter.onchange = state.onchange = draw;
    draw();
  } catch (err) {
    host.textContent = "Could not load review history. " + err.message;
  }
})();
