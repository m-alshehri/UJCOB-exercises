/* Shared evidence-based practice history. Repeated answers to one question count once. */
window.Learning = (() => {
  const e = Tamareen.escape;
  function profile(answers, now = Date.now()) {
    const latest = new Map();
    for (const a of answers) {
      const key = a.question_id || a.questions?.id;
      if (!key) continue;
      const old = latest.get(key);
      if (!old || new Date(a.answered_at) > new Date(old.answered_at))
        latest.set(key, a);
    }
    const topics = {};
    for (const a of latest.values()) {
      const q = a.questions;
      if (!q) continue;
      const name = q.topics?.name || "General",
        code = q.courses?.code || "",
        key = code + "|" + name;
      const t = (topics[key] ||= {
        name,
        code,
        total: 0,
        correct: 0,
        weighted: 0,
        weight: 0,
        last: 0,
      });
      const age = Math.max(
          0,
          (now - new Date(a.answered_at).getTime()) / 86400000,
        ),
        weight = Math.pow(0.5, age / 30);
      t.total++;
      t.correct += a.is_correct ? 1 : 0;
      t.weight += weight;
      t.weighted += a.is_correct ? weight : 0;
      t.last = Math.max(t.last, new Date(a.answered_at).getTime());
    }
    return Object.values(topics)
      .map((t) => ({
        ...t,
        pct: Math.round((100 * t.weighted) / (t.weight || 1)),
        state:
          t.total < 3
            ? "insufficient"
            : now - t.last > 30 * 86400000
              ? "review"
              : t.weighted / t.weight < 0.7
                ? "focus"
                : "strong",
      }))
      .sort((a, b) => a.pct - b.pct);
  }
  async function history(course) {
    const s = await Tamareen.session(true),
      client = Tamareen.client();
    const ats = await Tamareen.all(() => {
      let q = client
        .from("attempts")
        .select("id,completed_at,courses(code)")
        .eq("user_id", s.user.id)
        .not("completed_at", "is", null)
        .order("id");
      return q;
    });
    const ids = ats
        .filter((a) => !course || a.courses?.code === course)
        .map((a) => a.id),
      answers = [];
    for (let j = 0; j < ids.length; j += 100)
      answers.push(
        ...(await Tamareen.all(() =>
          client
            .from("attempt_answers")
            .select(
              "id,attempt_id,question_id,selected_answer,is_correct,answered_at,questions(id,question,correct_answer,wrong_answers,explanation,option_explanations,question_kind,is_active,topics(name),courses(code))",
            )
            .in("attempt_id", ids.slice(j, j + 100))
            .order("id"),
        )),
      );
    return answers;
  }
  function mistakes(answers, now = Date.now()) {
    const grouped = new Map();
    for (const a of answers) {
      if (!grouped.has(a.question_id)) grouped.set(a.question_id, []);
      grouped.get(a.question_id).push(a);
    }
    return [...grouped.values()]
      .filter((xs) => xs.some((a) => !a.is_correct))
      .map((xs) => {
        xs.sort((a, b) => new Date(b.answered_at) - new Date(a.answered_at));
        const last = xs[0],
          wrong = xs.find((a) => !a.is_correct);
        return {
          ...wrong,
          latest: last,
          reviewed: last.is_correct,
          due:
            !last.is_correct || now - new Date(last.answered_at) > 7 * 86400000,
        };
      })
      .sort(
        (a, b) =>
          Number(b.due) - Number(a.due) ||
          new Date(b.answered_at) - new Date(a.answered_at),
      );
  }
  function select(source, prof) {
    const focus = new Set(
      (prof || []).filter((x) => x.state === "focus").map((x) => x.name),
    );
    const needs = new Set(
      (prof || [])
        .filter((x) => ["review", "insufficient"].includes(x.state))
        .map((x) => x.name),
    );
    const take = (list, n, out) => {
      for (const q of Tamareen.shuffle(list)) {
        if (out.length >= n) break;
        if (!out.some((x) => (x.id ? x.id === q.id : x.q === q.q))) out.push(q);
      }
    };
    const out = [];
    take(
      source.filter((q) => focus.has(q.topic)),
      5,
      out,
    );
    take(
      source.filter((q) => needs.has(q.topic)),
      8,
      out,
    );
    take(source, 10, out);
    return Tamareen.shuffle(out);
  }
  function mix(source) {
    const applied = Tamareen.shuffle(
      source.filter((q) => q.kind && q.kind !== "recall"),
    ).slice(0, 5);
    return Tamareen.shuffle([
      ...applied,
      ...Tamareen.shuffle(source.filter((q) => !applied.includes(q))).slice(
        0,
        10 - applied.length,
      ),
    ]);
  }
  function recommendation(p) {
    const focus = p.find((x) => x.state === "focus"),
      review = p.find((x) => x.state === "review");
    if (focus)
      return {
        title: "Focus next on " + focus.name,
        text:
          "Recent evidence from " +
          focus.total +
          " distinct questions suggests extra practice would help.",
        topic: focus,
      };
    if (review)
      return {
        title: "Refresh " + review.name,
        text: "Your last evidence is over 30 days old. Revisit this topic to check retention.",
        topic: review,
      };
    return {
      title: "Build a broader picture",
      text: p.some((x) => x.state === "insufficient")
        ? "More distinct questions are needed before identifying a weak topic."
        : "Your assessed topics are doing well. Try varied questions to broaden your practice.",
    };
  }
  async function resumable() {
    const s = await Tamareen.session();
    if (!s) return [];
    return Tamareen.checked(
      Tamareen.client()
        .from("attempts")
        .select("id,mode,started_at,question_ids,courses(code,name)")
        .eq("user_id", s.user.id)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .limit(20),
    );
  }
  async function showResume() {
    const host = document.getElementById("resumeAttempts");
    if (!host) return;
    try {
      const rows = (await resumable()).filter((a) => a.question_ids?.length);
      host.replaceChildren();
      for (const a of rows) {
        const link = document.createElement("a");
        link.className = "learningCard";
        link.href = "/?resume=" + a.id;
        link.textContent =
          (a.mode === "exam" && Date.now() - new Date(a.started_at) > 600000
            ? "Finish expired exam: "
            : "Resume " + a.mode + ": ") + (a.courses?.code || "Course");
        host.append(link);
      }
    } catch {
      host.textContent =
        "Could not load unfinished attempts. Refresh to try again.";
    }
  }
  return {
    profile,
    history,
    mistakes,
    select,
    mix,
    recommendation,
    showResume,
  };
})();
