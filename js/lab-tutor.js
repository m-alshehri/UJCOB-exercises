(() => {
  const editor =
    document.getElementById("editor") || document.getElementById("code");
  if (!editor) return;
  const panel = document.createElement("section");
  panel.className = "learningCard";
  panel.innerHTML =
    '<h2>Lab tutor</h2><p>Send this exercise, your code and test output to the AI tutor for a hint. Do not include passwords or personal data.</p><label>Hint level<select id="labHintLevel"><option value="1">1 · Think about the approach</option><option value="2">2 · Find the misconception</option><option value="3">3 · Plan a small correction</option></select></label><label>Your question<input id="labTutorQuestion" maxlength="300"></label><button id="labTutorSend">Ask for guidance</button><p id="labTutorAnswer" role="status"></p>';
  document.querySelector(".labSupport").after(panel);
  const btn = document.getElementById("labTutorSend"),
    answer = document.getElementById("labTutorAnswer");
  let generation = 0;
  const old = window.refreshLabSupport;
  window.refreshLabSupport = () => {
    generation++;
    answer.textContent = "";
    return old();
  };
  btn.onclick = async () => {
    const gen = generation;
    btn.disabled = true;
    answer.textContent = I18n.t("Thinking…");
    try {
      const r = await Tamareen.api("/api/tutor", {
        kind: "hint",
        lab: LAB,
        exercise: E[i].id,
        code: editor.value.slice(0, 6000),
        result: (
          document.getElementById("console")?.textContent ||
          document.getElementById("status")?.textContent ||
          ""
        ).slice(0, 2000),
        level: Number(document.getElementById("labHintLevel").value),
        message: document.getElementById("labTutorQuestion").value,
        language: I18n.lang,
      });
      if (gen === generation) answer.textContent = r.answer;
    } catch (e) {
      if (gen === generation) answer.textContent = I18n.t(e.message);
      Tamareen.report?.("tutor_error");
    } finally {
      btn.disabled = false;
    }
  };
})();
