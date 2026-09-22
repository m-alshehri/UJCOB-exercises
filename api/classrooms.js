import { createClient } from "@supabase/supabase-js";
import { authenticate, all } from "../lib/server.js";
import { assignmentProgress, projectProgress, healthSummary } from "../lib/classrooms.js";
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const check = async (q) => {
  const { data, error } = await q;
  if (error) throw error;
  return data;
};
export default async function handler(req, res) {
  const started = Date.now();
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });
    if (JSON.stringify(req.body || {}).length > 12000)
      fail("Request too large", 413);
    const { user } = await authenticate(req),
      body = req.body || {},
      action = body.action || "load";
    const instructor = (process.env.INSTRUCTOR_EMAILS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .includes(user.email?.toLowerCase());
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!service) fail("Classrooms are not configured", 503);
    const db = createClient(
      process.env.SUPABASE_URL || "https://ulueevjobheawtnqgupf.supabase.co",
      service,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    if (action === "createGroup") {
      if (!instructor) fail("Instructor access required", 403);
      const name = String(body.name || "").trim();
      if (!name || name.length > 120)
        fail("Enter a group name, up to 120 characters");
      const groups = await check(
        db.from("study_groups").select("id").eq("owner_id", user.id),
      );
      if (groups.length >= 20) fail("Maximum 20 groups");
      const group = await check(
        db
          .from("study_groups")
          .insert({ owner_id: user.id, name })
          .select()
          .single(),
      );
      return res.status(200).json({ group });
    }
    if (action === "join") {
      const code = String(body.code || "")
        .trim()
        .toLowerCase();
      if (!/^[0-9a-f]{32}$/.test(code)) fail("Enter a valid group code");
      const group = await check(
        db
          .from("study_groups")
          .select("id")
          .eq("join_code", code)
          .maybeSingle(),
      );
      if (!group) fail("Group code not found", 404);
      await check(
        db
          .from("group_members")
          .upsert(
            { group_id: group.id, user_id: user.id },
            { onConflict: "group_id,user_id", ignoreDuplicates: true },
          ),
      );
      return res.status(200).json({ joined: true });
    }
    if (action === "assign") {
      if (!instructor) fail("Instructor access required", 403);
      const group = await check(
        db
          .from("study_groups")
          .select("id")
          .eq("id", body.groupId)
          .eq("owner_id", user.id)
          .maybeSingle(),
      );
      if (!group) fail("Group not found", 404);
      const title = String(body.title || "").trim();
      if (!title || title.length > 160)
        fail("Enter a title up to 160 characters");
      if (!["practice", "lab", "project"].includes(body.kind))
        fail("Invalid assignment kind");
      const course = await check(
        db.from("courses").select("id,code").eq("code", body.course).single(),
      );
      let keys = [];
      if (body.kind === "lab" || body.kind === "project") {
        keys = [
          ...new Set(Array.isArray(body.exercises) ? body.exercises : []),
        ];
        if (
          !keys.length ||
          keys.length > 95 ||
          keys.some((x) => typeof x !== "string")
        )
          fail("Choose exercises");
        const catalog = await check(
          db
            .from("lab_exercises")
            .select("exercise_key")
            .eq("course_code", course.code)
            .eq("lab_type", body.lab)
            .in("exercise_key", keys),
        );
        if (body.kind === 'project') {
          if(keys.length!==1) fail('Choose one project');
          const project=await check(db.from('learning_projects').select('exercise_key').eq('exercise_key',keys[0]).eq('course_code',course.code).eq('lab_type',body.lab).maybeSingle());
          if(!project) fail('Invalid project for this course');
        }
        if (catalog.length !== keys.length)
          fail("Invalid exercises for this course");
      }
      const due = body.due ? new Date(body.due) : null;
      if (
        due &&
        (!Number.isFinite(due.getTime()) || due.getTime() < Date.now())
      )
        fail("Choose a future due date");
      await check(
        db
          .from("study_assignments")
          .insert({
            group_id: group.id,
            title,
            course_id: course.id,
            kind: body.kind,
            lab_type: body.kind !== "practice" ? body.lab : null,
            exercise_keys: keys,
            due_at: due?.toISOString() || null,
          }),
      );
      return res.status(200).json({ assigned: true });
    }
    if (action !== "load") fail("Unknown action");
    const memberships = await check(
      db.from("group_members").select("group_id").eq("user_id", user.id),
    );
    const owned = instructor
      ? await all(() =>
          db
            .from("study_groups")
            .select("*")
            .eq("owner_id", user.id)
            .order("id"),
        )
      : [];
    const joined = memberships.length
      ? await check(
          db
            .from("study_groups")
            .select("id,name,created_at")
            .in(
              "id",
              memberships.map((x) => x.group_id),
            ),
        )
      : [];
    const groups = [
      ...owned.map((g) => ({ ...g, owned: true })),
      ...joined
        .filter((g) => !owned.some((o) => o.id === g.id))
        .map((g) => ({ ...g, owned: false })),
    ];
    const result = [];
    for (const g of groups) {
      const members = g.owned
        ? await all(() =>
            db
              .from("group_members")
              .select("user_id")
              .eq("group_id", g.id)
              .order("user_id"),
          )
        : [{ user_id: user.id }];
      const assignments = await all(() =>
        db
          .from("study_assignments")
          .select("*,courses(code,name)")
          .eq("group_id", g.id)
          .order("created_at", { ascending: false })
          .order("id"),
      );
      const ids = members.map((m) => m.user_id),
        attempts = [],
        labs = [],
        profiles = [],
        answers = [], submissions = [], feedback = [], drafts = [];
      for (let n = 0; n < ids.length; n += 100) {
        const chunk = ids.slice(n, n + 100);
        attempts.push(
          ...(await all(() =>
            db
              .from("attempts")
              .select("id,user_id,course_id,mode,score_percent,completed_at")
              .in("user_id", chunk)
              .not("completed_at", "is", null)
              .order("completed_at", { ascending: false })
              .order("id"),
          )),
        );
        labs.push(
          ...(await all(() =>
            db
              .from("lab_progress")
              .select("user_id,lab_type,exercise_key,completed")
              .in("user_id", chunk)
              .eq("completed", true)
              .order("id"),
          )),
        );
        submissions.push(...await all(()=>db.from("project_submissions").select("id,user_id,assignment_id,created_at").eq("group_id",g.id).in("user_id",chunk).order("id")));
        drafts.push(...await all(()=>db.from("assignment_drafts").select("user_id,assignment_id,updated_at").in("user_id",chunk).in("assignment_id",assignments.length?assignments.map(a=>a.id):["00000000-0000-0000-0000-000000000000"]).order("assignment_id").order("user_id")));
        profiles.push(
          ...(await check(
            db.from("profiles").select("id,display_name").in("id", chunk),
          )),
        );
      }
      for(let n=0;n<submissions.length;n+=100) feedback.push(...await all(()=>db.from("project_feedback").select("id,submission_id,outcome,created_at").in("submission_id",submissions.slice(n,n+100).map(s=>s.id)).order("id")));
      if (g.owned) {
        const ats = attempts.map((a) => a.id);
        for (let n = 0; n < ats.length; n += 100)
          answers.push(
            ...(await all(() =>
              db
                .from("attempt_answers")
                .select("id,is_correct,questions(topics(name),courses(code))")
                .in("attempt_id", ats.slice(n, n + 100))
                .order("id"),
            )),
          );
      }
      const topics = {};
      for (const a of answers) {
        const name =
          (a.questions?.courses?.code || "") +
          " · " +
          (a.questions?.topics?.name || "General");
        const t = (topics[name] ||= { name, total: 0, correct: 0 });
        t.total++;
        t.correct += a.is_correct ? 1 : 0;
      }
      result.push({
        ...g,
        assignments: assignments.map((a) => ({
          ...a,
          progress: members.map((m) => ({
            name:
              profiles.find((p) => p.id === m.user_id)?.display_name ||
              "Student",
            ...(a.kind === "project" ? projectProgress(a,m.user_id,submissions,feedback,drafts) : assignmentProgress(a, m.user_id, attempts, labs)),
          })),
        })),
        members: members.length,
        topics: Object.values(topics)
          .map((t) => ({ ...t, pct: Math.round((t.correct / t.total) * 100) }))
          .sort((a, b) => a.pct - b.pct),
      });
    }
    const health = instructor
      ? healthSummary(
          await all(() =>
            db
              .from("health_events")
              .select("id,kind,page,created_at")
              .gte("created_at", new Date(Date.now() - 3600000).toISOString())
              .order("id"),
          ),
        )
      : [];
    console.log(
      JSON.stringify({
        route: "classrooms",
        action: "load",
        status: 200,
        ms: Date.now() - started,
      }),
    );
    return res.status(200).json({ instructor, groups: result, health });
  } catch (err) {
    console.error(
      JSON.stringify({
        route: "classrooms",
        status: err.status || 500,
        code: err.code || "request_failed",
        ms: Date.now() - started,
      }),
    );
    return res
      .status(err.status || 500)
      .json({
        error: err.status
          ? err.message
          : "Classroom data could not load. Try again.",
      });
  }
}
