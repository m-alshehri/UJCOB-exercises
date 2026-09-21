const $ = (x) => document.getElementById(x);
function safe(v) {
  const d = document.createElement("div");
  d.textContent = v ?? "";
  return d.innerHTML;
}
async function load() {
  try {
    const client = supabase.createClient(
      window.TAMAREEN_SUPABASE_URL,
      window.TAMAREEN_SUPABASE_PUBLISHABLE_KEY,
    );
    const { data } = await client.auth.getSession();
    if (!data?.session) {
      location.href =
        "/login.html?next=" + encodeURIComponent("/instructor.html");
      return;
    }
    const r = await fetch("/api/instructor-analytics", {
        headers: { Authorization: "Bearer " + data.session.access_token },
      }),
      j = await r.json();
    if (!r.ok) throw new Error(j.error || "Analytics unavailable");
    $("status").style.display = "none";
    $("content").style.display = "block";
    $("students").textContent = j.summary.students;
    $("attempts").textContent = j.summary.attempts;
    $("average").textContent = j.summary.average + "%";
    $("courseCount").textContent = j.summary.courses;
    $("courses").innerHTML = j.courses.length
      ? j.courses
          .map(
            (x) =>
              '<div class="course"><span><b>' +
              safe(x.code) +
              "</b><br><small>" +
              x.students +
              " students · " +
              x.attempts +
              ' attempts</small></span><div class="track"><div class="bar" style="width:' +
              x.average +
              '%"></div></div><span>' +
              x.average +
              "%</span></div>",
          )
          .join("")
      : '<div class="empty">No course activity yet.</div>';
    $("topics").innerHTML = j.topics.length
      ? j.topics
          .map(
            (x) =>
              '<div class="topic"><div class="topicHead"><span><b>' +
              safe(x.code) +
              "</b> · " +
              safe(x.topic) +
              "</span><span>" +
              x.mastery +
              '%</span></div><div class="track"><div class="bar" style="width:' +
              x.mastery +
              '%"></div></div><small>' +
              x.ok +
              " of " +
              x.n +
              " correct</small></div>",
          )
          .join("")
      : '<div class="empty">Topic data will appear after students answer tagged questions.</div>';
    $("questions").innerHTML = j.difficult.length
      ? j.difficult
          .map(
            (x) =>
              '<div class="qrow"><b>' +
              safe(x.code) +
              "</b> · " +
              safe(x.question) +
              "<small>" +
              x.correctRate +
              "% correct · " +
              x.n +
              " answers</small></div>",
          )
          .join("")
      : '<div class="empty">Question analytics will appear after practice activity.</div>';
    $("studentRows").innerHTML = j.students.length
      ? j.students
          .map(
            (x) =>
              '<div class="row"><span>' +
              safe(x.name) +
              "</span><span>" +
              x.attempts +
              "</span><span>" +
              x.average +
              "%</span><span>" +
              x.best +
              "%</span><span>" +
              new Date(x.last).toLocaleDateString() +
              "</span></div>",
          )
          .join("")
      : '<div class="empty">No student activity yet.</div>';
  } catch (e) {
    $("status").innerHTML =
      '<b>Instructor access is not ready for this account.</b><br><span class="bad">' +
      safe(e.message) +
      "</span><br>Sign in with an authorized instructor account.";
  }
}
load();
