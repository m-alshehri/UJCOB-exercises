async function load() {
  const list = document.getElementById("list"),
    mastery = document.getElementById("masteryList"),
    lab = document.getElementById("labProgress");
  try {
    const client = Tamareen.client();
    const { data: s, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!s?.session) {
      location.href =
        "/login.html?next=" + encodeURIComponent("/dashboard.html");
      return;
    }
    const uid = s.session.user.id;
    const data = await Tamareen.all(() =>
      client
        .from("attempts")
        .select("id,score_percent,mode,completed_at,courses(code,name)")
        .eq("user_id", uid)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .order("id"),
    );
    const rows = data || [],
      grouped = {};
    rows.forEach((x) => {
      const course = Array.isArray(x.courses) ? x.courses[0] : x.courses;
      if (!course?.code) return;
      if (!grouped[course.code])
        grouped[course.code] = { name: course.name, scores: [] };
      grouped[course.code].scores.push(Number(x.score_percent || 0));
    });
    const gs = Object.entries(grouped)
      .map(([code, v]) => ({
        code,
        name: v.name,
        avg: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
        n: v.scores.length,
      }))
      .sort((a, b) => a.avg - b.avg);
    mastery.innerHTML = gs.length
      ? '<details class="chartAlternative"><summary>Course chart data</summary><table><tr><th>Course</th><th>Average</th><th>Attempts</th></tr>' +
        gs
          .map(
            (x) =>
              `<tr><th>${Tamareen.escape(x.code)}</th><td>${x.avg}%</td><td>${x.n}</td></tr>`,
          )
          .join("") +
        "</table></details>"
      : "Complete your first quiz to start building your mastery profile.";
    const chartText = "#173746",
      grid = "#dce9ee";
    Chart.defaults.font.family =
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,Helvetica,sans-serif';
    Chart.defaults.color = chartText;
    const cc = document.getElementById("courseChart");
    if (gs.length)
      new Chart(cc, {
        type: "bar",
        data: {
          labels: gs.map((x) => x.code),
          datasets: [
            {
              label: "Average score",
              data: gs.map((x) => x.avg),
              backgroundColor: "#28a9dc",
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (x) => x.raw + "%" } },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (v) => v + "%" },
              grid: { color: grid },
            },
            x: { grid: { display: false } },
          },
        },
      });
    else
      cc.parentElement.innerHTML =
        '<div class="empty">Complete your first quiz to see course mastery.</div>';
    const rec = document.getElementById("recommend");
    if (rec) {
      rec.style.display = "block";
      rec.textContent =
        "Complete varied practice questions to build an evidence-based recommendation.";
    }
    const tm = document.getElementById("topicMastery");
    if (rows.length) {
      const ids = rows.map((x) => x.id);
      const ans = [];
      for (let offset = 0; offset < ids.length; offset += 100) {
        ans.push(
          ...(await Tamareen.all(() =>
            client
              .from("attempt_answers")
              .select(
                "id,question_id,answered_at,is_correct,questions(question,topics(name),courses(code))",
              )
              .in("attempt_id", ids.slice(offset, offset + 100))
              .order("id"),
          )),
        );
      }
      const evidence = Learning.profile(ans);
      const recommended = Learning.recommendation(evidence);
      if (rec) rec.textContent = recommended.title + ". " + recommended.text;
      const ts = evidence.map((t) => ({
        code: t.code,
        topic: t.name,
        p: t.pct,
        n: t.total,
        state: t.state,
      }));
      if (ts.length) {
        tm.innerHTML =
          '<details class="chartAlternative"><summary>Topic chart data and evidence</summary><table><tr><th>Topic</th><th>Recent accuracy</th><th>Distinct questions</th><th>Evidence</th></tr>' +
          ts
            .map(
              (t) =>
                `<tr><th>${Tamareen.escape(t.code + " · " + t.topic)}</th><td>${t.p}%</td><td>${t.n}</td><td>${Tamareen.escape(t.state)}</td></tr>`,
            )
            .join("") +
          "</table></details>";
        const top = ts.slice(0, 8);
        new Chart(document.getElementById("topicChart"), {
          type: "bar",
          data: {
            labels: top.map((x) => x.code + " · " + x.topic),
            datasets: [
              {
                label: "Correct answers",
                data: top.map((x) => x.p),
                backgroundColor: "#28a9dc",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: {
              x: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } },
            },
          },
        });
      } else
        document.getElementById("topicChart").parentElement.innerHTML =
          '<div class="empty">Answer practice questions to see topic mastery.</div>';
    }
    if (!rows.length)
      document.getElementById("topicChart").parentElement.innerHTML =
        '<div class="empty">Complete your first quiz to see topic mastery.</div>';
    const { data: lp, error: lpError } = await client
      .from("lab_progress")
      .select("course_id,lab_type,exercise_key,courses(code,name)")
      .eq("user_id", uid)
      .eq("completed", true);
    if (lpError) throw lpError;
    const totals = Object.fromEntries(
        Object.values(LAB_CATALOG).map((x) => [x.code, x.exercises.length]),
      ),
      lg = {};
    (lp || []).forEach((x) => {
      const course = Array.isArray(x.courses) ? x.courses[0] : x.courses,
        code = course?.code || "";
      if (!code) return;
      if (!lg[code]) lg[code] = { keys: new Set() };
      {
        const ex = LAB_CATALOG[x.lab_type]?.exercises.find(
          (e) =>
            e.id === x.exercise_key || String(e.legacyIndex) === x.exercise_key,
        );
        if (ex) lg[code].keys.add(x.lab_type + "|" + ex.id);
      }
    });
    const lrows = Object.entries(lg).map(([code, v]) => ({
      code,
      n: v.keys.size,
      total: totals[code] || v.keys.size,
    }));
    lab.className = lrows.length ? "labRings" : "empty";
    lab.innerHTML = lrows.length
      ? lrows
          .map((x) => {
            const p = Math.min(100, Math.round((x.n / x.total) * 100));
            return (
              '<div class="ringItem"><div class="ring" style="--p:' +
              p +
              '"><b>' +
              p +
              "%</b></div><strong>" +
              Tamareen.escape(x.code) +
              "</strong><small>" +
              x.n +
              " / " +
              x.total +
              " exercises</small></div>"
            );
          })
          .join("")
      : "Complete a lab exercise to start tracking lab progress.";
    const chronological = [...rows].reverse(),
      byDay = {};
    chronological.forEach((x) => {
      const d = new Date(x.completed_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(Number(x.score_percent || 0));
    });
    const days = Object.keys(byDay).slice(-12);
    const activityText = document.createElement("details");
    activityText.className = "chartAlternative";
    activityText.innerHTML =
      "<summary>Activity chart data</summary>" +
      days
        .map(
          (d) =>
            `<p>${Tamareen.escape(d)}: ${byDay[d].length} attempts, average ${Math.round(byDay[d].reduce((a, b) => a + b, 0) / byDay[d].length)}%</p>`,
        )
        .join("");
    document
      .getElementById("activityChart")
      .parentElement.insertAdjacentElement("afterend", activityText);
    if (days.length)
      new Chart(document.getElementById("activityChart"), {
        data: {
          labels: days,
          datasets: [
            {
              type: "bar",
              label: "Attempts",
              data: days.map((d) => byDay[d].length),
              backgroundColor: "#83ccea",
              borderRadius: 6,
              yAxisID: "y",
            },
            {
              type: "line",
              label: "Average score",
              data: days.map((d) =>
                Math.round(
                  byDay[d].reduce((a, b) => a + b, 0) / byDay[d].length,
                ),
              ),
              borderColor: "#004f6e",
              backgroundColor: "#004f6e",
              tension: 0.3,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 },
              grid: { color: "#dce9ee" },
            },
            y1: {
              beginAtZero: true,
              max: 100,
              position: "right",
              ticks: { callback: (v) => v + "%" },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });
    else
      document.getElementById("activityChart").parentElement.innerHTML =
        '<div class="empty">Complete attempts to see your activity over time.</div>';
    document.getElementById("attempts").textContent = rows.length;
    document.getElementById("avg").textContent = rows.length
      ? Math.round(
          rows.reduce((a, x) => a + Number(x.score_percent || 0), 0) /
            rows.length,
        ) + "%"
      : "—";
    document.getElementById("best").textContent = rows.length
      ? Math.max(...rows.map((x) => Number(x.score_percent || 0))) + "%"
      : "—";

    const streak =
      typeof Tamareen !== "undefined" && Tamareen.getStreak
        ? Tamareen.getStreak(uid)
        : { streak: 0, todayCount: 0, goal: 5 };
    const streakStat = document.getElementById("streakStat");
    if (streakStat) streakStat.textContent = `${streak.streak || 0} 🔥`;
    const goalStat = document.getElementById("goalStat");
    if (goalStat)
      goalStat.textContent = `${streak.todayCount || 0} / ${streak.goal || 5}`;

    // Certificate of Mastery
    const certWrap = document.getElementById("certBannerWrap");
    const certCandidates = gs.filter((g) => g.avg >= 80);
    if (certWrap) {
      if (certCandidates.length > 0) {
        certWrap.style.display = "flex";
        const isAr =
          (typeof I18n !== "undefined" && I18n.lang === "ar") ||
          document.documentElement.lang === "ar";
        certWrap.innerHTML = certCandidates
          .map(
            (c) => `
            <div class="certBanner">
              <div class="certBannerLeft">
                <span class="certBannerIcon">🏆</span>
                <div>
                  <div class="certBannerTitle">${isAr ? `شهادة إتقان وتفوق: ${Tamareen.escape(c.code)}` : `Mastery Certificate Available: ${Tamareen.escape(c.code)}`}</div>
                  <div class="certBannerSub">${isAr ? `حققت معدل ${c.avg}% في مقرر ${Tamareen.escape(c.name)}` : `You achieved ${c.avg}% mastery in ${Tamareen.escape(c.name)}`}</div>
                </div>
              </div>
              <button type="button" class="btnViewCert" data-code="${Tamareen.escape(c.code)}" data-name="${Tamareen.escape(c.name)}" data-score="${c.avg}%">
                ${isAr ? "عرض شهادة الإنجاز 🏅" : "View Certificate 🏅"}
              </button>
            </div>
          `,
          )
          .join("");

        certWrap.querySelectorAll(".btnViewCert").forEach((btn) => {
          btn.onclick = async () => {
            const courseCode = btn.dataset.code;
            const courseName = btn.dataset.name;
            const score = btn.dataset.score;
            let studentName =
              s.session.user.user_metadata?.display_name ||
              s.session.user.email?.split("@")[0] ||
              "Student";
            try {
              const { data: p } = await client
                .from("profiles")
                .select("display_name")
                .eq("id", uid)
                .single();
              if (p?.display_name) studentName = p.display_name;
            } catch {}

            document.getElementById("certRecipient").textContent = studentName;
            document.getElementById("certCourse").textContent =
              `${courseCode} · ${courseName}`;
            document.getElementById("certScore").textContent = score;
            document.getElementById("certDate").textContent =
              new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US");
            let hash = 0;
            const str = uid + courseCode;
            for (let k = 0; k < str.length; k++) {
              hash = (hash << 5) - hash + str.charCodeAt(k);
              hash |= 0;
            }
            document.getElementById("certId").textContent =
              "TAM-" +
              Math.abs(hash).toString(36).toUpperCase().padStart(6, "0");
            document.getElementById("certModal").style.display = "flex";
          };
        });
      } else {
        certWrap.style.display = "none";
      }
    }

    list.innerHTML = rows.length
      ? rows
          .slice(0, 30)
          .map((x) => {
            const course = Array.isArray(x.courses) ? x.courses[0] : x.courses;
            return (
              '<div class="row"><span>' +
              Tamareen.escape(course?.code || "—") +
              "</span><span>" +
              Math.round(Number(x.score_percent || 0)) +
              "%</span><span>" +
              Tamareen.escape(x.mode) +
              "</span><span>" +
              new Date(x.completed_at).toLocaleDateString() +
              "</span></div>"
            );
          })
          .join("")
      : "No completed attempts yet. Start a course to build your progress.";
  } catch (e) {
    console.error("Progress load failed", e);
    const msg =
      "Could not load progress. " +
      (e?.message || "Please refresh and try again.");
    list.textContent = msg;
    if (mastery) mastery.textContent = msg;
    if (lab) lab.textContent = msg;
    document.getElementById("attempts").textContent = "—";
    document.getElementById("avg").textContent = "—";
    document.getElementById("best").textContent = "—";
  }
}
load();

Learning.showResume();

const closeCertModal = () => {
  const m = document.getElementById("certModal");
  if (m) m.style.display = "none";
};
document.getElementById("btnCloseCert")?.addEventListener("click", closeCertModal);
document.getElementById("btnDismissCert")?.addEventListener("click", closeCertModal);
document.getElementById("btnPrintCert")?.addEventListener("click", () => {
  window.print();
});
document.getElementById("certModal")?.addEventListener("click", (e) => {
  if (e.target.id === "certModal") closeCertModal();
});
