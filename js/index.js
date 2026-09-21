const $ = (id) => document.getElementById(id),
  shuffle = Tamareen.shuffle;
const ICONS = {
  "BCIS 313":
    '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python">',
  "BCIS 324": '<img src="/assets/sap.svg" alt="SAP">',
  "BCIS 317":
    '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg" alt="HTML5">',
  "BCIS 411":
    '<img src="https://cdn.jsdelivr.net/gh/microsoft/PowerBI-Icons@main/SVG/Power-BI.svg" alt="Power BI">',
  "BCIS 421":
    '<div class="dual"><img src="/assets/excel.svg" alt="Excel"><img src="/assets/google-sheets.svg" alt="Google Sheets"></div>',
  "BCIS 311":
    '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg" alt="MySQL">',
};
const SLUGS = {
    "BCIS 313": "bcis313",
    "BCIS 324": "bcis324",
    "BCIS 317": "bcis317",
    "BCIS 411": "bcis411",
    "BCIS 421": "bcis421",
    "BCIS 311": "bcis311",
  },
  FROM_SLUG = Object.fromEntries(Object.entries(SLUGS).map(([k, v]) => [v, k]));
function routeFor(c, section = "") {
  return "/courses/" + SLUGS[c] + (section ? "/" + section : "");
}
function pushRoute(path) {
  if (location.pathname !== path) history.pushState({}, "", path);
}
let active = "",
  modeCourse = "",
  questions = [],
  idx = 0,
  score = 0,
  selected = null,
  locked = false,
  attemptStart = 0,
  attemptId = null,
  quizMode = "practice",
  examTimerId = null,
  examSeconds = Math.max(
    0,
    Math.ceil((attemptStart + 600000 - Date.now()) / 1000),
  );
function renderGrid() {
  $("grid").innerHTML = Object.entries(COURSES)
    .map(
      ([c, v]) =>
        `<div class="course" onclick="chooseCourse('${c}')"><div class="courseTop"><div class="courseIcon">${ICONS[c] || "&lt;/&gt;"}</div><div class="code">${c}</div></div><h3>${v.name}</h3><div class="meta">${c === "BCIS 313" ? "Python · MCQ + Coding" : c === "BCIS 311" ? "SQL · MCQ + Coding" : c === "BCIS 324" ? "ERP systems" : c === "BCIS 317" ? "HTML · CSS · JavaScript · MCQ + Coding" : c === "BCIS 411" ? "Power BI · Business intelligence" : c === "BCIS 421" ? "Excel · Google Sheets · Analytics" : "Interactive practice"}</div></div>`,
    )
    .join("");
}
function hideAll() {
  ["home", "modes", "quiz"].forEach((x) => ($(x).style.display = "none"));
}
function chooseCourse(c) {
  showModes(c, true);
}
function showModes(c, push = false) {
  if (push) pushRoute(routeFor(c));
  modeCourse = c;
  hideAll();
  $("modes").style.display = "block";
  const py = c === "BCIS 313",
    sql = c === "BCIS 311",
    web = c === "BCIS 317",
    erp = c === "BCIS 324",
    bi = c === "BCIS 411",
    bda = c === "BCIS 421";
  $("modeTitle").textContent = c + " · " + COURSES[c].name;
  $("modeSub").textContent = "Choose how you want to practice.";
  $("mcqDesc").textContent =
    "10 random questions with immediate feedback and explanations.";
  const cm = $("codingMode");
  if (py || sql || web || erp || bi || bda) {
    cm.style.display = "block";
    $("codingTitle").textContent = py
      ? "Python Coding Lab"
      : sql
        ? "SQL Coding Lab"
        : web
          ? "Web Coding Lab"
          : erp
            ? "ERP Process Lab"
            : bi
              ? "BI Analytics Lab"
              : "Data Analytics Lab";
    $("codingDesc").textContent = py
      ? "Write and run Python code with automatic test cases."
      : sql
        ? "Write and execute SQL queries against a practice database."
        : web
          ? "Write HTML, CSS and JavaScript with a live preview and automatic task checks."
          : erp
            ? "Practice integrated ERP processes, shared data and implementation decisions."
            : bi
              ? "Practice KPIs, dashboards, visualization and BI analytics decisions."
              : "Practice data preparation, predictive analytics and model evaluation.";
    cm.onclick = () =>
      guardLab(
        py
          ? "/python-lab.html"
          : sql
            ? "/sql-lab.html"
            : web
              ? "/web-lab.html"
              : erp
                ? "/erp-lab.html"
                : bi
                  ? "/bi-lab.html"
                  : "/analytics-lab.html",
      );
  } else {
    cm.style.display = "none";
  }
}
async function requireAuth(next) {
  try {
    if (!window.supabaseClient) window.supabaseClient = Tamareen.client();
    const { data } = await window.supabaseClient.auth.getSession();
    if (data?.session) return true;
    location.href = "/login.html?next=" + encodeURIComponent(next);
    return false;
  } catch (e) {
    location.href = "/login.html?next=" + encodeURIComponent(next);
    return false;
  }
}
async function guardQuiz(mode) {
  const next =
    "/?course=" +
    encodeURIComponent(modeCourse) +
    "&mode=" +
    encodeURIComponent(mode);
  if (await requireAuth(next)) startQuiz(modeCourse, mode, "", false);
}
async function guardLab(path) {
  if (await requireAuth(path)) location.href = path;
}
function makeQ(q) {
  const options = shuffle([q.c, ...q.w]);
  return {
    id: q.id || null,
    q: q.q,
    options,
    answer: options.indexOf(q.c),
    explain: q.e,
    rationales: q.rationales || {},
    topic: q.topic || "General",
  };
}
const QUESTION_CACHE_TTL = 30 * 60 * 1000,
  questionMemoryCache = {};
let courseMapPromise = null;
function questionCacheKey(c) {
  return "tamareen:qcache:v3:" + c.replace(/\s+/g, "_");
}
function readQuestionCache(c) {
  if (
    questionMemoryCache[c] &&
    Date.now() - questionMemoryCache[c].savedAt < QUESTION_CACHE_TTL
  )
    return questionMemoryCache[c].data;
  try {
    const raw = sessionStorage.getItem(questionCacheKey(c));
    if (!raw) return null;
    const hit = JSON.parse(raw);
    if (Date.now() - hit.savedAt > QUESTION_CACHE_TTL) {
      sessionStorage.removeItem(questionCacheKey(c));
      return null;
    }
    questionMemoryCache[c] = hit;
    return hit.data;
  } catch (e) {
    return null;
  }
}
function writeQuestionCache(c, data) {
  questionMemoryCache[c] = { savedAt: Date.now(), data };
  try {
    sessionStorage.setItem(
      questionCacheKey(c),
      JSON.stringify({ savedAt: Date.now(), data }),
    );
  } catch (e) {}
}
async function getCourseMap() {
  if (courseMapPromise) return courseMapPromise;
  if (!window.supabaseClient) {
    window.supabaseClient = Tamareen.client();
  }
  courseMapPromise = window.supabaseClient
    .from("courses")
    .select("id,code")
    .then(({ data, error }) => {
      if (error) throw error;
      return Object.fromEntries((data || []).map((x) => [x.code, x.id]));
    })
    .catch((e) => {
      courseMapPromise = null;
      throw e;
    });
  return courseMapPromise;
}
async function loadQuestionsFromSupabase(c) {
  const cached = readQuestionCache(c);
  if (cached?.length) return cached;
  try {
    const courseMap = await getCourseMap(),
      courseId = courseMap[c];
    if (!courseId) return null;
    const { data, error } = await window.supabaseClient
      .from("questions")
      .select(
        "id,question,correct_answer,wrong_answers,explanation,option_explanations,question_kind,topics(name)",
      )
      .eq("course_id", courseId)
      .eq("is_active", true);
    if (error) throw error;
    const mapped = data?.length
      ? data.map((x) => ({
          id: x.id,
          q: x.question,
          c: x.correct_answer,
          w: Array.isArray(x.wrong_answers) ? x.wrong_answers : [],
          e: x.explanation || "",
          rationales: x.option_explanations || {},
          kind: x.question_kind,
          topic: x.topics?.name || "General",
        }))
      : null;
    if (mapped) writeQuestionCache(c, mapped);
    return mapped;
  } catch (e) {
    console.warn("Supabase question load failed; using local bank.", e);
    return null;
  }
}
function warmQuestionCache() {
  if (!window.requestIdleCallback) return;
  requestIdleCallback(
    async () => {
      for (const c of Object.keys(COURSES)) {
        if (readQuestionCache(c)) continue;
        await loadQuestionsFromSupabase(c);
        await new Promise((r) => setTimeout(r, 80));
      }
    },
    { timeout: 2500 },
  );
}
async function ensureSession() {
  try {
    if (!window.supabaseClient) {
      window.supabaseClient = Tamareen.client();
    }
    let { data } = await window.supabaseClient.auth.getSession();
    if (data?.session) return data.session;
    location.href = "login.html?next=" + encodeURIComponent("index.html");
    return null;
  } catch (e) {
    location.href = "login.html?next=" + encodeURIComponent("index.html");
    return null;
  }
}
async function getAdaptiveProfile(courseCode) {
  return Learning.profile(await Learning.history(courseCode));
}
function buildAdaptiveSet(source, profile) {
  return Learning.select(source, profile);
}
async function showAdaptiveRecommendation() {
  const box = $("adaptiveRec");
  if (!box || quizMode !== "practice") {
    if (box) box.classList.remove("show");
    return;
  }
  try {
    const session = await ensureSession();
    const profile = await getAdaptiveProfile(active, session);
    if (!profile?.length) {
      box.classList.remove("show");
      return;
    }
    const recommendation = Learning.recommendation(profile);
    $("adaptiveTitle").textContent = recommendation.title;
    $("adaptiveText").textContent = recommendation.text;
    $("adaptiveBar").style.width = (recommendation.topic?.pct || 0) + "%";
    $("adaptiveMastery").textContent = recommendation.topic
      ? "Recent weighted accuracy: " +
        recommendation.topic.pct +
        "% · " +
        recommendation.topic.total +
        " distinct questions"
      : "More practice builds confidence";
    $("adaptiveMix").textContent =
      "Varied practice · recent evidence · no verified grade";
    $("adaptiveBtn").onclick = () =>
      startQuiz(active, "practice", "", true, true);
    box.classList.add("show");
  } catch (e) {
    box.classList.remove("show");
  }
}
let quizGeneration = 0,
  startingQuiz = false,
  finishPromise = null;
async function startQuiz(
  c,
  mode = "practice",
  topic = "",
  push = true,
  adaptive = false,
) {
  if (startingQuiz) return;
  startingQuiz = true;
  const generation = ++quizGeneration;
  clearInterval(examTimerId);
  finishPromise = null;
  try {
    const session = await Tamareen.session(true);
    active = c;
    quizMode = mode;
    attemptId = null;
    attemptStart = Date.now();
    if (push)
      history.pushState(
        {},
        "",
        "/?course=" + encodeURIComponent(c) + "&mode=" + mode,
      );
    hideAll();
    $("quiz").style.display = "block";
    $("title").textContent =
      c +
      " · " +
      COURSES[c].name +
      " · " +
      (mode === "exam" ? "Mock Exam" : "Practice Mode");
    $("result").style.display = "none";
    $("card").style.display = "block";
    $("qtext").textContent = "Loading questions…";
    $("opts").innerHTML = "";
    const dbQuestions = await loadQuestionsFromSupabase(c);
    if (generation !== quizGeneration) return;
    const source = dbQuestions?.length ? dbQuestions : COURSES[c].questions;
    let pool = topic ? source.filter((q) => q.topic === topic) : source;
    if (!pool.length) pool = source;
    if (qp.get("reviewQuestion"))
      pool = pool.filter((q) => q.id === qp.get("reviewQuestion"));
    if (qp.has("mistakes")) {
      const ids = new Set(
        Learning.mistakes(await Learning.history(c))
          .filter((x) => x.due)
          .map((x) => x.question_id),
      );
      pool = pool.filter((q) => ids.has(q.id));
    }
    const picked =
      adaptive && mode === "practice"
        ? buildAdaptiveSet(pool, await getAdaptiveProfile(c, session))
        : Learning.mix(pool);
    if (!picked.length)
      throw new Error("No questions are available for this course.");
    questions = picked.map(makeQ);
    idx = score = 0;
    if (questions.every((q) => q.id)) {
      const id = crypto.randomUUID();
      try {
        const started = await Tamareen.checked(
          Tamareen.client().rpc("start_practice_attempt", {
            p_id: id,
            p_course: (await getCourseMap())[c],
            p_questions: questions.map((q) => q.id),
            p_mode: mode,
          }),
        );
        attemptId = id;
        attemptStart = started.started_at
          ? new Date(started.started_at).getTime()
          : Date.now();
        history.replaceState({}, "", "/?resume=" + id);
        Tamareen.status(
          "Progress saving is connected. Personal practice, not a verified grade.",
        );
      } catch (e) {
        throw new Error("Could not start a saved attempt. " + e.message);
      }
    } else
      Tamareen.status(
        "Offline question bank: this practice session will not be saved. Reconnect and start again to track progress.",
        "error",
      );
    startExamTimer();
    renderQ();
  } catch (e) {
    Tamareen.status(e.message, "error");
    $("qtext").textContent =
      "The quiz could not start. Return to the course and try again.";
    $("check").style.display = "none";
  } finally {
    startingQuiz = false;
  }
}
function renderQ() {
  selected = null;
  locked = false;
  const q = questions[idx],
    total = questions.length;
  const tt = $("tutorText");
  if (tt) {
    tt.style.display = "none";
    tt.textContent = "";
  }
  const tc = $("tutorChat"),
    tm = $("tutorMessages");
  if (tc) tc.classList.remove("show");
  if (tm) tm.innerHTML = "";
  tutorHistory = [];
  const tutor = $("tutor");
  if (tutor) tutor.style.display = quizMode === "practice" ? "block" : "none";
  $("qno").textContent = `QUESTION ${idx + 1} OF ${total}`;
  $("qtext").textContent = q.q;
  $("opts").innerHTML = q.options
    .map(
      (o, i) =>
        `<div class="opt" onclick="pick(${i},this)">${String.fromCharCode(65 + i)}. ${Tamareen.escape(o)}</div>`,
    )
    .join("");
  $("feed").className = "feed";
  $("check").style.display = "inline-block";
  $("next").style.display = "none";
  $("progress").textContent = `Question ${idx + 1} of ${questions.length}`;
  $("scoreNow").textContent =
    quizMode === "exam" ? "Score shown at completion" : `Score: ${score}`;
  $("bar").style.width = `${(idx / questions.length) * 100}%`;
}
function startExamTimer() {
  clearInterval(examTimerId);
  const el = $("examTimer");
  if (!el) return;
  if (quizMode !== "exam") {
    el.style.display = "none";
    return;
  }
  examSeconds = Math.max(
    0,
    Math.ceil((attemptStart + 600000 - Date.now()) / 1000),
  );
  el.style.display = "block";
  el.classList.remove("urgent");
  updateExamTimer();
  examTimerId = setInterval(() => {
    examSeconds = Math.max(
      0,
      Math.ceil((attemptStart + 600000 - Date.now()) / 1000),
    );
    updateExamTimer();
    if (examSeconds <= 0) {
      clearInterval(examTimerId);
      finish(true);
    }
  }, 1000);
}
function updateExamTimer() {
  const el = $("examTimer");
  if (!el) return;
  const m = Math.floor(examSeconds / 60),
    sec = examSeconds % 60;
  el.textContent = "Time left: " + m + ":" + String(sec).padStart(2, "0");
  el.classList.toggle("urgent", examSeconds <= 60);
}
let tutorHistory = [];
function addTutorMessage(role, text) {
  const wrap = $("tutorMessages");
  if (!wrap) return;
  const d = document.createElement("div");
  d.className = "tutorMsg " + (role === "user" ? "user" : "ai");
  d.textContent = text;
  wrap.appendChild(d);
  $("tutorChat")?.classList.add("show");
}
async function callTutor(kind, message = "") {
  if (quizMode !== "practice") return;
  const q = questions[idx],
    box = $("tutorText");
  if (!q || !box) return;
  const selectedAnswer = selected !== null ? q.options[selected] : "";
  box.textContent = "AI Tutor is thinking…";
  box.style.display = "block";
  document.querySelectorAll(".tutorBtn").forEach((b) => (b.disabled = true));
  try {
    const r = await fetch("/api/tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (await Tamareen.session(true)).access_token,
      },
      body: JSON.stringify({
        attemptId,
        questionId: q.id,
        kind,
        course: active,
        topic: q.topic || "General",
        question: q.q,
        options: q.options,
        selectedAnswer,
        answered: locked,
        message,
        history: tutorHistory.slice(-6),
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "AI request failed");
    const answer = data.answer || "No response was returned.";
    box.style.display = "none";
    addTutorMessage("assistant", answer);
    tutorHistory.push({ role: "assistant", content: answer });
    return answer;
  } catch (e) {
    Tamareen.report?.("tutor_error");
    box.textContent =
      "AI Tutor is not available yet. Please try again shortly.";
  } finally {
    document.querySelectorAll(".tutorBtn").forEach((b) => (b.disabled = false));
  }
}
function tutorHelp(kind) {
  tutorHistory = [];
  return callTutor(kind);
}
async function sendTutorFollowup() {
  const input = $("tutorInput");
  const message = (input?.value || "").trim();
  if (!message) return;
  if (input) input.value = "";
  addTutorMessage("user", message);
  tutorHistory.push({ role: "user", content: message });
  await callTutor("followup", message);
}
function askTutorQuick(message) {
  const input = $("tutorInput");
  if (input) input.value = message;
  sendTutorFollowup();
}
function pick(i, el) {
  if (locked) return;
  selected = i;
  document.querySelectorAll(".opt").forEach((x) => x.classList.remove("sel"));
  el.classList.add("sel");
}
async function checkAns() {
  if (locked || selected === null || finishPromise) return;
  const generation = quizGeneration;
  locked = true;
  const button = $("check");
  button.disabled = true;
  const q = questions[idx],
    choice = q.options[selected];
  let correct = selected === q.answer;
  try {
    if (attemptId) {
      const result = await Tamareen.checked(
        Tamareen.client().rpc("submit_practice_answer", {
          p_attempt: attemptId,
          p_question: q.id,
          p_answer: choice,
        }),
      );
      if (generation !== quizGeneration || finishPromise) return;
      correct = result.is_correct;
      score = result.correct_answers ?? score;
      Tamareen.status("Answer saved.", "success");
    } else if (correct) score++;
    if (quizMode === "practice") {
      const els = [...document.querySelectorAll(".opt")];
      els[q.answer].classList.add("good");
      if (!correct) els[selected].classList.add("bad");
      $("feed").className = "feed " + (correct ? "good" : "bad");
      $("feed").textContent =
        (correct ? "Correct! " : "Incorrect. ") + q.explain;
      const details = document.createElement("details");
      details.innerHTML =
        "<summary>Why each option is right or wrong</summary>";
      for (const option of q.options) {
        const p = document.createElement("p");
        p.textContent =
          option +
          ": " +
          (q.rationales[option] ||
            (option === q.options[q.answer]
              ? q.explain
              : "This does not match the concept tested. " + q.explain));
        details.append(p);
      }
      $("feed").append(details);
      $("scoreNow").textContent = `Score: ${score}`;
    }
    $("check").style.display = "none";
    $("next").style.display = "inline-block";
  } catch (e) {
    locked = false;
    Tamareen.report?.("quiz_save");
    Tamareen.status("Answer was not saved. " + e.message, "error", checkAns);
  } finally {
    button.disabled = false;
  }
}
function nextQ() {
  if (!locked || finishPromise) return;
  idx++;
  idx < questions.length ? renderQ() : finish();
}
async function finish(timedOut = false) {
  if (finishPromise) return finishPromise;
  clearInterval(examTimerId);
  locked = true;
  finishPromise = (async () => {
    try {
      let p = Math.round((score / questions.length) * 100);
      if (attemptId) {
        const result = await Tamareen.checked(
          Tamareen.client().rpc("finish_practice_attempt", {
            p_attempt: attemptId,
          }),
        );
        score = result.correct_answers;
        p = Number(result.score_percent);
        Tamareen.status("Completed attempt saved.", "success");
      }
      $("card").style.display = "none";
      $("result").style.display = "block";
      $("bar").style.width = "100%";
      $("finalScore").textContent = `${score}/${questions.length}`;
      $("finalTitle").textContent =
        p >= 80
          ? "Excellent work!"
          : p >= 60
            ? "Good progress"
            : "Keep practicing";
      $("finalMsg").textContent =
        (timedOut ? "Time is up. " : "") +
        `You scored ${p}%. Personal practice result, not a verified grade.`;
      await showAdaptiveRecommendation();
    } catch (e) {
      finishPromise = null;
      Tamareen.report?.("quiz_save");
      Tamareen.status("Completion was not saved. " + e.message, "error", () =>
        finish(timedOut),
      );
    }
  })();
  return finishPromise;
}
function restart() {
  startQuiz(active, quizMode);
}
function goBack() {
  clearInterval(examTimerId);
  quizGeneration++;
  showModes(active, true);
}
function goHome() {
  clearInterval(examTimerId);
  quizGeneration++;
  pushRoute("/");
  hideAll();
  $("home").style.display = "block";
}
function applyRoute() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] === "courses" && FROM_SLUG[parts[1]]) {
    const c = FROM_SLUG[parts[1]],
      section = parts[2] || "";
    if (section === "practice") startQuiz(c, "practice", "", false);
    else if (section === "mock-exam") startQuiz(c, "exam", "", false);
    else if (section === "code-practice") {
      location.replace(
        c === "BCIS 313"
          ? "/python-lab.html"
          : c === "BCIS 311"
            ? "/sql-lab.html"
            : c === "BCIS 317"
              ? "/web-lab.html"
              : c === "BCIS 324"
                ? "/erp-lab.html"
                : c === "BCIS 411"
                  ? "/bi-lab.html"
                  : c === "BCIS 421"
                    ? "/analytics-lab.html"
                    : routeFor(c),
      );
    } else showModes(c, false);
    return;
  }
  hideAll();
  $("home").style.display = "block";
}
window.addEventListener("popstate", applyRoute);
renderGrid();
applyRoute();
warmQuestionCache();
const qp = new URLSearchParams(location.search),
  qc = qp.get("course"),
  qt = qp.get("topic"),
  qm = qp.get("mode");
if (qp.has("resume")) resumeAttempt(qp.get("resume"));
else if (qc && COURSES[qc]) {
  const wanted = qm === "exam" ? "exam" : "practice";
  requireAuth(location.pathname + location.search).then((ok) => {
    if (ok) startQuiz(qc, wanted, qt || "", false);
  });
}
async function loadContinueLearning(uid) {
  try {
    const labs = {
        "python-lab": "/python-lab.html",
        "sql-lab": "/sql-lab.html",
        "web-lab": "/web-lab.html",
        "erp-lab": "/erp-lab.html",
        "bi-lab": "/bi-lab.html",
        "analytics-lab": "/analytics-lab.html",
      },
      totals = Object.fromEntries(
        Object.values(LAB_CATALOG).map((x) => [x.code, x.exercises.length]),
      );
    const lp = await Tamareen.all(() =>
      window.supabaseClient
        .from("lab_progress")
        .select("course_id,lab_type,exercise_key,updated_at,courses(code,name)")
        .eq("user_id", uid)
        .eq("completed", true)
        .order("updated_at", { ascending: false })
        .order("id"),
    );
    const { data: at } = await window.supabaseClient
      .from("attempts")
      .select("course_id,mode,completed_at,started_at,courses(code,name)")
      .eq("user_id", uid)
      .order("started_at", { ascending: false })
      .limit(20);
    const items = [],
      g = {};
    (lp || []).forEach((x) => {
      const code = x.courses?.code;
      if (!code) return;
      const k = code + "|" + x.lab_type;
      if (!g[k])
        g[k] = {
          type: "lab",
          code,
          name: x.courses?.name || "",
          lab: x.lab_type,
          keys: new Set(),
          date: x.updated_at,
        };
      {
        const catalog = LAB_CATALOG[x.lab_type];
        const exercise = catalog?.exercises.find(
          (e) =>
            e.id === x.exercise_key || String(e.legacyIndex) === x.exercise_key,
        );
        if (exercise) g[k].keys.add(exercise.id);
      }
    });
    Object.values(g).forEach((x) =>
      items.push({
        ...x,
        n: x.keys.size,
        total: totals[x.code] || x.keys.size,
      }),
    );
    (at || []).forEach((x) =>
      items.push({
        type: "quiz",
        code: x.courses?.code || "",
        name: x.courses?.name || "",
        mode: x.mode || "practice",
        date: x.completed_at || x.started_at,
      }),
    );
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    const unique = [],
      seen = new Set();
    for (const x of items) {
      const k = x.type + "|" + x.code + "|" + (x.lab || x.mode);
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(x);
      }
      if (unique.length === 3) break;
    }
    if (!unique.length) return;
    const box = $("continueLearning"),
      grid = $("continueGrid");
    grid.innerHTML = unique
      .map((x, n) => {
        const pct =
          x.type === "lab"
            ? Math.min(100, Math.round((x.n / x.total) * 100))
            : null;
        const label =
          x.type === "lab"
            ? x.n + " of " + x.total + " completed"
            : x.mode === "exam"
              ? "Mock Exam"
              : "Practice Mode";
        return (
          '<div class="continueCard" data-i="' +
          n +
          '"><b>' +
          x.code +
          " · " +
          x.name +
          "</b><span>" +
          (x.type === "lab" ? "Lab · " : "") +
          label +
          "</span>" +
          (pct !== null
            ? '<div class="continueTrack"><i style="width:' +
              pct +
              '%"></i></div><span class="continueMeta"><span>' +
              pct +
              "% complete</span><strong>Continue →</strong></span>"
            : '<span class="continueMeta"><span>Recent activity</span><strong>Practice again →</strong></span>') +
          "</div>"
        );
      })
      .join("");
    grid.querySelectorAll(".continueCard").forEach(
      (el) =>
        (el.onclick = () => {
          const x = unique[Number(el.dataset.i)];
          if (x.type === "lab") location.href = labs[x.lab] || "/";
          else {
            showModes(x.code, false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }),
    );
    box.style.display = "block";
  } catch (e) {
    console.warn("Continue Learning unavailable", e);
  }
}
Tamareen.session()
  .then((s) => {
    if (s) loadContinueLearning(s.user.id);
  })
  .catch(() => {});
const termLines = [
  "$ tamareen start",
  "> loading practice environment...",
  "> choose a course",
  "> solve. run. learn.",
];
let termLine = 0,
  termChar = 0,
  termTimer = null;
function typeTerminal() {
  const el = $("termText");
  if (!el) return;
  if (termLine >= termLines.length) {
    termTimer = setTimeout(() => {
      el.innerHTML = "";
      termLine = 0;
      termChar = 0;
      typeTerminal();
    }, 2000);
    return;
  }
  const line = termLines[termLine];
  if (termChar < line.length) {
    const ch = line.charAt(termChar++);
    el.appendChild(document.createTextNode(ch));
    termTimer = setTimeout(typeTerminal, 42);
  } else {
    el.appendChild(document.createElement("br"));
    termLine++;
    termChar = 0;
    termTimer = setTimeout(typeTerminal, 180);
  }
}
typeTerminal();
document.querySelectorAll(".benefit").forEach((card) => {
  const toggle = () => {
    const opening = !card.classList.contains("active");
    document.querySelectorAll(".benefit").forEach((x) => {
      x.classList.remove("active");
      x.setAttribute("aria-expanded", "false");
    });
    if (opening) {
      card.classList.add("active");
      card.setAttribute("aria-expanded", "true");
    }
  };
  card.addEventListener("click", toggle);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
});
const words = ["Practice.", "Code.", "Analyze.", "Experiment.", "Improve."];
let wi = 0;
setInterval(() => {
  let r = $("rotator");
  if (!r) return;
  r.style.opacity = 0;
  r.style.transform = "translateY(5px)";
  setTimeout(() => {
    wi = (wi + 1) % words.length;
    r.textContent = words[wi];
    r.style.opacity = 1;
    r.style.transform = "translateY(0)";
  }, 230);
}, 1900);

async function resumeAttempt(id) {
  try {
    await Tamareen.session(true);
    const a = await Tamareen.checked(
      Tamareen.client()
        .from("attempts")
        .select("id,mode,started_at,completed_at,question_ids,courses(code)")
        .eq("id", id)
        .single(),
    );
    if (a.completed_at)
      throw new Error(
        "This attempt is complete. View My Progress for the result.",
      );
    if (!a.question_ids.length)
      throw new Error(
        "This older attempt cannot be resumed. Start a new practice session.",
      );
    const rows = await Tamareen.checked(
      Tamareen.client()
        .from("questions")
        .select(
          "id,question,correct_answer,wrong_answers,explanation,option_explanations,topics(name)",
        )
        .in("id", a.question_ids),
    );
    const answers = await Tamareen.checked(
      Tamareen.client()
        .from("attempt_answers")
        .select("question_id,is_correct,selected_answer")
        .eq("attempt_id", a.id),
    );
    const byId = new Map(rows.map((q) => [q.id, q]));
    questions = a.question_ids.map((id) => {
      const q = byId.get(id);
      if (!q) throw new Error("A question is unavailable.");
      return makeQ({
        id: q.id,
        q: q.question,
        c: q.correct_answer,
        w: q.wrong_answers,
        e: q.explanation,
        rationales: q.option_explanations,
        topic: q.topics?.name,
      });
    });
    active = modeCourse = a.courses.code;
    quizMode = a.mode;
    attemptId = a.id;
    attemptStart = new Date(a.started_at).getTime();
    finishPromise = null;
    score = answers.filter((a) => a.is_correct).length;
    idx = questions.findIndex(
      (q) => !answers.some((a) => a.question_id === q.id),
    );
    hideAll();
    $("quiz").style.display = "block";
    $("title").textContent =
      active +
      " · " +
      COURSES[active].name +
      " · " +
      (quizMode === "exam" ? "Mock Exam" : "Practice Mode");
    $("result").style.display = "none";
    $("card").style.display = "block";
    if (
      idx < 0 ||
      (quizMode === "exam" && Date.now() >= attemptStart + 600000)
    ) {
      idx = questions.length - 1;
      await finish(quizMode === "exam");
      return;
    }
    startExamTimer();
    renderQ();
    Tamareen.status(
      "Attempt resumed. Submitted answers and the original exam deadline are preserved.",
      "success",
    );
  } catch (err) {
    Tamareen.status(err.message, "error");
  }
}
Learning.showResume();
