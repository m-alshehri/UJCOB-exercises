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
  // Delegated click handling for [data-action] elements, so markup needs no
  // inline handlers. Each handler receives the clicked element.
  function actions(handlers, root = document) {
    root.addEventListener("click", (event) => {
      const el = event.target.closest?.("[data-action]");
      if (el && Object.hasOwn(handlers, el.dataset.action))
        handlers[el.dataset.action](el, event);
    });
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
    if (!response.ok) {
      if (response.status >= 500) window.Tamareen?.report?.("page_error");
      throw new Error(data.error || "Request failed.");
    }
    return data;
  }
  function confetti() {
    try {
      const canvas = document.createElement("canvas");
      canvas.id = "tamareenConfetti";
      canvas.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:999999;";
      document.body.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colors = ["#28a9dc", "#004f6e", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#6366f1"];
      const particles = Array.from({ length: 90 }, () => ({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.45 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -12 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        alpha: 1,
      }));
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35;
          p.rotation += p.vRot;
          if (elapsed > 1200) p.alpha = Math.max(0, 1 - (elapsed - 1200) / 1000);
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          ctx.restore();
        });
        if (elapsed < 2400) {
          requestAnimationFrame(step);
        } else {
          canvas.remove();
        }
      }
      requestAnimationFrame(step);
    } catch {}
  }
  function streakKey(uid = "guest") {
    return "tamareen:streak:" + uid;
  }
  function getStreak(uid = "guest") {
    try {
      const raw = localStorage.getItem(streakKey(uid));
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (!raw) return { streak: 0, lastDate: "", todayCount: 0, todayDate: today, goal: 5 };
      const data = JSON.parse(raw);
      if (data.lastDate && data.lastDate !== today && data.lastDate !== yesterday) {
        data.streak = 0;
      }
      if (data.todayDate !== today) {
        data.todayCount = 0;
        data.todayDate = today;
      }
      data.goal = data.goal || 5;
      return data;
    } catch {
      return { streak: 0, lastDate: "", todayCount: 0, todayDate: new Date().toISOString().slice(0, 10), goal: 5 };
    }
  }
  function recordActivity(uid = "guest", count = 1) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const data = getStreak(uid);
      if (data.lastDate === yesterday) {
        data.streak = (data.streak || 0) + 1;
      } else if (data.lastDate !== today) {
        data.streak = 1;
      }
      data.lastDate = today;
      data.todayDate = today;
      data.todayCount = (data.todayCount || 0) + count;
      localStorage.setItem(streakKey(uid), JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("tamareen:streak-updated", { detail: data }));
      return data;
    } catch {
      return { streak: 1, lastDate: "", todayCount: 1, goal: 5 };
    }
  }
  return {
    client,
    internalPath,
    session,
    escape,
    actions,
    shuffle,
    checked,
    all,
    status,
    api,
    confetti,
    getStreak,
    recordActivity,
  };
})();
