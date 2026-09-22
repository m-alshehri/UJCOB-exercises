(async () => {
  const host = document.getElementById("todayContent"),
    status = document.getElementById("todayStatus");
  try {
    const s = await Tamareen.session(true),
      db = Tamareen.client();
    const results = await Promise.allSettled([
      Tamareen.all(() =>
        db
          .from("attempts")
          .select("id,started_at,courses(code)")
          .eq("user_id", s.user.id)
          .eq("mode", "practice")
          .is("completed_at", null)
          .order("started_at", { ascending: false })
          .order("id"),
      ),
      Learning.history(),
      Tamareen.api("/api/classrooms", { action: "load" }),
      Tamareen.all(() =>
        db
          .from("lab_drafts")
          .select("lab_type,exercise_key,updated_at")
          .eq("user_id", s.user.id)
          .order("updated_at", { ascending: false })
          .order("exercise_key"),
      ),
    ]);
    const [attempts, answers, classroom, drafts] = results.map((r, i) =>
      r.status === "fulfilled" ? r.value : i === 2 ? { groups: [] } : [],
    );
    function draw() {
      const t = I18n.t,
        e = Tamareen.escape,
        ar = I18n.lang === "ar";
      status.textContent = results.some((r) => r.status === "rejected")
        ? t("Some activities could not load. Refresh to retry.")
        : t("Your next step, reviews and assignments in one place.");
      const due = Pathways.schedule(answers).filter((q) => q.due),
        assignments = classroom.groups
          .filter((g) => !g.owned)
          .flatMap((g) => g.assignments.map((a) => ({ ...a, group: g.name })))
          .filter((a) => !a.progress[0]?.done)
          .sort((a, b) =>
            (a.due_at || "9999").localeCompare(b.due_at || "9999"),
          );
      const assignmentHref = (a) =>
        a.kind === "project"
          ? "/submissions.html?assignment=" +
            a.id +
            "&exercise=" +
            a.exercise_keys[0]
          : a.kind === "lab"
            ? (LAB_CATALOG[a.lab_type]?.url || "/labs.html") +
              "?exercise=" +
              encodeURIComponent(a.exercise_keys[0])
            : "/?course=" +
              encodeURIComponent(a.courses.code) +
              "&mode=practice";
      const latestLab = drafts[0],
        latestQuiz = attempts[0];
      const resume =
        latestLab &&
        (!latestQuiz || latestLab.updated_at > latestQuiz.started_at)
          ? {
              href:
                "/" +
                latestLab.lab_type +
                ".html?exercise=" +
                encodeURIComponent(latestLab.exercise_key),
              title: t("Continue your last lab draft"),
            }
          : latestQuiz
            ? {
                href: "/?resume=" + latestQuiz.id,
                title: t("Continue your practice"),
              }
            : null;
      const code =
          Learning.profile(answers).find((p) => p.state !== "strong")?.code ||
          "BCIS 313",
        next = Pathways.progress(code, answers).find((p) => !p.strong);
      const recommendation = {
        href: "/pathways.html?course=" + encodeURIComponent(code),
        title: next
          ? code + " · " + (ar ? next.ar : next.name)
          : t("Choose your next learning path"),
      };
      const urgent = assignments.find(
        (a) =>
          a.progress[0]?.state !== "submitted" &&
          a.due_at &&
          new Date(a.due_at).getTime() < Date.now() + 2 * 86400000,
      );
      const primary = urgent
        ? { href: assignmentHref(urgent), title: urgent.title }
        : resume ||
          (due.length
            ? { href: "/review.html", title: t("Review due questions") }
            : recommendation);
      host.innerHTML = `<section class="learningCard"><p class="eyebrow">${t("Recommended now")}</p><h2>${e(primary.title)}</h2><a class="primaryAction" href="${e(primary.href)}">${t("Start now")} →</a></section><div class="todayGrid"><section class="learningCard"><h2>${t("Continue learning")}</h2>${resume ? `<p>${e(resume.title)}</p><a href="${e(resume.href)}">${t("Continue")} →</a>` : `<p>${t("No unfinished activities.")}</p><a href="/pathways.html">${t("Learning paths")} →</a>`}</section><section class="learningCard"><h2>${t("Due reviews")}</h2><p>${due.length} ${t("questions ready for review")}</p><a href="/review.html">${t("Review mistakes")} →</a></section><section class="learningCard"><h2>${t("Next learning step")}</h2><p>${e(recommendation.title)}</p><a href="${e(recommendation.href)}">${t("Learning paths")} →</a></section></div><section class="learningCard"><h2>${t("Your assignments")}</h2>${assignments.map((a) => `<article class="assignment"><h3>${e(a.title)}</h3><p>${e(a.group)} · ${t(a.progress[0]?.label || "Not started")}</p><p>${a.due_at ? `${t("Due")}: ${new Date(a.due_at).toLocaleString(I18n.lang)} ${Date.now() > new Date(a.due_at).getTime() ? " · " + t("Overdue") : ""}` : t("No due date")}</p><a href="${e(assignmentHref(a))}">${t("Open activity")} →</a></article>`).join("") || "<p>" + t("No pending assignments.") + "</p>"}</section><p><a href="/notifications.html">${t("Notifications")} →</a></p>`;
    }
    draw();
    window.addEventListener("languagechange", draw);
  } catch (err) {
    status.textContent = err.message;
  }
})();
