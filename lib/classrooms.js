export function assignmentProgress(assignment, uid, attempts, labs) {
  if (assignment.kind === "practice") {
    const rows = attempts.filter(
      (a) =>
        a.user_id === uid &&
        a.course_id === assignment.course_id &&
        a.completed_at >= assignment.created_at &&
        a.mode === "practice",
    );
    return {
      done: rows.length > 0,
      completed: rows.length,
      total: 1,
      label: rows.length
        ? `${rows.length} practice attempts · latest ${rows[0].score_percent}%`
        : "Not started",
    };
  }
  const keys = new Set(
    labs
      .filter(
        (a) =>
          a.user_id === uid &&
          a.lab_type === assignment.lab_type &&
          a.completed,
      )
      .map((a) => a.exercise_key),
  );
  const n = assignment.exercise_keys.filter((k) => keys.has(k)).length;
  return {
    done: n === assignment.exercise_keys.length,
    completed: n,
    total: assignment.exercise_keys.length,
    label: `${n}/${assignment.exercise_keys.length} exercises (includes earlier completions)`,
  };
}
export function healthSummary(events, now = Date.now()) {
  const counts = {};
  for (const event of events) {
    if (now - new Date(event.created_at) > 3600000) continue;
    const k = event.kind + "|" + event.page;
    const v = (counts[k] ||= { kind: event.kind, page: event.page, count: 0 });
    v.count++;
  }
  return Object.values(counts)
    .map((x) => ({ ...x, alert: x.count >= 5 }))
    .sort((a, b) => b.count - a.count);
}

export function projectProgress(assignment, uid, submissions, feedback, drafts) {
 const latest=submissions.filter(s=>s.user_id===uid && s.assignment_id===assignment.id).sort((a,b)=>b.created_at.localeCompare(a.created_at))[0];
 const draft=drafts.find(d=>d.user_id===uid && d.assignment_id===assignment.id);
 const review=latest && feedback.filter(f=>f.submission_id===latest.id).sort((a,b)=>b.created_at.localeCompare(a.created_at))[0];
 const state=latest ? (review?.outcome==='completed'?'completed':review?.outcome==='needs_revision'?'needs_revision':'submitted') : draft?'draft':'not_started';
 return {done:state==='completed',completed:state==='completed'?1:0,total:1,state,label:({completed:'Complete',needs_revision:'Needs revision',submitted:'Submitted',draft:'Draft',not_started:'Not started'})[state]};
}
