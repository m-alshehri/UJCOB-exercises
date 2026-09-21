(() => {
  const last = new Map();
  Tamareen.report = async (kind) => {
    if (Date.now() - (last.get(kind) || 0) < 15000) return;
    last.set(kind, Date.now());
    try {
      const s = await Tamareen.session();
      if (!s) return;
      const page = location.pathname.startsWith("/courses/")
        ? "/courses/"
        : location.pathname.replace(/[^a-zA-Z0-9/._-]/g, "").slice(0, 60);
      await Tamareen.client().rpc("record_health_event", {
        p_kind: kind,
        p_page: page,
      });
    } catch {
      /* Monitoring must never interrupt practice. */
    }
  };
  window.addEventListener("error", () => Tamareen.report("page_error"));
  window.addEventListener("unhandledrejection", () =>
    Tamareen.report("page_error"),
  );
})();
