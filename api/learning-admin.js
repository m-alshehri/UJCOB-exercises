import { createClient } from "@supabase/supabase-js";
import { authenticate, all, logRequest } from "../lib/server.js";
import {
  fail,
  validateQuestion,
  qualitySummary,
} from "../lib/guided-learning.js";
const check = async (q) => {
  const { data, error } = await q;
  if (error) throw error;
  return data;
};
export default async function handler(req, res) {
  logRequest(req, res, "learning-admin");
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });
    if (Buffer.byteLength(JSON.stringify(req.body || {})) > 125000)
      fail("Request too large", 413);
    const { user } = await authenticate(req),
      b = req.body || {},
      action = b.action || "load";
    const instructor = (process.env.INSTRUCTOR_EMAILS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .includes(user.email?.toLowerCase());
    if (
      [
        "content",
        "saveQuestion",
        "quality",
        "resolveReport",
        "feedback",
      ].includes(action) &&
      !instructor
    )
      fail("Instructor access required", 403);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      fail("Service unavailable", 503);
    const db = createClient(
      process.env.SUPABASE_URL || "https://ulueevjobheawtnqgupf.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    if (action === "report") {
      if (
        !["unclear", "incorrect", "other"].includes(b.reason) ||
        typeof b.note !== "string" ||
        b.note.length > 1000
      )
        fail("Invalid report");
      const existing = await check(
        db
          .from("question_reports")
          .select("id")
          .eq("question_id", b.questionId)
          .eq("user_id", user.id)
          .maybeSingle(),
      );
      if (existing) return res.json({ saved: true });
      const recent = await check(
        db
          .from("question_reports")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      );
      if (recent.length >= 20) fail("Report limit reached", 429);
      const q = await check(
        db
          .from("questions")
          .select("id")
          .eq("id", b.questionId)
          .eq("is_active", true)
          .maybeSingle(),
      );
      if (!q) fail("Question unavailable", 404);
      await check(
        db
          .from("question_reports")
          .insert({
            question_id: b.questionId,
            user_id: user.id,
            reason: b.reason,
            note: b.note,
          }),
      );
      return res.json({ saved: true });
    }
    if (action === "saveQuestion") {
      const payload = validateQuestion(b.payload);
      if (
        !Number.isInteger(b.revision) ||
        b.revision < 0 ||
        typeof b.publish !== "boolean"
      )
        fail("Invalid revision");
      const draft = await check(
        db.rpc("manage_question_draft", {
          p_id: b.id,
          p_revision: b.revision,
          p_payload: payload,
          p_actor: user.id,
          p_publish: b.publish,
          p_question: b.questionId || null,
        }),
      );
      return res.json({ draft });
    }
    if (action === "content") {
      const courses = await check(
        db.from("courses").select("id,code,name").order("code"),
      );
      const drafts = await all(() =>
        db
          .from("content_drafts")
          .select("*")
          .order("updated_at", { ascending: false })
          .order("id"),
      );
      const questions = await all(() =>
        db
          .from("questions")
          .select(
            "id,question,correct_answer,wrong_answers,explanation,option_explanations,question_kind,courses(code),topics(name)",
          )
          .eq("is_active", true)
          .order("id"),
      );
      const versions = await all(() =>
        db
          .from("content_versions")
          .select("id,draft_id,revision,action,payload,created_at")
          .order("created_at", { ascending: false })
          .order("id"),
      );
      return res.json({ courses, drafts, questions, versions });
    }
    if (action === "quality") {
      const questions = await all(() =>
        db
          .from("questions")
          .select("id,question,is_active,courses(code)")
          .order("id"),
      );
      const answers = await all(() =>
        db
          .from("attempt_answers")
          .select(
            "id,question_id,selected_answer,is_correct,answered_at,attempts(user_id,completed_at)",
          )
          .order("id"),
      );
      const reports = await all(() =>
        db
          .from("question_reports")
          .select("id,question_id,reason,note,resolved,created_at")
          .order("id"),
      );
      return res.json({
        questions: qualitySummary(questions, answers, reports),
      });
    }
    if (action === "resolveReport") {
      await check(
        db.from("question_reports").update({ resolved: true }).eq("id", b.id),
      );
      return res.json({ saved: true });
    }
    if (action === "submit") {
      if (
        typeof b.code !== "string" ||
        !b.code.trim() ||
        Buffer.byteLength(b.code) > 100000 ||
        typeof b.reflection !== "string" ||
        b.reflection.length > 2000
      )
        fail("Check code and reflection");
      const recent = await check(
        db
          .from("project_submissions")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      );
      if (recent.length >= 30 && !recent.some((x) => x.id === b.id))
        fail("Submission limit reached", 429);
      const submission = await check(
        db.rpc("submit_learning_project", {
          p_id: b.id,
          p_user: user.id,
          p_group: b.groupId || null,
          p_exercise: b.exercise,
          p_code: b.code,
          p_reflection: b.reflection,
        }),
      );
      return res.json({ submission });
    }
    if (action === "feedback") {
      const s = await check(
        db
          .from("project_submissions")
          .select("id,group_id")
          .eq("id", b.id)
          .maybeSingle(),
      );
      if (!s?.group_id) fail("Submission unavailable", 404);
      const g = await check(
        db
          .from("study_groups")
          .select("id")
          .eq("id", s.group_id)
          .eq("owner_id", user.id)
          .maybeSingle(),
      );
      if (!g) fail("This is not your group", 403);
      if (
        typeof b.feedback !== "string" ||
        !b.feedback.trim() ||
        b.feedback.length > 4000 ||
        ["correctness", "clarity", "testing"].some(
          (k) => !Number.isInteger(b[k]) || b[k] < 0 || b[k] > 4,
        )
      )
        fail("Complete feedback and rubric");
      await check(
        db
          .from("project_feedback")
          .insert({
            submission_id: s.id,
            instructor_id: user.id,
            feedback: b.feedback,
            correctness: b.correctness,
            clarity: b.clarity,
            testing: b.testing,
          }),
      );
      return res.json({ saved: true });
    }
    if (action !== "load") fail("Unknown action");
    const owned = instructor
      ? await check(
          db.from("study_groups").select("id,name").eq("owner_id", user.id),
        )
      : [];
    const memberships = await check(
      db
        .from("group_members")
        .select("group_id,study_groups(id,name)")
        .eq("user_id", user.id),
    );
    const mine = await all(() =>
      db
        .from("project_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .order("id"),
    );
    const classwork = [];
    for (const group of owned)
      classwork.push(
        ...(await all(() =>
          db
            .from("project_submissions")
            .select("*")
            .eq("group_id", group.id)
            .order("id"),
        )),
      );
    const submissions = [
      ...new Map([...mine, ...classwork].map((x) => [x.id, x])).values(),
    ].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const profiles = [];
    const users = [...new Set(submissions.map((s) => s.user_id))];
    for (let i = 0; i < users.length; i += 100)
      profiles.push(
        ...(await check(
          db
            .from("profiles")
            .select("id,display_name")
            .in("id", users.slice(i, i + 100)),
        )),
      );
    for (const s of submissions)
      s.studentName =
        profiles.find((p) => p.id === s.user_id)?.display_name || "Student";
    const feedback = [];
    for (let i = 0; i < submissions.length; i += 100)
      feedback.push(
        ...(await all(() =>
          db
            .from("project_feedback")
            .select("*")
            .in(
              "submission_id",
              submissions.slice(i, i + 100).map((x) => x.id),
            )
            .order("created_at", { ascending: false })
            .order("id"),
        )),
      );
    return res.json({
      instructor,
      owned,
      groups: memberships.map((x) => x.study_groups),
      submissions,
      feedback,
      userId: user.id,
    });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({
        error: err.status
          ? err.message
          : err.code === "P0001"
            ? err.message
            : "Could not save or load. Please try again.",
      });
  }
}
