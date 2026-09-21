window.Pathways = (() => {
  const config = {
    "BCIS 313": [
      ["Python foundations", "أساسيات بايثون", 0, 12],
      ["Conditions and errors", "الشروط والأخطاء", 12, 17],
      ["Functions", "الدوال", 17, 20],
      ["Loops", "الحلقات", 20, 22],
      ["Data structures", "هياكل البيانات", 22, 25],
    ],
    "BCIS 311": [
      ["Relational foundations", "أساسيات قواعد البيانات", 0, 6],
      ["Keys and relationships", "المفاتيح والعلاقات", 6, 13],
      ["Normalization", "تطبيع البيانات", 13, 17],
      ["Query and aggregate", "الاستعلام والتجميع", 17, 22],
      ["Modify data", "تعديل البيانات", 22, 25],
    ],
    "BCIS 317": [
      ["Web foundations", "أساسيات الويب", 0, 10],
      ["Build a page", "بناء الصفحة", 10, 16],
      ["Responsive and accessible", "التجاوب وإمكانية الوصول", 16, 20],
      ["Publish and operate", "النشر والتشغيل", 20, 25],
    ],
    "BCIS 324": [
      ["Integrated processes", "العمليات المتكاملة", 0, 6],
      ["Business modules", "وحدات الأعمال", 6, 13],
      ["Implementation", "التنفيذ", 13, 17],
      ["Data migration", "ترحيل البيانات", 17, 20],
      ["Adoption and support", "التبني والدعم", 20, 25],
    ],
    "BCIS 411": [
      ["Data foundations", "أساسيات البيانات", 0, 8],
      ["Analytical models", "النماذج التحليلية", 8, 14],
      ["Measures and dashboards", "المقاييس ولوحات المعلومات", 14, 17],
      ["Explore and govern", "الاستكشاف والحوكمة", 17, 25],
    ],
    "BCIS 421": [
      ["Analytics foundations", "أساسيات التحليل", 0, 5],
      ["Summarize data", "تلخيص البيانات", 5, 12],
      ["Visual relationships", "تصوير العلاقات", 12, 16],
      ["Models and preparation", "النماذج وإعداد البيانات", 16, 25],
    ],
  };
  function lessons(code) {
    const topics = [
      ...new Set(COURSES[code].questions.map((q) => q.topic)),
    ].slice(0, 25);
    return config[code].map(([name, ar, start, end], index) => ({
      name,
      ar,
      index,
      topics: topics.slice(start, end),
    }));
  }
  function stageAnswers(code, index, answers) {
    const names = new Set(lessons(code)[index].topics);
    return answers.filter(
      (a) =>
        a.questions?.courses?.code === code &&
        names.has(a.questions?.topics?.name),
    );
  }
  function progress(code, answers, now = Date.now()) {
    return lessons(code).map((l) => {
      const unique = new Map();
      for (const a of stageAnswers(code, l.index, answers)) {
        const old = unique.get(a.question_id);
        if (!old || a.answered_at > old.answered_at)
          unique.set(a.question_id, a);
      }
      const recent = [...unique.values()].filter(
          (a) => now - new Date(a.answered_at) < 30 * 86400000,
        ),
        total = recent.length,
        pct = total
          ? Math.round(
              (100 * recent.filter((a) => a.is_correct).length) / total,
            )
          : 0;
      return { ...l, total, pct, strong: total >= 3 && pct >= 70 };
    });
  }
  function diagnostic(source, code) {
    const out = [];
    for (const l of lessons(code)) {
      const pool = Tamareen.shuffle(
        source.filter((q) => l.topics.includes(q.topic)),
      );
      const topics = new Set();
      for (const q of pool) {
        if (topics.has(q.topic)) continue;
        out.push(q);
        topics.add(q.topic);
        if (topics.size >= 2) break;
      }
    }
    return out.slice(0, 10);
  }
  function schedule(answers, now = Date.now()) {
    const grouped = new Map();
    for (const a of answers) {
      if (!a.questions) continue;
      const id = a.question_id;
      if (!grouped.has(id)) grouped.set(id, []);
      grouped.get(id).push(a);
    }
    return [...grouped.values()]
      .map((xs) => {
        xs.sort((a, b) => new Date(a.answered_at) - new Date(b.answered_at));
        let streak = 0,
          day = "";
        for (const a of xs) {
          const d = a.answered_at.slice(0, 10);
          if (!a.is_correct) {
            streak = 0;
            day = d;
          } else if (d !== day) {
            streak++;
            day = d;
          }
        }
        const last = xs.at(-1),
          interval = last.is_correct
            ? [1, 3, 7, 14, 30][Math.min(Math.max(streak - 1, 0), 4)]
            : 0,
          dueAt = new Date(last.answered_at).getTime() + interval * 86400000;
        return {
          ...last,
          latest: last,
          reviewed: last.is_correct,
          hadMistake: xs.some((a) => !a.is_correct),
          interval,
          dueAt,
          due: now >= dueAt,
        };
      })
      .sort((a, b) => a.dueAt - b.dueAt);
  }
  return { lessons, progress, diagnostic, schedule };
})();
