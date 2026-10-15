/* Shared evidence-based practice history. Repeated answers to one question count once. */
window.Learning = (() => {
  const e = Tamareen.escape;
  function profile(answers, now = Date.now()) {
    const latest = new Map();
    for (const a of answers) {
      const key = a.question_id || a.questions?.id;
      if (!key) continue;
      const old = latest.get(key);
      if (!old || new Date(a.answered_at) > new Date(old.answered_at))
        latest.set(key, a);
    }
    const topics = {};
    for (const a of latest.values()) {
      const q = a.questions;
      if (!q) continue;
      const name = q.topics?.name || "General",
        code = q.courses?.code || "",
        key = code + "|" + name;
      const t = (topics[key] ||= {
        name,
        code,
        total: 0,
        correct: 0,
        weighted: 0,
        weight: 0,
        last: 0,
      });
      const age = Math.max(
          0,
          (now - new Date(a.answered_at).getTime()) / 86400000,
        ),
        weight = Math.pow(0.5, age / 30);
      t.total++;
      t.correct += a.is_correct ? 1 : 0;
      t.weight += weight;
      t.weighted += a.is_correct ? weight : 0;
      t.last = Math.max(t.last, new Date(a.answered_at).getTime());
    }
    return Object.values(topics)
      .map((t) => ({
        ...t,
        pct: Math.round((100 * t.weighted) / (t.weight || 1)),
        state:
          t.total < 3
            ? "insufficient"
            : now - t.last > 30 * 86400000
              ? "review"
              : t.weighted / t.weight < 0.7
                ? "focus"
                : "strong",
      }))
      .sort((a, b) => a.pct - b.pct);
  }
  async function history(course) {
    const s = await Tamareen.session(true),
      client = Tamareen.client();
    const ats = await Tamareen.all(() => {
      let q = client
        .from("attempts")
        .select("id,completed_at,courses(code)")
        .eq("user_id", s.user.id)
        .not("completed_at", "is", null)
        .order("id");
      return q;
    });
    const ids = ats
        .filter((a) => !course || a.courses?.code === course)
        .map((a) => a.id),
      answers = [];
    for (let j = 0; j < ids.length; j += 100)
      answers.push(
        ...(await Tamareen.all(() =>
          client
            .from("attempt_answers")
            .select(
              "id,attempt_id,question_id,selected_answer,is_correct,answered_at,questions(id,question,correct_answer,wrong_answers,explanation,option_explanations,question_kind,is_active,topics(name),courses(code))",
            )
            .in("attempt_id", ids.slice(j, j + 100))
            .order("id"),
        )),
      );
    return answers;
  }
  function mistakes(answers, now = Date.now()) {
    const grouped = new Map();
    for (const a of answers) {
      if (!grouped.has(a.question_id)) grouped.set(a.question_id, []);
      grouped.get(a.question_id).push(a);
    }
    return [...grouped.values()]
      .filter((xs) => xs.some((a) => !a.is_correct))
      .map((xs) => {
        xs.sort((a, b) => new Date(b.answered_at) - new Date(a.answered_at));
        const last = xs[0],
          wrong = xs.find((a) => !a.is_correct);
        return {
          ...wrong,
          latest: last,
          reviewed: last.is_correct,
          due:
            !last.is_correct || now - new Date(last.answered_at) > 7 * 86400000,
        };
      })
      .sort(
        (a, b) =>
          Number(b.due) - Number(a.due) ||
          new Date(b.answered_at) - new Date(a.answered_at),
      );
  }
  function select(source, prof) {
    const focus = new Set(
      (prof || []).filter((x) => x.state === "focus").map((x) => x.name),
    );
    const needs = new Set(
      (prof || [])
        .filter((x) => ["review", "insufficient"].includes(x.state))
        .map((x) => x.name),
    );
    const take = (list, n, out) => {
      for (const q of Tamareen.shuffle(list)) {
        if (out.length >= n) break;
        if (!out.some((x) => (x.id ? x.id === q.id : x.q === q.q))) out.push(q);
      }
    };
    const out = [];
    take(
      source.filter((q) => focus.has(q.topic)),
      5,
      out,
    );
    take(
      source.filter((q) => needs.has(q.topic)),
      8,
      out,
    );
    take(source, 10, out);
    return Tamareen.shuffle(out);
  }
  function mix(source) {
    const applied = Tamareen.shuffle(
      source.filter((q) => q.kind && q.kind !== "recall"),
    ).slice(0, 5);
    return Tamareen.shuffle([
      ...applied,
      ...Tamareen.shuffle(source.filter((q) => !applied.includes(q))).slice(
        0,
        10 - applied.length,
      ),
    ]);
  }
  function recommendation(p) {
    const focus = p.find((x) => x.state === "focus"),
      review = p.find((x) => x.state === "review");
    if (focus)
      return {
        title: "Focus next on " + focus.name,
        text:
          "Recent evidence from " +
          focus.total +
          " distinct questions suggests extra practice would help.",
        topic: focus,
      };
    if (review)
      return {
        title: "Refresh " + review.name,
        text: "Your last evidence is over 30 days old. Revisit this topic to check retention.",
        topic: review,
      };
    return {
      title: "Build a broader picture",
      text: p.some((x) => x.state === "insufficient")
        ? "More distinct questions are needed before identifying a weak topic."
        : "Your assessed topics are doing well. Try varied questions to broaden your practice.",
    };
  }
  const COURSE_NAMES = {
    "BCIS 313": { en: "Programming for Business (Python)", ar: "البرمجة للأعمال (بايثون)" },
    "BCIS 324": { en: "Enterprise Resource Planning (ERP)", ar: "تخطيط موارد المؤسسات (ERP)" },
    "BCIS 317": { en: "Web Development", ar: "تطوير تطبيقات الويب" },
    "BCIS 411": { en: "Business Intelligence (Power BI)", ar: "ذكاء الأعمال (Power BI)" },
    "BCIS 421": { en: "Business Analytics (Excel)", ar: "تحليلات الأعمال (Excel)" },
    "BCIS 311": { en: "Database Management (SQL)", ar: "إدارة قواعد البيانات (SQL)" },
  };

  function timeAgo(dateStr, isAr) {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return isAr ? "الآن" : "Just now";
    if (mins < 60) return isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`;
    if (hours < 24) {
      if (isAr) {
        if (hours === 1) return "منذ ساعة";
        if (hours === 2) return "منذ ساعتين";
        if (hours >= 3 && hours <= 10) return `منذ ${hours} ساعات`;
        return `منذ ${hours} ساعة`;
      }
      return `${hours}h ago`;
    }
    if (days === 1) return isAr ? "أمس" : "Yesterday";
    if (isAr) {
      if (days === 2) return "منذ يومين";
      if (days >= 3 && days <= 10) return `منذ ${days} أيام`;
      return `منذ ${days} يوم`;
    }
    return `${days}d ago`;
  }

  async function resumable() {
    const s = await Tamareen.session();
    if (!s) return [];
    return Tamareen.checked(
      Tamareen.client()
        .from("attempts")
        .select("id,mode,started_at,question_ids,courses(code,name)")
        .eq("user_id", s.user.id)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .limit(20),
    );
  }

  async function showResume() {
    if (typeof document === "undefined") return;
    const host = document.getElementById("resumeAttempts");
    if (!host) return;

    let dismissed = [];
    try {
      dismissed = JSON.parse(
        localStorage.getItem("tamareen:dismissed_attempts") || "[]",
      );
    } catch {}
    const dismissedSet = new Set(dismissed);

    try {
      const raw = await resumable();
      const rows = (raw || []).filter(
        (a) => a.question_ids?.length && !dismissedSet.has(a.id),
      );

      if (!rows.length) {
        host.replaceChildren();
        host.style.display = "none";
        return;
      }

      host.style.display = "";

      // Deduplicate: Keep only the most recent unfinished attempt per course
      const courseMap = new Map();
      for (const a of rows) {
        const code = a.courses?.code || "other";
        if (!courseMap.has(code)) {
          courseMap.set(code, a);
        }
      }
      const unique = Array.from(courseMap.values());

      if (!unique.length) {
        host.replaceChildren();
        host.style.display = "none";
        return;
      }

      const isAr =
        (typeof I18n !== "undefined" && I18n.lang === "ar") ||
        document.documentElement.lang === "ar" ||
        document.body.dir === "rtl";

      const widget = document.createElement("section");
      widget.className = "resumeWidget";
      widget.setAttribute(
        "aria-label",
        isAr ? "استئناف التدريب" : "Resume Practice",
      );

      // Header
      const head = document.createElement("div");
      head.className = "resumeWidgetHead";

      const titleWrap = document.createElement("div");
      titleWrap.className = "resumeWidgetTitle";
      titleWrap.innerHTML = `
        <span class="resumeIcon" aria-hidden="true">⏱️</span>
        <div>
          <h3>${isAr ? "متابعة التدريب" : "Resume your practice"}</h3>
          <p>${isAr ? "جلسات سابقة غير مكتملة يمكنك استئنافها من حيث توقفت" : "Pick up right where you left off"}</p>
        </div>
      `;

      const actionsWrap = document.createElement("div");
      actionsWrap.className = "resumeWidgetActions";
      const dismissAllBtn = document.createElement("button");
      dismissAllBtn.type = "button";
      dismissAllBtn.className = "resumeDismissAllBtn";
      dismissAllBtn.textContent = isAr ? "تجاهل الكل" : "Dismiss all";
      dismissAllBtn.onclick = () => {
        try {
          const allIds = unique.map((x) => x.id);
          const current = JSON.parse(
            localStorage.getItem("tamareen:dismissed_attempts") || "[]",
          );
          localStorage.setItem(
            "tamareen:dismissed_attempts",
            JSON.stringify([...new Set([...current, ...allIds])]),
          );
        } catch {}
        widget.style.opacity = "0";
        widget.style.transform = "scale(0.98)";
        setTimeout(() => {
          host.replaceChildren();
          host.style.display = "none";
        }, 200);
      };
      actionsWrap.append(dismissAllBtn);
      head.append(titleWrap, actionsWrap);
      widget.append(head);

      const grid = document.createElement("div");
      grid.className = "resumeCardsGrid";

      function createCard(a) {
        const code = a.courses?.code || "Course";
        const meta = COURSE_NAMES[code] || {};
        const courseName = (isAr ? meta.ar : meta.en) || a.courses?.name || code;
        const isExpired =
          a.mode === "exam" &&
          Date.now() - new Date(a.started_at).getTime() > 600000;
        const qCount = a.question_ids.length;

        const card = document.createElement("div");
        card.className = "resumeCard";
        card.dataset.attemptId = a.id;

        let badgeText, badgeClass;
        if (isExpired) {
          badgeText = isAr ? "اختبار منتهي" : "Expired exam";
          badgeClass = "resumeBadgeExpired";
        } else if (a.mode === "exam") {
          badgeText = isAr ? "اختبار تجريبي" : "Mock exam";
          badgeClass = "resumeBadgeExam";
        } else {
          badgeText = isAr ? "تدريب" : "Practice";
          badgeClass = "resumeBadgePractice";
        }

        const dismissTitle = isAr ? "تجاهل هذه الجلسة" : "Dismiss session";
        const actionText = isExpired
          ? isAr
            ? "تسليم الاختبار ←"
            : "Submit exam →"
          : isAr
            ? "استئناف الجلسة ←"
            : "Resume session →";

        card.innerHTML = `
          <div class="resumeCardHeader">
            <div class="resumeBadges">
              <span class="resumeCode">${code}</span>
              <span class="resumeBadge ${badgeClass}">${badgeText}</span>
            </div>
            <button type="button" class="resumeDismissBtn" title="${dismissTitle}" aria-label="${dismissTitle}">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="2" x2="12" y2="12"></line><line x1="12" y1="2" x2="2" y2="12"></line></svg>
            </button>
          </div>
          <div class="resumeCardBody">
            <h4 class="resumeName">${courseName}</h4>
            <div class="resumeMeta">
              <span class="resumeTime">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zM8.5 4h-1.25v4.5l3.5 2.1.62-1.03-2.87-1.7V4z"/></svg>
                ${timeAgo(a.started_at, isAr)}
              </span>
              <span class="resumeQuestions">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5A1.5 1.5 0 002.5 3v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V3A1.5 1.5 0 0012 1.5H4zM4 3h8v10H4V3zm1.5 2v1.5h5V5h-5zm0 3v1.5h5V8h-5zm0 3v1.5h3V11h-3z"/></svg>
                ${qCount} ${isAr ? "أسئلة" : "questions"}
              </span>
            </div>
          </div>
          <div class="resumeCardFooter">
            <a href="/?resume=${encodeURIComponent(a.id)}" class="resumeBtn ${isExpired ? "resumeBtnExpired" : "resumeBtnPrimary"}">
              ${actionText}
            </a>
          </div>
        `;

        const disBtn = card.querySelector(".resumeDismissBtn");
        disBtn.onclick = (e) => {
          e.preventDefault();
          try {
            const current = JSON.parse(
              localStorage.getItem("tamareen:dismissed_attempts") || "[]",
            );
            current.push(a.id);
            localStorage.setItem(
              "tamareen:dismissed_attempts",
              JSON.stringify(current),
            );
          } catch {}
          card.style.opacity = "0";
          card.style.transform = "scale(0.95)";
          setTimeout(() => {
            card.remove();
            if (!grid.querySelector(".resumeCard")) {
              host.replaceChildren();
              host.style.display = "none";
            }
          }, 200);
        };

        return card;
      }

      const primaryItems = unique.slice(0, 2);
      const remainingItems = unique.slice(2);

      primaryItems.forEach((a) => grid.append(createCard(a)));
      widget.append(grid);

      if (remainingItems.length > 0) {
        const details = document.createElement("details");
        details.className = "resumeMoreDetails";
        const summary = document.createElement("summary");
        summary.className = "resumeMoreSummary";
        summary.textContent = isAr
          ? `+ عرض المزيد من الجلسات (${remainingItems.length})`
          : `+ Show ${remainingItems.length} more unfinished session${remainingItems.length > 1 ? "s" : ""}`;

        const extraGrid = document.createElement("div");
        extraGrid.className = "resumeCardsGrid resumeExtraGrid";
        remainingItems.forEach((a) => extraGrid.append(createCard(a)));

        details.append(summary, extraGrid);
        widget.append(details);
      }

      host.replaceChildren(widget);
    } catch {
      host.replaceChildren();
      host.style.display = "none";
    }
  }

  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("languagechange", () => {
      showResume();
    });
  }
  return {
    profile,
    history,
    mistakes,
    select,
    mix,
    recommendation,
    showResume,
  };
})();
