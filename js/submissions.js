(async () => {
  const $ = (id) => document.getElementById(id),
    e = Tamareen.escape,
    t = I18n.t;
  let data,
    busy = false,
    pending = null;
  const status = (s) => ($("submissionStatus").textContent = t(s));
  const names = {
    "project-sales-dashboard": "Sales dashboard",
    "project-inventory-planner": "Inventory planner",
    "project-customer-invoice": "Customer invoice",
  };
  async function load() {
    data = await Tamareen.api("/api/learning-admin", { action: "load" });
    $("submissionGroup").replaceChildren(new Option(t("Personal only"), ""));
    for (const g of data.groups)
      $("submissionGroup").add(new Option(g.name, g.id));
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
            owned = data.owned.some((g) => g.id === s.group_id);
          return `<article class="learningCard"><h2>${t(names[s.exercise_key])} · ${t("Version")} ${s.version}</h2><p>${e(s.studentName)} · ${new Date(s.created_at).toLocaleString(I18n.lang)} · ${e([...data.groups, ...data.owned].find((g) => g.id === s.group_id)?.name || t("Personal only"))}</p><details><summary>${t("View submitted code")}</summary><pre dir="ltr">${e(s.code)}</pre></details><p>${e(s.reflection)}</p>${feedback.map((f) => `<div class="assignment"><p>${t("Instructor feedback")} · ${new Date(f.created_at).toLocaleString(I18n.lang)}</p><p>${e(f.feedback)}</p><p>${t("Correctness")}: ${f.correctness}/4 · ${t("Clarity")}: ${f.clarity}/4 · ${t("Testing")}: ${f.testing}/4</p></div>`).join("") || "<p>" + t("Awaiting feedback") + "</p>"}${s.user_id === data.userId ? `<button data-reuse="${s.id}">${t("Revise and resubmit")}</button>` : ""}${owned ? `<form data-feedback="${s.id}"><label>${t("Feedback")}<textarea name="feedback" required maxlength="4000"></textarea></label><div class="actions">${["correctness", "clarity", "testing"].map((k) => `<label>${t(k[0].toUpperCase() + k.slice(1))}<select name="${k}" required><option value="">—</option>${[0, 1, 2, 3, 4].map((v) => `<option>${v}</option>`).join("")}</select></label>`).join("")}</div><button>${t("Save feedback")}</button></form>` : ""}</article>`;
        })
        .join("") || t("No submissions yet.");
    for (const b of document.querySelectorAll("[data-reuse]"))
      b.onclick = () => {
        const s = data.submissions.find((x) => x.id === b.dataset.reuse);
        $("submissionProject").value = s.exercise_key;
        $("submissionCode").value = s.code;
        $("submissionReflection").value = s.reflection;
        $("submissionGroup").value = s.group_id || "";
        $("submissionForm").scrollIntoView();
        status("Edit your code, then submit a new version.");
      };
    for (const form of document.querySelectorAll("[data-feedback]"))
      form.onsubmit = async (ev) => {
        ev.preventDefault();
        const btn = form.querySelector("button");
        btn.disabled = true;
        const f = new FormData(form);
        try {
          await Tamareen.api("/api/learning-admin", {
            action: "feedback",
            id: form.dataset.feedback,
            feedback: f.get("feedback"),
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
      };
  }
  try {
    await load();
    $("submissionForm").hidden = false;
    status("Ready.");
  } catch (err) {
    status(err.message);
    return;
  }
  const requested = new URLSearchParams(location.search).get("exercise");
  if (names[requested]) $("submissionProject").value = requested;
  $("loadProjectDraft").onclick = async () => {
    try {
      const s = await Tamareen.session(true);
      const rows = await Tamareen.checked(
        Tamareen.client()
          .from("lab_drafts")
          .select("code")
          .eq("user_id", s.user.id)
          .eq("lab_type", "python-lab")
          .eq("exercise_key", $("submissionProject").value),
      );
      if (!rows.length) {
        status("No cloud draft found.");
        return;
      }
      $("submissionCode").value = rows[0].code;
      status("Cloud draft loaded.");
    } catch (err) {
      status(err.message);
    }
  };
  $("submissionForm").onsubmit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    busy = true;
    const btn = $("submissionForm").querySelector('[type="submit"]');
    btn.disabled = true;
    const payload = {
      action: "submit",
      exercise: $("submissionProject").value,
      groupId: $("submissionGroup").value || null,
      code: $("submissionCode").value,
      reflection: $("submissionReflection").value,
    };
    const fingerprint = JSON.stringify(payload);
    if (pending?.fingerprint !== fingerprint)
      pending = { fingerprint, id: crypto.randomUUID() };
    try {
      await Tamareen.api("/api/learning-admin", { ...payload, id: pending.id });
      pending = null;
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
  window.addEventListener("languagechange", draw);
})();
