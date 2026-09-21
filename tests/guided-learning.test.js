import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import { validateQuestion, qualitySummary } from "../lib/guided-learning.js";
const c = { Tamareen: { shuffle: (x) => [...x] } };
c.window = c;
vm.createContext(c);
vm.runInContext(fs.readFileSync("question-banks.js", "utf8"), c);
vm.runInContext(fs.readFileSync("js/pathways.js", "utf8"), c);
const P = c.Pathways;
const a = (date, correct, id = "q", topic = "variable") => ({
  question_id: id,
  answered_at: date + "T12:00:00Z",
  is_correct: correct,
  questions: { topics: { name: topic }, courses: { code: "BCIS 313" } },
});
test("every course has ordered stages covering its original 25 topics once", () => {
  for (const code of Object.keys(c.COURSES)) {
    const stages = P.lessons(code),
      topics = stages.flatMap((x) => x.topics);
    assert.equal(topics.length, 25);
    assert.equal(new Set(topics).size, 25);
  }
});
test("diagnostics cover multiple stages without duplicate questions", () => {
  for (const code of Object.keys(c.COURSES)) {
    const chosen = P.diagnostic(c.COURSES[code].questions, code);
    assert.ok(chosen.length <= 10 && chosen.length >= 8);
    assert.equal(new Set(chosen.map((q) => q.q)).size, chosen.length);
    for (const stage of P.lessons(code))
      assert.ok(chosen.some((q) => stage.topics.includes(q.topic)));
  }
});
test("one repeated question cannot complete a pathway stage and old success expires", () => {
  const now = Date.parse("2026-09-22");
  assert.equal(
    P.progress(
      "BCIS 313",
      [a("2026-09-21", true), a("2026-09-21", true)],
      now,
    )[0].strong,
    false,
  );
  const xs = ["a", "b", "c"].map((id) => a("2026-09-21", true, id));
  assert.equal(P.progress("BCIS 313", xs, now)[0].strong, true);
  assert.equal(
    P.progress("BCIS 313", xs, now + 31 * 86400000)[0].strong,
    false,
  );
});
test("spaced review includes always-correct answers and repeated same-day attempts do not inflate interval", () => {
  let r = P.schedule(
    [a("2026-09-20", true), a("2026-09-20", true)],
    Date.parse("2026-09-22"),
  )[0];
  assert.equal(r.interval, 1);
  assert.equal(r.due, true);
  r = P.schedule(
    [a("2026-09-19", true), a("2026-09-21", true)],
    Date.parse("2026-09-22"),
  )[0];
  assert.equal(r.interval, 3);
  assert.equal(r.due, false);
  r = P.schedule(
    [a("2026-09-19", true), a("2026-09-21", false)],
    Date.parse("2026-09-22"),
  )[0];
  assert.equal(r.interval, 0);
  assert.equal(r.due, true);
});
test("question publication requires four distinct options and four explanations", () => {
  const p = {
    course: "BCIS 313",
    topic: "variable",
    question: "Which?",
    correct: "A",
    wrong: ["B", "C", "D"],
    explanation: "Because",
    kind: "application",
    rationales: { A: "a", B: "b", C: "c", D: "d" },
  };
  assert.equal(validateQuestion(p).correct, "A");
  assert.throws(() => validateQuestion({ ...p, wrong: ["A", "B", "C"] }));
  assert.throws(() => validateQuestion({ ...p, rationales: { A: "a" } }));
});
test("quality uses latest completed answer per learner and labels small samples", () => {
  const qs = [{ id: "q" }],
    answers = [
      {
        question_id: "q",
        answered_at: "2026-01-01",
        is_correct: false,
        selected_answer: "B",
        attempts: { user_id: "one", completed_at: "yes" },
      },
      {
        question_id: "q",
        answered_at: "2026-02-01",
        is_correct: true,
        selected_answer: "A",
        attempts: { user_id: "one", completed_at: "yes" },
      },
      {
        question_id: "q",
        answered_at: "2026-03-01",
        is_correct: false,
        selected_answer: "B",
        attempts: { user_id: "two", completed_at: null },
      },
    ];
  const r = qualitySummary(qs, answers, [])[0];
  assert.equal(r.learners, 1);
  assert.equal(r.accuracy, 100);
  assert.equal(r.insufficient, true);
});
