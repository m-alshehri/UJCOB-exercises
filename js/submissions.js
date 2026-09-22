(async () => {
  const $ = (id) => document.getElementById(id),
    e = Tamareen.escape,
    t = I18n.t;
  let data,
    busy = false,
    context = "",
    revision = 0,
    draftTimer,
    saveQueue = Promise.resolve(),
    draftConflict = false;
  const status = (s) => ($("submissionStatus").textContent = t(s)),
    draftStatus = (s) => ($("submissionDraftStatus").textContent = t(s));
  const name = (id) => {
    const p = PROJECTS.find((p) => p.id === id);
    return p ? (I18n.lang === "ar" ? p.ar : p.title) : id;
  };
  const payload = () => ({
    action: "submit",
    exercise: $("submissionProject").value,
    groupId: $("submissionGroup").value || null,
    assignmentId: $("submissionAssignment").value || null,
    code: $("submissionCode").value,
    reflection: $("submissionReflection").value,
  });
  function store() {
    if (!context) return false;
    try {
      const old = JSON.parse(localStorage.getItem(context) || "null");
      localStorage.setItem(
        context,
        JSON.stringify({
          ...old,
          baseRevision: draftConflict ? (old?.baseRevision ?? null) : revision,
          code: $("submissionCode").value,
          reflection: $("submissionReflection").value,
        }),
      );
      return true;
    } catch {
      draftStatus(
        "Local storage unavailable. Keep this page open until cloud saving succeeds.",
      );
      return false;
    }
  }
  function setContext() {
    clearTimeout(draftTimer);
    draftConflict = false;
    const a = data.assignments.find(
      (a) => a.id === $("submissionAssignment").value,
    );
    if (a) {
      $("submissionProject").value = a.exercise_keys[0];
      $("submissionGroup").value = a.group_id;
    }
    $("submissionProject").disabled = $("submissionGroup").disabled = !!a;
    $("saveAssignmentDraft").hidden = $("restoreAssignmentDraft").hidden = !a;
    const p = PROJECTS.find((p) => p.id === $("submissionProject").value);
    $("loadProjectDraft").hidden = !p?.executable;
    $("assignmentDetails").textContent = a
      ? a.title +
        (a.due_at
          ? " · " +
            t("Due") +
            ": " +
            new Date(a.due_at).toLocaleString(I18n.lang)
          : "")
      : "";
    context =
      "tamareen:submission:" +
      data.userId +
      ":" +
      (a?.id ||
        $("submissionProject").value + ":" + $("submissionGroup").value);
    const cloud = data.drafts.find((d) => d.assignment_id === a?.id);
    revision = cloud?.revision || 0;
    let local;
    try {
      local = JSON.parse(localStorage.getItem(context) || "null");
    } catch {}
    $("submissionCode").value = local?.code ?? cloud?.code ?? "";
    $("submissionReflection").value =
      local?.reflection ?? cloud?.reflection ?? "";
    draftConflict = !!(
      local &&
      cloud &&
      (local.code !== cloud.code || local.reflection !== cloud.reflection) &&
      local.baseRevision !== cloud.revision
    );
    draftStatus(
      draftConflict
        ? "Draft changed on another device. Load the cloud draft before saving."
        : local
          ? "Local draft restored."
          : cloud
            ? "Cloud draft restored."
            : "Your edits will be saved on this device.",
    );
  }
  async function load() {
    data = await Tamareen.api("/api/learning-admin", { action: "load" });
    data.assignments ||= [];
    data.drafts ||= [];
    draw();
  }
  function draw() {
    const filter = $("submissionFilter").value;
    const rows = data.submissions.filter((s) =>
      filter === "mine"
        ? s.user_id === data.userId
        : filter === "review"
          ? data.owned.some((g) => g.id === s.group_id) &&
            !data.feedback.some((f) => f.submission_id === s.id)
          : true,
    );
    $("submissionList").innerHTML =
      rows
        .map((s) => {
          const feedback = data.feedback.filter(
              (f) => f.submission_id === s.id,
            ),
            owned = data.owned.some((g) => g.id === s.group_id),
            outcome = feedback[0]?.outcome;
          return `<article id="submission-${s.id}" class="learningCard"><h2>${e(name(s.exercise_key))} · ${t("Version")} ${s.version}</h2><p class="stateBadge">${t(outcome === "completed" ? "Complete" : outcome === "needs_revision" ? "Needs revision" : "Submitted")}</p><p>${e(s.studentName)} · ${new Date(s.created_at).toLocaleString(I18n.lang)} · ${e([...data.groups, ...data.owned].find((g) => g.id === s.group_id)?.name || t("Personal only"))}</p><details><summary>${t("View submitted work")}</summary><pre dir="ltr">${e(s.code)}</pre></details><p>${e(s.reflection)}</p>${feedback.map((f) => `<div class="assignment"><p>${t("Instructor feedback")} · ${new Date(f.created_at).toLocaleString(I18n.lang)}</p><p>${e(f.feedback)}</p><p>${t("Correctness")}: ${f.correctness}/4 · ${t("Clarity")}: ${f.clarity}/4 · ${t("Testing")}: ${f.testing}/4</p></div>`).join("") || "<p>" + t("Awaiting feedback") + "</p>"}${s.user_id === data.userId ? `<button data-reuse="${s.id}">${t("Revise and resubmit")}</button>` : ""}${owned ? `<form data-feedback="${s.id}"><label>${t("Feedback")}<textarea name="feedback" required maxlength="4000"></textarea></label><label>${t("Review outcome")}<select name="outcome"><option value="reviewed">${t("Feedback only")}</option><option value="needs_revision">${t("Needs revision")}</option><option value="completed">${t("Complete")}</option></select></label><div class="actions">${["correctness", "clarity", "testing"].map((k) => `<label>${t(k[0].toUpperCase() + k.slice(1))}<select name="${k}" required><option value="">—</option>${[0, 1, 2, 3, 4].map((v) => `<option>${v}</option>`).join("")}</select></label>`).join("")}</div><button>${t("Save feedback")}</button></form>` : ""}</article>`;
        })
        .join("") || t("No submissions yet.");
    document.querySelectorAll("[data-reuse]").forEach(
      (b) =>
        (b.onclick = () => {
          store();
          const s = data.submissions.find((x) => x.id === b.dataset.reuse);
          $("submissionAssignment").value = s.assignment_id || "";
          $("submissionProject").value = s.exercise_key;
          $("submissionGroup").value = s.group_id || "";
          setContext();
          $("submissionCode").value = s.code;
          $("submissionReflection").value = s.reflection;
          store();
          $("submissionCode").focus();
          status("Edit your code, then submit a new version.");
        }),
    );
    document.querySelectorAll("[data-feedback]").forEach(
      (form) =>
        (form.onsubmit = async (ev) => {
          ev.preventDefault();
          const btn = form.querySelector("button");
          btn.disabled = true;
          const f = new FormData(form);
          try {
            await Tamareen.api("/api/learning-admin", {
              action: "feedback",
              id: form.dataset.feedback,
              feedback: f.get("feedback"),
              outcome: f.get("outcome"),
              ...Object.fromEntries(
                ["correctness", "clarity", "testing"].map((k) => [
                  k,
                  Number(f.get(k)),
                ]),
              ),
            });
            await load();
            status("Feedback saved.");
          } catch (err) {
            status(err.message);
            btn.disabled = false;
          }
        }),
    );
  }
  try {
    await load();
    $("submissionProject").replaceChildren(
      ...PROJECTS.map((p) => new Option(name(p.id) + " · " + p.course, p.id)),
    );
    $("submissionGroup").replaceChildren(
      new Option(t("Personal only"), ""),
      ...data.groups.map((g) => new Option(g.name, g.id)),
    );
    $("submissionAssignment").replaceChildren(
      new Option(t("Independent project"), ""),
      ...data.assignments.map((a) => new Option(a.title, a.id)),
    );
    const qp = new URLSearchParams(location.search);
    if (PROJECTS.some((p) => p.id === qp.get("exercise")))
      $("submissionProject").value = qp.get("exercise");
    if (data.assignments.some((a) => a.id === qp.get("assignment")))
      $("submissionAssignment").value = qp.get("assignment");
    setContext();
    $("submissionForm").hidden = false;
    status("Ready.");
    if (location.hash.startsWith("#submission-"))
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch (err) {
    status(err.message);
    return;
  }
  for (const id of [
    "submissionAssignment",
    "submissionProject",
    "submissionGroup",
  ])
    $(id).onchange = () => setContext();
  function queueDraft() {
    const p = payload(),
      key = context;
    if (!p.assignmentId) return;
    if (draftConflict) {
      draftStatus(
        "Draft changed on another device. Load the cloud draft before saving.",
      );
      return;
    }
    saveQueue = saveQueue.then(async () => {
      if (key !== context) return;
      draftStatus("Saving draft…");
      try {
        const out = await Tamareen.api("/api/learning-admin", {
          ...p,
          action: "draft",
          revision,
        });
        data.drafts = data.drafts
          .filter((d) => d.assignment_id !== p.assignmentId)
          .concat(out.draft);
        if (key === context) {
          revision = out.draft.revision;
          store();
          draftStatus(
            $("submissionCode").value === p.code &&
              $("submissionReflection").value === p.reflection
              ? "Cloud draft saved."
              : "Saved on this device. Cloud saving pending.",
          );
        }
      } catch (err) {
        if (key !== context) return;
        draftConflict = /changed|Reload/.test(err.message);
        draftStatus(
          draftConflict
            ? "Draft changed on another device. Load the cloud draft before saving."
            : "Saved on this device. Reconnect to sync.",
        );
        Tamareen.report?.("draft_save");
      }
    });
    return saveQueue;
  }
  function edit() {
    const saved = store();
    if (saved)
      draftStatus(
        draftConflict
          ? "Draft changed on another device. Load the cloud draft before saving."
          : $("submissionAssignment").value
            ? "Saved on this device. Cloud saving pending."
            : "Saved on this device.",
      );
    clearTimeout(draftTimer);
    if ($("submissionAssignment").value && navigator.onLine)
      draftTimer = setTimeout(queueDraft, 1500);
  }
  $("submissionCode").addEventListener("input", edit);
  $("submissionReflection").addEventListener("input", edit);
  $("saveAssignmentDraft").onclick = queueDraft;
  $("restoreAssignmentDraft").onclick = async () => {
    clearTimeout(draftTimer);
    await saveQueue;
    try {
      await load();
      const d = data.drafts.find(
        (d) => d.assignment_id === $("submissionAssignment").value,
      );
      if (d) {
        $("submissionCode").value = d.code;
        $("submissionReflection").value = d.reflection;
        revision = d.revision;
        draftConflict = false;
        store();
        draftStatus("Cloud draft restored.");
      } else draftStatus("No cloud draft found.");
    } catch (err) {
      draftStatus(err.message);
    }
  };
  window.addEventListener("online", () => {
    if (!draftConflict) queueDraft();
  });
  window.addEventListener("offline", () => {
    if (store())
      draftStatus(
        $("submissionAssignment").value
          ? "Saved on this device. Reconnect to sync."
          : "Saved on this device.",
      );
  });
  $("loadProjectDraft").onclick = async () => {
    try {
      const p = PROJECTS.find((p) => p.id === $("submissionProject").value);
      const rows = await Tamareen.checked(
        Tamareen.client()
          .from("lab_drafts")
          .select("code")
          .eq("user_id", data.userId)
          .eq("lab_type", p.lab)
          .eq("exercise_key", p.id),
      );
      if (!rows.length) return status("No cloud draft found.");
      $("submissionCode").value = rows[0].code;
      edit();
      status("Cloud draft loaded.");
    } catch (err) {
      status(err.message);
    }
  };
  $("submissionForm").onsubmit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    busy = true;
    clearTimeout(draftTimer);
    const btn = $("submissionForm").querySelector("[type=submit]");
    btn.disabled = true;
    const p = payload(),
      key = context;
    let pending;
    try {
      const local = JSON.parse(localStorage.getItem(key) || "null");
      pending = local?.pending;
      if (pending?.fingerprint !== JSON.stringify(p))
        pending = { fingerprint: JSON.stringify(p), id: crypto.randomUUID() };
      localStorage.setItem(
        key,
        JSON.stringify({
          ...local,
          code: p.code,
          reflection: p.reflection,
          pending,
        }),
      );
    } catch {
      pending = { id: crypto.randomUUID() };
    }
    try {
      await saveQueue;
      await Tamareen.api("/api/learning-admin", { ...p, id: pending.id });
      try {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        delete saved.pending;
        localStorage.setItem(key, JSON.stringify(saved));
      } catch {}
      await load();
      status("Submission saved.");
    } catch (err) {
      status(err.message);
    } finally {
      busy = false;
      btn.disabled = false;
    }
  };
  $("submissionFilter").onchange = draw;
  window.addEventListener("languagechange", () => {
    draw();
    for (const option of $("submissionProject").options)
      option.textContent =
        name(option.value) +
        " · " +
        PROJECTS.find((p) => p.id === option.value).course;
  });
})();
