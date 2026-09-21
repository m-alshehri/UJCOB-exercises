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
