window.I18n = (() => {
  // Arabic strings live in content/i18n-ar.json (generated into js/i18n-ar.js).
  const dictionary = window.I18N_AR || {};
  let lang;
  try {
    lang = localStorage.getItem("tamareen:language");
  } catch {}
  if (!["ar", "en"].includes(lang))
    lang = navigator.language.startsWith("ar") ? "ar" : "en";
  const normalize = (s) => s.replace(/\s+/g, " ").trim();
  function translate(s) {
    const key = normalize(s);
    if (dictionary[key]) return dictionary[key];
    if (key.includes(" · "))
      return key
        .split(" · ")
        .map((part) => dictionary[part] || part)
        .join(" · ");
    if (key.endsWith(" →") && dictionary[key.slice(0, -2)])
      return dictionary[key.slice(0, -2)] + " ←";
    if (key.endsWith(" · tamareen"))
      return (dictionary[key.slice(0, -11)] || key.slice(0, -11)) + " · تمارين";
    const patterns = [
      [/^Question (\d+) of (\d+)$/i, (_, a, b) => `السؤال ${a} من ${b}`],
      [/^QUESTION (\d+) OF (\d+)$/, (_, a, b) => `السؤال ${a} من ${b}`],
      [/^Exercise (\d+) of (\d+)$/, (_, a, b) => `التمرين ${a} من ${b}`],
      [/^Solved: (.*)$/, (_, a) => `المكتمل: ${a}`],
      [/^Score: (.*)$/, (_, a) => `النتيجة: ${a}`],
      [/^Time left: (.*)$/, (_, a) => `الوقت المتبقي: ${a}`],
      [/^(\d+) questions$/, (_, a) => `${a} أسئلة`],
      [
        /^You scored (.*)\. Personal practice result, not a verified grade\.$/,
        (_, a) => `نتيجتك ${a}. نتيجة تدريب شخصية وليست درجة معتمدة.`,
      ],
    ];
    for (const [re, fn] of patterns)
      if (re.test(key)) return key.replace(re, fn);
    return s;
  }
  const t = (s) => (lang === "ar" ? translate(String(s)) : String(s)),
    nodes = new WeakMap(),
    attrs = new WeakMap();
  let pending = false;
  const ignored = (el) =>
    el?.closest(
      'script,style,pre,code,textarea,svg,iframe,[translate="no"],#qtext,.opt,#termText',
    );
  function render() {
    observer.disconnect();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    let node;
    while ((node = walker.nextNode())) {
      if (ignored(node.parentElement) || !node.nodeValue.trim()) continue;
      let state = nodes.get(node);
      if (!state || node.nodeValue !== state.last)
        state = { original: node.nodeValue };
      const translated = t(state.original);
      if (node.nodeValue !== translated) node.nodeValue = translated;
      state.last = translated;
      nodes.set(node, state);
    }
    for (const el of document.querySelectorAll(
      '[placeholder],[aria-label],input[type="submit"]',
    )) {
      if (ignored(el)) continue;
      let map = attrs.get(el) || {};
      for (const a of [
        "placeholder",
        "aria-label",
        ...(el.matches('input[type="submit"]') ? ["value"] : []),
      ]) {
        const value = el.getAttribute(a);
        if (value === null) continue;
        let v = map[a];
        if (!v || value !== v.last) v = { original: value };
        v.last = t(v.original);
        if (value !== v.last) el.setAttribute(a, v.last);
        map[a] = v;
      }
      attrs.set(el, map);
    }
    const btn = document.getElementById("languageToggle");
    if (btn) {
      btn.textContent = lang === "ar" ? "English" : "العربية";
      btn.setAttribute(
        "aria-label",
        lang === "ar" ? "Switch to English" : "التبديل إلى العربية",
      );
    }
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    pending = false;
  }
  const observer = new MutationObserver(() => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(render);
    }
  });
  function init() {
    const button = document.createElement("button");
    button.id = "languageToggle";
    button.type = "button";
    button.setAttribute("translate", "no");
    button.onclick = () => {
      lang = lang === "ar" ? "en" : "ar";
      try {
        localStorage.setItem("tamareen:language", lang);
      } catch {}
      render();
      window.dispatchEvent(new Event("languagechange"));
    };
    (
      document.querySelector(".headerActions") ||
      document.querySelector("header") ||
      document.body
    ).append(button);
    render();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
  return {
    t,
    get lang() {
      return lang;
    },
    dictionary,
  };
})();
