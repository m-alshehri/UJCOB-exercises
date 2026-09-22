import { createClient } from "@supabase/supabase-js";
import { authenticate, all, logRequest } from "../lib/server.js";
const check = async (q) => {
  const { data, error } = await q;
  if (error) throw error;
  return data;
};
export default async function handler(req, res) {
  logRequest(req, res, "journey");
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });
    if (Buffer.byteLength(JSON.stringify(req.body || {})) > 2000)
      return res.status(413).json({ error: "Request too large" });
    const { user } = await authenticate(req);
    const instructor = (process.env.INSTRUCTOR_EMAILS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .includes(user.email?.toLowerCase());
    if (req.body?.action === "role") return res.json({ instructor });
    if (req.body?.action && req.body.action !== "notifications")
      return res.status(400).json({ error: "Unknown action" });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      return res.status(503).json({ error: "Service unavailable" });
    const db = createClient(
      process.env.SUPABASE_URL || "https://ulueevjobheawtnqgupf.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const memberships = await check(
      db.from("group_members").select("group_id").eq("user_id", user.id),
    );
    const events = [];
    for (let n = 0; n < memberships.length; n += 100) {
      const assignments = await all(() =>
        db
          .from("study_assignments")
          .select("id,title,kind,exercise_keys,created_at,study_groups(name)")
          .in(
            "group_id",
            memberships.slice(n, n + 100).map((m) => m.group_id),
          )
          .order("id"),
      );
      for (const a of assignments)
        events.push({
          key: "assignment:" + a.id,
          kind: "assignment",
          title: a.title,
          group: a.study_groups?.name,
          at: a.created_at,
          href:
            a.kind === "project"
              ? "/submissions.html?assignment=" +
                a.id +
                "&exercise=" +
                a.exercise_keys[0]
              : "/classrooms.html#assignment-" + a.id,
        });
    }
    const mine = await all(() =>
      db
        .from("project_submissions")
        .select("id,exercise_key,assignment_id")
        .eq("user_id", user.id)
        .order("id"),
    );
    for (let n = 0; n < mine.length; n += 100) {
      const rows = await all(() =>
        db
          .from("project_feedback")
          .select("id,submission_id,outcome,created_at")
          .in(
            "submission_id",
            mine.slice(n, n + 100).map((s) => s.id),
          )
          .order("id"),
      );
      for (const f of rows) {
        const s = mine.find((s) => s.id === f.submission_id);
        events.push({
          key: "feedback:" + f.id,
          kind: f.outcome === "needs_revision" ? "needs_revision" : "feedback",
          project: s.exercise_key,
          at: f.created_at,
          href: "/submissions.html#submission-" + s.id,
        });
      }
    }
    const receipts = await all(() =>
      db
        .from("notification_reads")
        .select("event_key")
        .eq("user_id", user.id)
        .order("event_key"),
    );
    const read = new Set(receipts.map((r) => r.event_key));
    res.json({
      events: events
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((e) => ({ ...e, read: read.has(e.key) })),
      userId: user.id,
    });
  } catch (err) {
    res
      .status(err.status || 500)
      .json({
        error: err.status
          ? err.message
          : "Could not load notifications. Try again.",
      });
  }
}
