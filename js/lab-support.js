/* Draft sync is explicit on conflicts, so an older tab cannot overwrite another device. */
(() => {
  const editor =
    document.getElementById("editor") || document.getElementById("code");
  if (!editor) return;
  const panel = document.createElement("section");
  panel.className = "learningCard labSupport";
  panel.innerHTML =
    '<h2>Practice support</h2><div class="actions"><button id="hintNext">Show next hint</button><button id="draftSave">Save cloud draft</button><button id="draftLoad">Load cloud draft</button></div><p id="draftState" role="status">Connecting draft storage…</p><ol id="hintList"></ol><details><summary>Test contract</summary><pre id="testContract"></pre></details>';
  editor.parentElement.insertAdjacentElement("afterend", panel);
  editor.setAttribute(
    "aria-label",
    LAB === "web-lab"
      ? "HTML, CSS and JavaScript code"
      : "Your " + (LAB === "python-lab" ? "Python" : "SQL") + " code",
  );
  editor.spellcheck = false;
  editor.setAttribute("autocapitalize", "off");
  let activeKey = "",
    revision = 0,
    cloud = null,
    timer,
    generation = 0,
    ready = false,
    hintIndex = 0;
  const message = (t) =>
    (document.getElementById("draftState").textContent = t);
  const hints = () => {
    const q = E[i],
      topic = LAB === "web-lab" ? q[0] : q[0];
    const approaches = {
      Basics:
        "Break the calculation into inputs, an expression and the required output.",
      Conditions:
        "Check the boundary value carefully. Decide which branch should include equality.",
      Loops:
        "Track how your accumulator changes on each iteration; start with a small example.",
      Functions:
        "Match the function name and parameters, then return the result rather than only printing it.",
      Strings:
        "Check spaces, case and slice boundaries. Strings return new values when transformed.",
      Lists:
        "Decide whether the task needs every element, a filtered subset, or an aggregate.",
      Dictionaries:
        "Separate keys from values and consider how repeated or missing keys should behave.",
      Mixed: "Solve the task in small steps and check the intermediate values.",
    };
    if (LAB === "web-lab")
      return [
        "Read the exact element and text required in the task.",
        "Use real HTML elements and CSS rules; comments are not rendered elements.",
        "Check the preview at narrow widths. For interactions, connect a real button event to the required DOM change.",
      ];
    if (LAB === "sql-lab") {
      const sql = q[4];
      return [
        "Identify the source tables and required output columns.",
        /JOIN/i.test(sql)
          ? "Match related keys with a JOIN before filtering or aggregating."
          : /GROUP BY/i.test(sql)
            ? "Group at the requested level; use HAVING for conditions on aggregates."
            : /WHERE/i.test(sql)
              ? "Use WHERE for row conditions. Check equality, NULL handling and boundaries."
              : "Select only the requested columns and check the required ordering.",
        "Compare the result columns, row values and order with the task; a valid query can still answer a different question.",
      ];
    }
    return [
      "Read the exact input and output contract below.",
      approaches[topic] || approaches.Mixed,
      "Walk through the smallest test by hand. Check the returned type and edge cases before running again.",
    ];
  };
  window.refreshLabSupport = async () => {
    const key = E[i].id;
    if (key === activeKey) return;
    activeKey = key;
    const gen = ++generation;
    ready = false;
    cloud = null;
    revision = 0;
    hintIndex = 0;
    clearTimeout(timer);
    document.getElementById("hintList").replaceChildren();
    document.getElementById("hintNext").disabled = false;
    document.getElementById("testContract").textContent =
      LAB === "python-lab"
        ? JSON.stringify(E[i][6], null, 2)
        : LAB === "web-lab"
          ? E[i][1]
          : E[i][3];
    message("Loading cloud draft…");
    const before = editor.value;
    try {
      await tracker.ready;
      if (!tracker.user) throw new Error("Sign in required");
      const rows = await Tamareen.checked(
        Tamareen.client()
          .from("lab_drafts")
          .select("code,revision,updated_at")
          .eq("user_id", tracker.user.id)
          .eq("lab_type", LAB)
          .eq("exercise_key", key),
      );
      if (gen !== generation) return;
      cloud = rows[0] || null;
      revision = cloud?.revision || 0;
      ready = true;
      const local = localStorage.getItem(
        "tamareen:draft:" + tracker.user.id + ":" + LAB + ":" + key,
      );
      if (
        cloud &&
        editor.value === before &&
        (!local || local === cloud.code)
      ) {
        editor.value = cloud.code;
        editor.dispatchEvent(new Event("input"));
        message("Cloud draft restored.");
      } else
        message(
          cloud
            ? "Cloud draft available. Local edits are preserved; use Load cloud draft to replace them."
            : "No cloud draft yet. Edits are saved after you pause.",
        );
    } catch (err) {
      if (gen === generation) message("Draft sync unavailable. " + err.message);
    }
  };
  async function save() {
    if (!ready) {
      message("Wait for the draft to load, or switch away and back to retry.");
      return;
    }
    const key = activeKey,
      gen = generation,
      code = editor.value;
    message("Saving draft…");
    try {
      const result = await Tamareen.checked(
        Tamareen.client().rpc("save_lab_draft", {
          p_lab: LAB,
          p_exercise: key,
          p_code: code,
          p_revision: revision,
        }),
      );
      if (gen !== generation) return;
      revision = result.revision;
      cloud = { code, revision };
      message("Cloud draft saved.");
    } catch (err) {
      Tamareen.report?.("draft_save");
      if (gen === generation) {
        ready = false;
        message(
          "Draft not saved: " +
            err.message +
            " Your code remains in the editor. Use Load cloud draft to refresh.",
        );
      }
    }
  }
  let saving = Promise.resolve();
  const queueSave = () => {
    saving = saving.then(save, save);
    return saving;
  };
  document.getElementById("draftSave").onclick = queueSave;
  document.getElementById("draftLoad").onclick = async () => {
    clearTimeout(timer);
    const gen = generation;
    try {
      await saving;
      const rows = await Tamareen.checked(
        Tamareen.client()
          .from("lab_drafts")
          .select("code,revision")
          .eq("user_id", tracker.user.id)
          .eq("lab_type", LAB)
          .eq("exercise_key", activeKey),
      );
      if (gen !== generation) return;
      cloud = rows[0] || null;
      revision = cloud?.revision || 0;
      ready = true;
      if (cloud) {
        editor.value = cloud.code;
        editor.dispatchEvent(new Event("input"));
      }
      message(
        cloud
          ? "Cloud version loaded."
          : "No cloud version exists yet. You can save this draft.",
      );
    } catch (err) {
      message(err.message);
    }
  };
  document.getElementById("hintNext").onclick = () => {
    const li = document.createElement("li");
    li.textContent = hints()[hintIndex++];
    document.getElementById("hintList").append(li);
    document.getElementById("hintNext").disabled = hintIndex >= 3;
  };
  editor.addEventListener("input", () => {
    clearTimeout(timer);
    if (tracker.user) {
      try {
        localStorage.setItem(
          "tamareen:draft:" + tracker.user.id + ":" + LAB + ":" + activeKey,
          editor.value,
        );
      } catch {}
    }
    if (ready) timer = setTimeout(queueSave, 1500);
  });
  window.refreshLabSupport();
})();
