(async () => {
  const $ = (id) => document.getElementById(id),
    e = Tamareen.escape,
    t = I18n.t;
  let data,
    id = crypto.randomUUID(),
    revision = 0,
    questionId = null,
    busy = false;
  const status = (s) => ($("studioStatus").textContent = t(s));
  function fill(p = {}) {
    for (const [field, key] of Object.entries({
      editCourse: "course",
      editTopic: "topic",
      editText: "question",
      editCorrect: "correct",
      editExplanation: "explanation",
      editKind: "kind",
    }))
      $(field).value =
        p[key] ||
        (field === "editKind"
          ? "application"
          : field === "editCourse"
            ? data.courses[0].code
            : "");
    for (let i = 1; i <= 3; i++) $("wrong" + i).value = p.wrong?.[i - 1] || "";
    const opts = [p.correct, ...(p.wrong || [])];
    for (let i = 0; i <= 3; i++)
      $("rationale" + i).value = p.rationales?.[opts[i]] || "";
    $("questionPreview").hidden = true;
  }
  function payload() {
    const p = {
      course: $("editCourse").value,
      topic: $("editTopic").value.trim(),
      question: $("editText").value.trim(),
      correct: $("editCorrect").value.trim(),
      wrong: [1, 2, 3].map((i) => $("wrong" + i).value.trim()),
      explanation: $("editExplanation").value.trim(),
      kind: $("editKind").value,
    };
    p.rationales = Object.fromEntries(
      [p.correct, ...p.wrong].map((o, i) => [
        o,
        $("rationale" + i).value.trim(),
      ]),
    );
    return p;
  }
  function history() {
    const rows = data.versions.filter((v) => v.draft_id === id);
    $("versionList").innerHTML =
      rows
        .map(
          (v) =>
            `<details class="learningCard"><summary>${t(v.action === "published" ? "Published" : "Saved")} · ${v.revision} · ${new Date(v.created_at).toLocaleString(I18n.lang)}</summary><p>${e(v.payload.question)}</p><p>${e(v.payload.explanation)}</p><pre dir="ltr">${e(JSON.stringify(v.payload, null, 2))}</pre></details>`,
        )
        .join("") || t("No revisions yet.");
  }
  function choices() {
    const q = $("questionSearch").value.toLowerCase();
    $("existingQuestion").innerHTML =
      '<option value="">' +
      t("Choose a question") +
      "</option>" +
      data.questions
        .filter((x) => x.question.toLowerCase().includes(q))
        .map(
          (x) =>
            `<option value="${x.id}">${e(x.courses.code + " · " + x.question.slice(0, 100))}</option>`,
        )
        .join("");
    $("draftSelect").innerHTML =
      '<option value="">' +
      t("Choose a draft") +
      "</option>" +
      data.drafts
        .map(
          (d) =>
            `<option value="${d.id}">${e(d.payload.question.slice(0, 100))} · ${d.revision} · ${t(d.status === "published" ? "Published" : "Draft")}</option>`,
        )
        .join("");
  }
  async function reload() {
    data = await Tamareen.api("/api/learning-admin", { action: "content" });
    choices();
    history();
  }
  try {
    data = await Tamareen.api("/api/learning-admin", { action: "content" });
    for (const c of data.courses)
      $("editCourse").add(new Option(c.code + " · " + c.name, c.code));
    choices();
    fill();
    history();
    $("studio").hidden = false;
    status("Ready.");
  } catch (err) {
    status(err.message);
    return;
  }
  $("questionSearch").oninput = choices;
  $("newQuestion").onclick = () => {
    id = crypto.randomUUID();
    revision = 0;
    questionId = null;
    fill();
    history();
    status("New draft");
  };
  $("editQuestion").onclick = () => {
    const q = data.questions.find((x) => x.id === $("existingQuestion").value);
    if (!q) return;
    const existing = data.drafts.find((d) => d.question_id === q.id);
    if (existing) {
      id = existing.id;
      revision = existing.revision;
      questionId = existing.question_id;
      fill(existing.payload);
    } else {
      id = crypto.randomUUID();
      revision = 0;
      questionId = q.id;
      fill({
        course: q.courses.code,
        topic: q.topics.name,
        question: q.question,
        correct: q.correct_answer,
        wrong: q.wrong_answers,
        explanation: q.explanation,
        kind: q.question_kind,
        rationales: q.option_explanations,
      });
    }
    history();
    status("Editing question");
  };
  $("draftSelect").onchange = () => {
    const d = data.drafts.find((x) => x.id === $("draftSelect").value);
    if (!d) return;
    id = d.id;
    revision = d.revision;
    questionId = d.question_id;
    fill(d.payload);
    history();
  };
  $("previewQuestion").onclick = () => {
    const p = payload();
    $("questionPreview").hidden = false;
    $("questionPreview").innerHTML =
      `<h2>${e(p.question)}</h2>` +
      [p.correct, ...p.wrong]
        .map((o) => `<p>${e(o)}</p><small>${e(p.rationales[o])}</small>`)
        .join("") +
      `<p>${e(p.explanation)}</p>`;
  };
  async function save(publish) {
    if (busy || !$("questionForm").reportValidity()) return;
    busy = true;
    document
      .querySelectorAll("#questionForm button")
      .forEach((b) => (b.disabled = true));
    status("Saving…");
    try {
      const r = await Tamareen.api("/api/learning-admin", {
        action: "saveQuestion",
        id,
        revision,
        questionId,
        payload: payload(),
        publish,
      });
      revision = r.draft.revision;
      questionId = r.draft.question_id;
      await reload();
      status(
        publish
          ? "Published. New practice sessions use this version."
          : "Draft saved.",
      );
    } catch (err) {
      status(err.message);
    } finally {
      busy = false;
      document
        .querySelectorAll("#questionForm button")
        .forEach((b) => (b.disabled = false));
    }
  }
  $("questionForm").onsubmit = (ev) => {
    ev.preventDefault();
    save(false);
  };
  $("publishQuestion").onclick = () => save(true);
})();
