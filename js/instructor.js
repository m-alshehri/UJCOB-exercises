const $ = (x) => document.getElementById(x);
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
              Tamareen.escape(x.code) +
              "</b><br><small>" +
              Number(x.students) +
              " students · " +
              Number(x.attempts) +
              ' attempts</small></span><div class="track"><div class="bar" style="width:' +
              Number(x.average) +
              '%"></div></div><span>' +
              Number(x.average) +
              "%</span></div>",
          )
          .join("")
      : '<div class="empty">No course activity yet.</div>';
    $("topics").innerHTML = j.topics.length
      ? j.topics
          .map(
            (x) =>
              '<div class="topic"><div class="topicHead"><span><b>' +
              Tamareen.escape(x.code) +
              "</b> · " +
              Tamareen.escape(x.topic) +
              "</span><span>" +
              Number(x.mastery) +
              '%</span></div><div class="track"><div class="bar" style="width:' +
              Number(x.mastery) +
              '%"></div></div><small>' +
              Number(x.ok) +
              " of " +
              Number(x.n) +
              " correct</small></div>",
          )
          .join("")
      : '<div class="empty">Topic data will appear after students answer tagged questions.</div>';
    $("questions").innerHTML = j.difficult.length
      ? j.difficult
          .map(
            (x) =>
              '<div class="qrow"><b>' +
              Tamareen.escape(x.code) +
              "</b> · " +
              Tamareen.escape(x.question) +
              "<small>" +
              Number(x.correctRate) +
              "% correct · " +
              Number(x.n) +
              " answers</small></div>",
          )
          .join("")
      : '<div class="empty">Question analytics will appear after practice activity.</div>';
    let showingAtRiskOnly = false;
    function renderStudents() {
      const list = showingAtRiskOnly
        ? j.students.filter((x) => x.average < 60)
        : j.students;
      const isAr =
        (typeof I18n !== "undefined" && I18n.lang === "ar") ||
        document.documentElement.lang === "ar";
      $("studentRows").innerHTML = list.length
        ? list
            .map(
              (x) =>
                `<div class="row ${x.average < 60 ? "atRisk" : ""}"><span>${Tamareen.escape(x.name)}${x.average < 60 ? `<span class="badgeAtRisk">${isAr ? "⚠️ متعثر" : "⚠️ At risk"}</span>` : ""}</span><span>${Number(x.attempts)}</span><span>${Number(x.average)}%</span><span>${Number(x.best)}%</span><span>${new Date(x.last).toLocaleDateString()}</span></div>`,
            )
            .join("")
        : `<div class="empty">${showingAtRiskOnly ? (isAr ? "لا يوجد طلاب متعثرون حالياً." : "No at-risk students right now.") : (isAr ? "لا يوجد نشاط للطلاب حتى الآن." : "No student activity yet.")}</div>`;
    }
    renderStudents();

    const btnFilter = $("btnFilterAtRisk");
    if (btnFilter) {
      btnFilter.onclick = () => {
        showingAtRiskOnly = !showingAtRiskOnly;
        btnFilter.classList.toggle("active", showingAtRiskOnly);
        const isAr =
          (typeof I18n !== "undefined" && I18n.lang === "ar") ||
          document.documentElement.lang === "ar";
        btnFilter.textContent = showingAtRiskOnly
          ? isAr
            ? "عرض الكل"
            : "Show all"
          : isAr
            ? "⚠️ عرض المتعثرين"
            : "⚠️ Show at-risk";
        renderStudents();
      };
    }

    const btnExport = $("btnExportCSV");
    if (btnExport) {
      btnExport.onclick = () => {
        const isAr =
          (typeof I18n !== "undefined" && I18n.lang === "ar") ||
          document.documentElement.lang === "ar";
        const headers = isAr
          ? [
              "اسم الطالب",
              "عدد المحاولات",
              "متوسط الدرجة (%)",
              "أعلى درجة (%)",
              "آخر نشاط",
              "حالة الأداء",
            ]
          : [
              "Student Name",
              "Attempts",
              "Average (%)",
              "Best (%)",
              "Last Active",
              "Status",
            ];
        const rows = j.students.map((s) => {
          const status =
            s.average < 60
              ? isAr
                ? "متعثر"
                : "At Risk"
              : s.average >= 85
                ? isAr
                  ? "متميز"
                  : "High Performer"
                : isAr
                  ? "مستقر"
                  : "On Track";
          return [
            `"${(s.name || "").replace(/"/g, '""')}"`,
            s.attempts,
            s.average,
            s.best,
            `"${new Date(s.last).toLocaleDateString()}"`,
            `"${status}"`,
          ].join(",");
        });
        const csvContent =
          "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tamareen-students-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }
  } catch (e) {
    $("status").innerHTML =
      '<b>Instructor access is not ready for this account.</b><br><span class="bad">' +
      Tamareen.escape(e.message) +
      "</span><br>Sign in with an authorized instructor account.";
  }
}
load();
