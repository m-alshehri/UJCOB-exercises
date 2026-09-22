/* Shared browser services. Personal practice results are not verified grades. */
window.Tamareen = (() => {
  let instance;
  function client() {
    if (!instance)
      instance = supabase.createClient(
        TAMAREEN_SUPABASE_URL,
        TAMAREEN_SUPABASE_PUBLISHABLE_KEY,
      );
    window.supabaseClient = instance;
    return instance;
  }
  function internalPath(value, fallback = "/today.html") {
    try {
      const url = new URL(value || fallback, location.origin);
      return url.origin === location.origin && !String(value).includes("\\")
        ? url.pathname + url.search + url.hash
        : fallback;
    } catch {
      return fallback;
    }
  }
  async function session(required = false) {
    const { data, error } = await client().auth.getSession();
    if (error) throw error;
    if (!data.session && required) {
      location.href =
        "/login.html?next=" +
        encodeURIComponent(location.pathname + location.search);
      throw new Error("Sign in to save your progress.");
    }
    return data.session;
  }
  function escape(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function shuffle(values) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  async function checked(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  async function all(makeQuery) {
    const result = [];
    for (let from = 0; ; from += 500) {
      const rows = await checked(makeQuery().range(from, from + 499));
      result.push(...rows);
      if (rows.length < 500) return result;
    }
  }
  function status(message, state = "info", retry) {
    let el = document.getElementById("saveStatus");
    if (!el) {
      el = document.createElement("div");
      el.id = "saveStatus";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      (document.querySelector("main") || document.body).prepend(el);
    }
    el.className = "saveStatus " + state;
    el.replaceChildren(document.createTextNode(message));
    if (retry) {
      const b = document.createElement("button");
      b.textContent = "Retry saving";
      b.onclick = retry;
      el.append(" ", b);
    }
  }
  async function api(path, body) {
    const s = await session(true);
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + s.access_token,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }
  return {
    client,
    internalPath,
    session,
    escape,
    shuffle,
    checked,
    all,
    status,
    api,
  };
})();
