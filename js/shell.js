document.getElementById("siteHeader")?.replaceWith(
  Object.assign(document.createElement("div"), {
    innerHTML:
      '<header><div class="head"><a class="brandwrap" href="/" aria-label="Tamareen home"><div class="mark" aria-label="Tamareen logo"><svg class="brandLogo" viewBox="0 0 64 64" role="img" aria-hidden="true"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#83ccea"/><stop offset="1" stop-color="#28a9dc"/></linearGradient></defs><path fill="#004f6e" d="M9 10h38c3 0 5 2 5 5v5c0 3-2 5-5 5H35v26c0 3-2 5-5 5h-5c-3 0-5-2-5-5V25H9c-3 0-5-2-5-5v-5c0-3 2-5 5-5z"/><path d="M23 36l9 9 21-23" fill="none" stroke="url(#tg)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="brand">tamareen<span>Interactive learning & self-assessment</span></div></a><nav class="nav"><a class="navlink" href="/">Courses</a><a class="navlink" href="/resources.html">Resources</a><a class="navlink" href="/dashboard.html">My Progress</a><a class="navlink" href="/review.html">Review mistakes</a><a class="navlink" href="/projects.html">Projects</a><a class="navlink" href="/classrooms.html">Groups</a></nav><div class="headerActions"><a class="gh" href="https://github.com/m-alshehri/UJCOB-exercises" target="_blank" rel="noopener" aria-label="GitHub repository"><svg viewBox="0 0 24 24"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.2c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.28-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"/></svg></a><a class="authHeader" id="authHeader" href="/login.html">Login</a><button class="menuToggle" id="menuToggle" aria-label="Open navigation" aria-expanded="false" onclick="toggleMobileNav()">\u2630</button></div></div></header>',
  }),
);
document.getElementById("siteFooter")?.replaceWith(
  Object.assign(document.createElement("div"), {
    innerHTML:
      '<footer><div class="foot"><div><div class="footbrand"><div class="mark" aria-label="Tamareen logo"><svg class="brandLogo" viewBox="0 0 64 64" role="img" aria-hidden="true"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#83ccea"/><stop offset="1" stop-color="#28a9dc"/></linearGradient></defs><path fill="#004f6e" d="M9 10h38c3 0 5 2 5 5v5c0 3-2 5-5 5H35v26c0 3-2 5-5 5h-5c-3 0-5-2-5-5V25H9c-3 0-5-2-5-5v-5c0-3 2-5 5-5z"/><path d="M23 36l9 9 21-23" fill="none" stroke="url(#tg)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div>tamareen<small>Interactive learning & self-assessment</small></div></div><div class="credit">tamareen.online \u00b7 Learn by doing.</div></div><div class="footcol"><h4>LEARNING</h4><a href="/">Courses</a><a href="/resources.html">Resources</a><a href="/python-lab.html">Python Coding Lab</a><a href="/sql-lab.html">SQL Coding Lab</a></div><div class="footcol"><h4>PROJECT</h4><a href="https://github.com/m-alshehri/UJCOB-exercises" target="_blank" rel="noopener">GitHub Repository</a><a href="/resources.html">Course References</a><a href="/">Interactive Practice</a></div></div></footer>',
  }),
);
function closeMobileNav() {
  document.querySelector(".head>.nav")?.classList.remove("open");
  document.getElementById("drawerBackdrop")?.classList.remove("open");
  document.body.classList.remove("drawerOpen");
  const b = document.getElementById("menuToggle");
  if (b) {
    b.setAttribute("aria-expanded", "false");
    b.textContent = "☰";
  }
}
function toggleMobileNav() {
  const n = document.querySelector(".head>.nav");
  if (!n) return;
  const open = !n.classList.contains("open");
  n.classList.toggle("open", open);
  document.getElementById("drawerBackdrop")?.classList.toggle("open", open);
  document.body.classList.toggle("drawerOpen", open);
  const b = document.getElementById("menuToggle");
  b?.setAttribute("aria-expanded", String(open));
  if (b) b.textContent = open ? "×" : "☰";
}
document
  .querySelectorAll(".head>.nav a")
  .forEach((a) => a.addEventListener("click", closeMobileNav));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMobileNav();
});
window.addEventListener("resize", () => {
  if (innerWidth > 720) closeMobileNav();
});
async function syncHeader() {
  try {
    const session = await Tamareen.session();
    const b = document.getElementById("authHeader");
    if (!b) return;
    b.textContent = session ? "Logout" : "Login";
    if (b.tagName === "A") b.href = session ? "#" : "/login.html";
    b.onclick = async (e) => {
      e.preventDefault();
      if (session) {
        try {
          await Tamareen.checked(Tamareen.client().auth.signOut());
          location.href = "/";
        } catch {
          Tamareen.status("Could not sign out. Please try again.", "error");
        }
      } else location.href = "/login.html";
    };
  } catch {
    Tamareen.status(
      "Account connection unavailable. Refresh to try again.",
      "error",
    );
  }
}
syncHeader();
Tamareen.client().auth.onAuthStateChange(() => setTimeout(syncHeader, 0));
if (/-lab\.html$/.test(location.pathname))
  Tamareen.session(true).catch((e) => Tamareen.status(e.message, "error"));
// Existing visual cards remain keyboard operable while preserving their design.
function enableCards() {
  document
    .querySelectorAll(
      "div.course[onclick],div.opt[onclick],.mode[onclick],#codingMode,.continueCard",
    )
    .forEach((el) => {
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      el.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          el.click();
        }
      };
    });
}
new MutationObserver(enableCards).observe(document.body, {
  childList: true,
  subtree: true,
});
enableCards();

const skip = document.createElement("a");
skip.href = "#main";
skip.className = "skipLink";
skip.textContent = "Skip to content";
document.body.prepend(skip);
document.querySelectorAll("canvas").forEach((c) => {
  c.setAttribute("role", "img");
  c.setAttribute("aria-label", "Chart. Equivalent data is listed below.");
});
