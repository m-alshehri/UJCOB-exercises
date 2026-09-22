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

window.addEventListener("resize", () => {
  if (innerWidth > 960) closeMobileNav();
});
async function syncHeader() {
  try {
    const session = await Tamareen.session();
    const b = document.getElementById("authHeader");
    if (!b) return;
    b.textContent = session ? "Logout" : "Login";
    const accountLabel = document.getElementById("accountLabel");
    if (accountLabel)
      accountLabel.textContent = session ? "Account" : "Sign in";
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

// Accessible disclosure navigation shared by legacy and shared-shell pages.
(() => {
  const nav = document.querySelector(".head>.nav");
  const actions = document.querySelector(".headerActions");
  if (!nav || !actions) return;
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "/styles/navigation.css";
  document.head.append(style);
  document.querySelector("header").classList.add("siteNavigation");
  nav.id = "primaryNavigation";
  nav.setAttribute("aria-label", "Main navigation");
  nav.replaceChildren();
  const groups = [
    [
      "learn",
      "Learn",
      [
        ["/", "Courses", "Practice and assessments"],
        ["/pathways.html", "Learning paths", "Step-by-step learning"],
        ["/labs.html", "Labs", "Hands-on practice"],
        ["/projects.html", "Projects", "Course projects"],
        ["/resources.html", "Resources", "References and resources"],
      ],
    ],
    [
      "follow",
      "My learning",
      [
        ["/today.html", "My learning today", "Your next activity"],
        ["/dashboard.html", "My Progress", "Results and skills"],
        ["/review.html", "Review mistakes", "Questions to revisit"],
      ],
    ],
    [
      "classroom",
      "Classroom",
      [
        ["/classrooms.html", "Groups & assignments", "Groups and deadlines"],
        ["/submissions.html", "Submissions & feedback", "Work and feedback"],
      ],
    ],
  ];
  function disclosure(id, label, container) {
    const group = document.createElement("div");
    group.className = "navigationGroup";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "navigationTrigger";
    button.id = id + "Trigger";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", id + "Panel");
    const text = document.createElement("span");
    text.textContent = label;
    button.append(text);
    const arrow = document.createElement("span");
    arrow.className = "navigationChevron";
    arrow.textContent = "⌄";
    arrow.setAttribute("aria-hidden", "true");
    button.append(arrow);
    const panel = document.createElement("div");
    panel.id = id + "Panel";
    panel.className = "navigationPanel";
    panel.hidden = true;
    group.append(button, panel);
    container.append(group);
    button.addEventListener("click", () => {
      const open = panel.hidden;
      closeDisclosures();
      if (open) {
        panel.hidden = false;
        button.setAttribute("aria-expanded", "true");
      }
    });
    return { group, button, panel, text };
  }
  function addGroup([id, label, links], instructor = false) {
    const group = disclosure(id, label, nav);
    if (instructor) group.group.dataset.instructorGroup = "true";
    for (const [href, title, description] of links) {
      const a = document.createElement("a");
      a.href = href;
      a.className = "navlink";
      if (instructor) a.dataset.instructorLink = "true";
      const strong = document.createElement("strong");
      strong.textContent = title;
      a.append(strong);
      if (description) {
        const small = document.createElement("small");
        small.textContent = description;
        a.append(small);
      }
      a.addEventListener("click", () => {
        closeDisclosures();
        closeMobileNav();
      });
      group.panel.append(a);
    }
    return group;
  }
  function closeDisclosures() {
    for (const button of document.querySelectorAll(".navigationTrigger")) {
      button.setAttribute("aria-expanded", "false");
      document.getElementById(button.getAttribute("aria-controls")).hidden =
        true;
    }
  }
  groups.forEach((g) => addGroup(g));
  const account = disclosure("account", "Sign in", actions);
  account.group.classList.add("accountNavigation");
  account.text.id = "accountLabel";
  const auth = document.getElementById("authHeader");
  if (auth) {
    auth.className = "navlink";
    account.panel.append(auth);
  }
  const github = document.querySelector(".headerActions .gh");
  if (github) {
    github.className = "navlink githubLink";
    github.textContent = "GitHub ↗";
    github.setAttribute("aria-label", "GitHub repository");
    account.panel.append(github);
  }
  const bell = document.createElement("a");
  bell.href = "/notifications.html";
  bell.className = "notificationLink";
  bell.setAttribute("aria-label", "Notifications");
  bell.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>';
  actions.prepend(bell);
  const toggle = document.getElementById("menuToggle");
  toggle?.setAttribute("aria-controls", nav.id);
  if (toggle) actions.append(toggle);
  function mark() {
    for (const a of nav.querySelectorAll("a")) {
      const href = a.getAttribute("href"),
        path = location.pathname;
      const active =
        href === path ||
        (href === "/" &&
          (path === "/index.html" || path.startsWith("/courses/"))) ||
        (href === "/labs.html" && /-lab\.html$/.test(path));
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
    for (const group of nav.querySelectorAll(".navigationGroup"))
      group
        .querySelector("button")
        .classList.toggle(
          "hasCurrentPage",
          !!group.querySelector("[aria-current=page]"),
        );
  }
  mark();
  window.addEventListener("popstate", mark);
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".navigationGroup")) closeDisclosures();
  });
  document.addEventListener("focusin", (e) => {
    if (!e.target.closest(".navigationGroup")) closeDisclosures();
  });
  document.addEventListener("keydown", (e) => {
    const group = document.activeElement?.closest(".navigationGroup");
    if (e.key === "Escape") {
      const open = group?.querySelector(
        ".navigationTrigger[aria-expanded=true]",
      );
      if (open) {
        e.preventDefault();
        closeDisclosures();
        open.focus();
      } else if (nav.classList.contains("open")) {
        closeDisclosures();
        closeMobileNav();
        toggle?.focus();
      } else closeDisclosures();
    }
    if (
      e.key === "ArrowDown" &&
      document.activeElement?.matches(".navigationTrigger")
    ) {
      e.preventDefault();
      const button = document.activeElement;
      closeDisclosures();
      button.setAttribute("aria-expanded", "true");
      const panel = document.getElementById(
        button.getAttribute("aria-controls"),
      );
      panel.hidden = false;
      panel.querySelector("a,button")?.focus();
    }
  });
  window.addEventListener("resize", closeDisclosures);
  toggle?.addEventListener("click", closeDisclosures);
  const main = document.querySelector("main");
  if (main) {
    main.id ||= "main";
    main.tabIndex = -1;
  }
  let roleVersion = 0;
  async function roleLinks() {
    const version = ++roleVersion;
    nav.querySelector("[data-instructor-group]")?.remove();
    try {
      if (!(await Tamareen.session())) return;
      const data = await Tamareen.api("/api/journey", { action: "role" });
      if (version !== roleVersion) return;
      if (data.instructor)
        addGroup(
          [
            "teach",
            "Teaching",
            [
              ["/instructor.html", "Instructor dashboard"],
              ["/content-studio.html", "Content studio"],
              ["/question-quality.html", "Question quality"],
            ],
          ],
          true,
        );
      mark();
    } catch {
      /* Destination pages enforce their own server-side permissions. */
    }
  }
  roleLinks();
  Tamareen.client().auth.onAuthStateChange(() => setTimeout(roleLinks, 0));
})();
