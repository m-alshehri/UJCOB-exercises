(async () => {
  const $ = (id) => document.getElementById(id),
    esc = Tamareen.escape;
  const act = async (body) => {
    const b = $("classStatus");
    b.textContent = "Working…";
    try {
      const result = await Tamareen.api("/api/classrooms", body);
      b.textContent = "";
      return result;
    } catch (err) {
      b.textContent = err.message;
      throw err;
    }
  };
  $("joinGroup").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await act({ action: "join", code: $("joinCode").value });
      await load();
    } catch {}
  };
  $("createGroup").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await act({ action: "createGroup", name: $("groupName").value });
      $("groupName").value = "";
      await load();
    } catch {}
  };
  function assignmentForm(group) {
    const form = document.createElement("form");
    form.className = "learningCard";
    form.innerHTML =
      '<h3>Assign practice</h3><label>Title<input name="title" required maxlength="160"></label><label>Course<select name="course"></select></label><label>Type<select name="kind"><option value="practice">One practice quiz</option><option value="lab">Selected lab exercises</option><option value="project">Project submission</option></select></label><fieldset><legend>Exercises</legend><div class="exerciseChoices"></div></fieldset><label>Due date (your local time, optional)<input name="due" type="datetime-local"></label><button>Assign to group</button>';
    const fields = form.elements;
    for (const [type, lab] of Object.entries(LAB_CATALOG))
      fields.course.add(new Option(lab.code, lab.code));
    function choices() {
      const [type, lab] = Object.entries(LAB_CATALOG).find(
        ([, l]) => l.code === fields.course.value,
      );
      form.querySelector("fieldset").hidden = fields.kind.value === "practice";
      form.querySelector(".exerciseChoices").innerHTML = (fields.kind.value === "project" ? PROJECTS.filter(p=>p.course===fields.course.value) : lab.exercises)
        .map(
          (x) =>
            `<label class="choice"><input type="${fields.kind.value === "project" ? "radio" : "checkbox"}" name="exercise" value="${esc(x.id)}">${esc(x.title)}</label>`,
        )
        .join("");
    }
    fields.course.onchange = fields.kind.onchange = choices;
    choices();
    form.onsubmit = async (e) => {
      e.preventDefault();
      const button = form.querySelector("button");
      button.disabled = true;
      try {
        await act({
          action: "assign",
          groupId: group.id,
          title: fields.title.value,
          course: fields.course.value,
          kind: fields.kind.value,
          lab: Object.entries(LAB_CATALOG).find(
            ([, l]) => l.code === fields.course.value,
          )[0],
          exercises: [...form.querySelectorAll("[name=exercise]:checked")].map(
            (x) => x.value,
          ),
          due: fields.due.value
            ? new Date(fields.due.value).toISOString()
            : null,
        });
        await load();
      } catch {
      } finally {
        button.disabled = false;
      }
    };
    return form;
  }
  async function load() {
    try {
      const data = await act({ action: "load" });
      $("createGroup").hidden = !data.instructor;
      if ($("instructorTools")) $("instructorTools").hidden = !data.instructor;
      $("healthPanel").hidden = !data.instructor;
      if (data.instructor) {
        const alerts = data.health.filter((x) => x.alert);
        $("healthTitle").textContent = alerts.length
          ? `Attention: ${alerts.length} recurring issues`
          : "Site health · last hour";
        $("healthTitle").setAttribute(
          "role",
          alerts.length ? "alert" : "status",
        );
        $("healthList").innerHTML = data.health.length
          ? data.health
              .map(
                (x) =>
                  `<p class="${x.alert ? "healthAlert" : ""}">${esc(x.kind)} · ${esc(x.page)} · ${x.count} reports ${x.alert ? "— investigate" : ""}</p>`,
              )
              .join("")
          : "No reported errors in the last hour. Browser reports require an active connection.";
      }
      $("groups").replaceChildren();
      for (const g of data.groups) {
        const card = document.createElement("section");
        card.className = "learningCard";
        card.innerHTML = `<h2>${esc(g.name)}</h2><p>${g.members} ${g.owned ? "members" : "membership"} · Personal practice, not verified grades</p>`;
        if (g.owned) {
          const code = document.createElement("p");
          code.textContent = "Join code: " + g.join_code;
          code.className = "joinCode";
          card.append(code);
          const copy = document.createElement("button");
          copy.textContent = "Copy join code";
          copy.onclick = async () => {
            try {
              await navigator.clipboard.writeText(g.join_code);
              copy.textContent = "Copied";
            } catch {
              copy.textContent = "Select the join code above to copy it.";
            }
          };
          card.append(copy);
          const details = document.createElement("details");
          details.innerHTML = "<summary>Create assignment</summary>";
          details.append(assignmentForm(g));
          card.append(details);
        }
        for (const a of g.assignments) {
          const section = document.createElement("article");
          section.className = "assignment";
          section.id="assignment-"+a.id;
          section.innerHTML = `<h3>${esc(a.title)}</h3><p>${esc(a.courses.code)} · ${esc(a.kind)} ${a.due_at ? "· Due " + esc(new Date(a.due_at).toLocaleString()) : ""}</p>`;
          if (!g.owned) {
            const link = document.createElement("a");
            link.href =
              a.kind === "project" ? "/submissions.html?assignment="+a.id+"&exercise="+a.exercise_keys[0] : a.kind === "practice"
                ? "/?course=" + encodeURIComponent(a.courses.code) + "&mode=practice"
                : LAB_CATALOG[a.lab_type]?.url || "/";
            link.textContent = "Open practice →";
            section.append(link);
            if (a.kind === "lab") {
              const names = a.exercise_keys.map(
                (k) =>
                  LAB_CATALOG[a.lab_type]?.exercises.find((e) => e.id === k)
                    ?.title || k,
              );
              const p = document.createElement("p");
              p.textContent = "Assigned exercises: " + names.join(", ");
              section.append(p);
            }
          }
          const table = document.createElement("table");
          table.innerHTML =
            '<caption>Practice completion</caption><thead><tr><th scope="col">Student</th><th scope="col">Progress</th><th scope="col">Status</th></tr></thead><tbody>' +
            a.progress
              .map(
                (p) =>
                  `<tr><th scope="row">${esc(p.name)}</th><td>${esc(I18n.t(p.label))}</td><td>${p.state ? I18n.t(p.label) : p.done ? "Complete" : a.due_at && Date.now() > new Date(a.due_at) ? "Overdue" : "In progress"}</td></tr>`,
              )
              .join("") +
            "</tbody>";
          const scroll=document.createElement("div");scroll.className="tableScroll";scroll.tabIndex=0;scroll.setAttribute("role","region");scroll.setAttribute("aria-label",I18n.t("Practice completion"));scroll.append(table);section.append(scroll);
          card.append(section);
        }
        if (!g.assignments.length) card.append("No assignments yet.");
        if (g.owned && g.topics.length) {
          const details = document.createElement("details");
          details.innerHTML =
            "<summary>Group learning gaps (historical practice)</summary>" +
            g.topics
              .map(
                (t) =>
                  `<p>${esc(t.name)}: ${t.pct}% (${t.total} answers${t.total < 3 ? "; limited evidence" : ""})</p>`,
              )
              .join("");
          card.append(details);
        }
        $("groups").append(card);
      }
      if (!data.groups.length)
        $("groups").textContent =
          "No groups yet. Join using an instructor’s code.";
    } catch {}
  }
  await load();
  let busy = false;
  setInterval(async () => {
    if (document.hidden || busy) return;
    busy = true;
    try {
      const data = await Tamareen.api("/api/classrooms", { action: "load" });
      if (data.instructor) {
        const alerts = data.health.filter((x) => x.alert);
        $("healthTitle").textContent = alerts.length
          ? `Attention: ${alerts.length} recurring issues`
          : "Site health · last hour";
        $("healthTitle").setAttribute(
          "role",
          alerts.length ? "alert" : "status",
        );
        $("healthList").textContent =
          data.health
            .map((x) => `${x.kind} · ${x.page}: ${x.count} reports`)
            .join("\n") || "No reported errors in the last hour.";
      }
    } catch {
    } finally {
      busy = false;
    }
  }, 60000);
})();
