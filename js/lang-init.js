// Runs in <head> before first paint so RTL pages do not flash as LTR.
// Mirrors the language choice in i18n.js.
(() => {
  let lang;
  try {
    lang = localStorage.getItem("tamareen:language");
  } catch {}
  if (!["ar", "en"].includes(lang))
    lang = (navigator.language || "").startsWith("ar") ? "ar" : "en";
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
})();
