export const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
export function validateQuestion(p) {
  if (!p || typeof p !== "object") fail("Invalid question");
  const out = {};
  for (const [k, max] of Object.entries({
    course: 30,
    topic: 120,
    question: 4000,
    correct: 1000,
    explanation: 4000,
    kind: 30,
  })) {
    if (typeof p[k] !== "string" || !p[k].trim() || p[k].length > max)
      fail("Check question fields");
    out[k] = p[k].trim();
  }
  if (!["recall", "application", "code", "debugging"].includes(out.kind))
    fail("Invalid question type");
  if (
    !Array.isArray(p.wrong) ||
    p.wrong.length !== 3 ||
    p.wrong.some((x) => typeof x !== "string" || !x.trim() || x.length > 1000)
  )
    fail("Enter three incorrect options");
  out.wrong = p.wrong.map((x) => x.trim());
  const options = [out.correct, ...out.wrong];
  if (new Set(options).size !== 4) fail("Options must be distinct");
  out.rationales = Object.fromEntries(
    options.map((o) => {
      const r = p.rationales?.[o];
      if (typeof r !== "string" || !r.trim() || r.length > 2000)
        fail("Explain every option");
      return [o, r.trim()];
    }),
  );
  return out;
}
export function qualitySummary(questions, answers, reports) {
  const latest = new Map();
  for (const a of answers) {
    const key = a.attempts?.user_id + "|" + a.question_id;
    if (!a.attempts?.completed_at) continue;
    const old = latest.get(key);
    if (!old || a.answered_at > old.answered_at) latest.set(key, a);
  }
  const grouped = new Map();
  for (const a of latest.values()) {
    if (!grouped.has(a.question_id)) grouped.set(a.question_id, []);
    grouped.get(a.question_id).push(a);
  }
  return questions
    .map((q) => {
      const rows = grouped.get(q.id) || [],
        n = rows.length;
      return {
        ...q,
        learners: n,
        accuracy: n
          ? Math.round((rows.filter((x) => x.is_correct).length / n) * 100)
          : null,
        choices: rows.reduce(
          (m, a) => (
            (m[a.selected_answer] = (m[a.selected_answer] || 0) + 1),
            m
          ),
          {},
        ),
        reports: reports.filter((r) => r.question_id === q.id),
        insufficient: n < 5,
      };
    })
    .sort(
      (a, b) =>
        b.reports.filter((r) => !r.resolved).length -
          a.reports.filter((r) => !r.resolved).length ||
        (a.accuracy ?? 101) - (b.accuracy ?? 101),
    );
}
