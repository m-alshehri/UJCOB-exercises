import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { assignmentProgress, healthSummary } from "../lib/classrooms.js";
const ctx = {
  window: {},
  Tamareen: { escape: (x) => x, shuffle: (x) => [...x] },
  Date,
  Map,
  Set,
};
vm.createContext(ctx);
vm.runInContext(await readFile("js/learning.js", "utf8"), ctx);
const L = ctx.window.Learning,
  now = Date.now();
const answer = (id, ok, days = 0) => ({
  question_id: id,
  is_correct: ok,
  answered_at: new Date(now - days * 86400000).toISOString(),
  questions: { topics: { name: "Loops" }, courses: { code: "BCIS 313" } },
});
test("one repeated correct question is insufficient evidence, never a weak topic", () => {
  const p = L.profile([answer("a", true, 1), answer("a", true)], now);
  assert.equal(p[0].total, 1);
  assert.equal(p[0].state, "insufficient");
  assert.equal(L.recommendation(p).title, "Build a broader picture");
});
test("three distinct incorrect questions identify focus, old evidence requests review", () => {
  assert.equal(
    L.profile(
      ["a", "b", "c"].map((id) => answer(id, false)),
      now,
    )[0].state,
    "focus",
  );
  assert.equal(
    L.profile(
      ["a", "b", "c"].map((id) => answer(id, false, 40)),
      now,
    )[0].state,
    "review",
  );
});
test("all strong topics never receive a weakest-topic recommendation", () => {
  const p = L.profile(
    ["a", "b", "c"].map((id) => answer(id, true)),
    now,
  );
  assert.equal(p[0].state, "strong");
  assert.equal(L.recommendation(p).topic, undefined);
});
test("later correct answer resolves a mistake until its spaced review is due", () => {
  const rows = [answer("a", false, 3), answer("a", true, 1)];
  assert.equal(L.mistakes(rows, now)[0].due, false);
  assert.equal(L.mistakes(rows, now + 8 * 86400000)[0].due, true);
});
test("adaptive set contains unique questions even when topic buckets overlap", () => {
  const source = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    q: String(i),
    topic: "Loops",
  }));
  const picked = L.select(source, [
    { name: "Loops", state: "focus" },
    { name: "Loops", state: "review" },
  ]);
  assert.equal(picked.length, 10);
  assert.equal(new Set(picked.map((x) => x.id)).size, 10);
});
test("new bank has 36 distinct applied questions and four substantive option explanations each", async () => {
  const content = JSON.parse(
    await readFile("content/applied-questions.json", "utf8"),
  );
  assert.equal(Object.keys(content).length, 6);
  for (const rows of Object.values(content)) {
    assert.equal(rows.length, 6);
    for (const r of rows) {
      assert.equal(new Set([r[2], ...r[3]]).size, 4);
      assert.equal(r[5].length, 3);
      assert.ok(r[4].length > 20 && r[5].every((x) => x.length > 20));
    }
  }
});
test("assignment progress cannot include a different student or a pre-assignment attempt", () => {
  const a = { kind: "practice", course_id: "c", created_at: "2026-09-21" };
  const ats = [
    {
      user_id: "other",
      course_id: "c",
      completed_at: "2026-09-22",
      mode: "practice",
    },
    {
      user_id: "u",
      course_id: "c",
      completed_at: "2026-09-20",
      mode: "practice",
    },
  ];
  assert.equal(assignmentProgress(a, "u", ats, []).done, false);
});
test("lab assignment only counts its selected exercises", () => {
  const a = {
    kind: "lab",
    lab_type: "python-lab",
    exercise_keys: ["one", "two"],
  };
  const p = assignmentProgress(
    a,
    "u",
    [],
    [
      {
        user_id: "u",
        lab_type: "python-lab",
        exercise_key: "other",
        completed: true,
      },
      {
        user_id: "u",
        lab_type: "python-lab",
        exercise_key: "one",
        completed: true,
      },
    ],
  );
  assert.equal(p.completed, 1);
  assert.equal(p.done, false);
});
test("health alerts trigger at five recent matching events, not old events", () => {
  const events = Array.from({ length: 5 }, () => ({
    kind: "quiz_save",
    page: "/",
    created_at: new Date(now).toISOString(),
  }));
  assert.equal(healthSummary(events, now)[0].alert, true);
  assert.equal(healthSummary(events.slice(1), now)[0].alert, false);
  assert.equal(healthSummary(events, now + 3600001).length, 0);
});

test('project status follows the latest submission and does not inherit old completion', async()=>{
 const {projectProgress}=await import('../lib/classrooms.js');
 const a={id:'a'}, submissions=[{id:'s1',assignment_id:'a',user_id:'u',created_at:'2026-01-01'},{id:'s2',assignment_id:'a',user_id:'u',created_at:'2026-01-03'}],feedback=[{submission_id:'s1',outcome:'completed',created_at:'2026-01-02'}];
 assert.equal(projectProgress(a,'u',[],[],[]).state,'not_started');
 assert.equal(projectProgress(a,'u',[],[],[{user_id:'u',assignment_id:'a'}]).state,'draft');
 assert.equal(projectProgress(a,'u',submissions,feedback,[]).state,'submitted');
 feedback.push({submission_id:'s2',outcome:'needs_revision',created_at:'2026-01-04'});
 assert.equal(projectProgress(a,'u',submissions,feedback,[]).state,'needs_revision');
 feedback.push({submission_id:'s2',outcome:'completed',created_at:'2026-01-05'});
 assert.equal(projectProgress(a,'u',submissions,feedback,[]).done,true);
 assert.equal(projectProgress(a,'other',submissions,feedback,[]).state,'not_started');
});
