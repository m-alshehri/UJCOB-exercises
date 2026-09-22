(async () => {
  const host = document.getElementById("notificationList"),
    status = document.getElementById("notificationStatus"),
    all = document.getElementById("readAll");
  let data;
  const label = (e) =>
    I18n.t(
      e.kind === "assignment"
        ? "New assignment"
        : e.kind === "needs_revision"
          ? "Revision requested"
          : "Instructor feedback",
    );
  function draw() {
    const t = I18n.t,
      esc = Tamareen.escape;
    status.textContent = data.events.length
      ? t("Your notifications")
      : t("No notifications yet.");
    all.hidden = !data.events.some((e) => !e.read);
    host.innerHTML = data.events
      .map(
        (e) =>
          `<article class="learningCard ${e.read ? "" : "notificationUnread"}"><h2>${label(e)}</h2><p>${esc(e.title || (I18n.lang === "ar" ? PROJECTS.find((p) => p.id === e.project)?.ar : PROJECTS.find((p) => p.id === e.project)?.title) || e.project)}</p><p>${esc(e.group || "")} · ${new Date(e.at).toLocaleString(I18n.lang)}</p><div class="actions"><a href="${esc(Tamareen.internalPath(e.href))}">${t("Open activity")} →</a>${e.read ? "<span>" + t("Read") + "</span>" : `<button data-read="${esc(e.key)}">${t("Mark as read")}</button>`}</div></article>`,
      )
      .join("");
    host
      .querySelectorAll("[data-read]")
      .forEach((b) => (b.onclick = () => mark([b.dataset.read])));
  }
  async function mark(keys) {
    all.disabled = true;
    host.querySelectorAll("button").forEach((b) => (b.disabled = true));
    try {
      for (let n = 0; n < keys.length; n += 100)
        await Tamareen.checked(
          Tamareen.client()
            .from("notification_reads")
            .upsert(
              keys
                .slice(n, n + 100)
                .map((key) => ({ user_id: data.userId, event_key: key })),
              { onConflict: "user_id,event_key", ignoreDuplicates: true },
            ),
        );
      data.events.forEach((e) => {
        if (keys.includes(e.key)) e.read = true;
      });
      draw();
    } catch (err) {
      status.textContent = err.message;
      host.querySelectorAll("button").forEach((b) => (b.disabled = false));
    } finally {
      all.disabled = false;
    }
  }
  all.onclick = () =>
    mark(data.events.filter((e) => !e.read).map((e) => e.key));
  try {
    data = await Tamareen.api("/api/journey", { action: "notifications" });
    draw();
    window.addEventListener("languagechange", draw);
  } catch (err) {
    status.textContent = err.message;
  }
})();
