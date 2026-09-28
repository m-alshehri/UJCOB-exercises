// Homepage interactions: typing code terminal, course filter, a three-question
// quick check and the "How Tamareen works" stepper. Quick-check answers stay in
// this page only; Practice Mode is where results are saved.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = Tamareen.escape;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ar = () => I18n.lang === "ar";
  const L = (en, arText) => (ar() ? arText : en);

  /* Rotating headline word. Text changes are translated by I18n. */
  const words = [
    "Master faster.",
    "Practice.",
    "Code.",
    "Analyze.",
    "Experiment.",
    "Improve.",
  ];
  const rotator = document.querySelector(".rotator");
  let wordIndex = 0;
  if (rotator && !reduceMotion)
    setInterval(() => {
      rotator.classList.add("swap");
      setTimeout(() => {
        wordIndex = (wordIndex + 1) % words.length;
        rotator.textContent = words[wordIndex];
        rotator.classList.remove("swap");
      }, 250);
    }, 2800);

  /* Typing terminal: Python, then HTML, then SQL, typed and erased in turn. */
  const SNIPPETS = {
    py: {
      caption: "Python · Calculate total revenue",
      out: "> 730",
      code: `# Calculate total revenue
prices = [120, 85, 200]
quantity = [3, 2, 1]

revenue = sum(
    p * q for p, q
    in zip(prices, quantity)
)
print(revenue)`,
    },
    web: {
      caption: "HTML · A button that reacts",
      out: "✓ Rendered: [ Start practicing ]",
      code: `<!-- A button that reacts -->
<section class="card">
  <h2>Welcome to Tamareen</h2>
  <button id="start">
    Start practicing
  </button>
</section>`,
    },
    sql: {
      caption: "SQL · Top orders by value",
      out: "name   total\nSara   820\nOmar   540\n2 row(s)",
      code: `-- Top orders above 500
SELECT name, total
FROM orders
WHERE total >= 500
ORDER BY total DESC;`,
    },
  };
  const ORDER = ["py", "web", "sql"];
  const KEYWORDS =
    /\b(sum|for|in|zip|print|SELECT|FROM|WHERE|ORDER BY|DESC)\b/g;
  function highlight(text) {
    return text
      .split("\n")
      .map((line) => {
        const safe = esc(line);
        if (/^\s*(#|--|&lt;!--)/.test(safe))
          return `<span class="tkC">${safe}</span>`;
        return safe
          .replace(/(&lt;\/?)([a-z0-9]+)/g, '$1<span class="tkK">$2</span>')
          .replace(/(&quot;[^&]*&quot;)/g, '<span class="tkN">$1</span>')
          .replace(KEYWORDS, '<span class="tkK">$1</span>')
          .replace(/\b(\d+)\b/g, '<span class="tkN">$1</span>');
      })
      .join("\n");
  }
  const termCode = $("termCode"),
    termOut = $("termOut"),
    termCaption = $("termCaption");
  let run = 0,
    timer = null;
  const wait = (ms) =>
    new Promise((resolve) => (timer = setTimeout(resolve, ms)));
  async function playSnippet(key) {
    const id = ++run;
    clearTimeout(timer);
    const s = SNIPPETS[key];
    document
      .querySelectorAll("#liveDemo [data-action=termTab]")
      .forEach((b) => b.setAttribute("aria-selected", b.dataset.arg === key));
    termCaption.textContent = s.caption;
    termOut.textContent = "";
    termOut.classList.remove("show");
    const next = ORDER[(ORDER.indexOf(key) + 1) % ORDER.length];
    if (reduceMotion) {
      termCode.innerHTML = `<code>${highlight(s.code)}</code>`;
      termOut.textContent = s.out;
      termOut.classList.add("show");
      await wait(6000);
      if (id === run) playSnippet(next);
      return;
    }
    for (let i = 1; i <= s.code.length; i++) {
      if (id !== run) return;
      termCode.innerHTML = `<code>${highlight(s.code.slice(0, i))}<span class="cursor"></span></code>`;
      await wait(s.code[i - 1] === "\n" ? 120 : 28 + Math.random() * 40);
    }
    await wait(350);
    if (id !== run) return;
    termOut.textContent = s.out;
    termOut.classList.add("show");
    await wait(2600);
    if (id !== run) return;
    termOut.classList.remove("show");
    for (let i = s.code.length; i >= 0; i -= 3) {
      if (id !== run) return;
      termCode.innerHTML = `<code>${highlight(s.code.slice(0, i))}<span class="cursor"></span></code>`;
      await wait(8);
    }
    await wait(300);
    if (id === run) playSnippet(next);
  }

  /* Course filter */
  function filterCourses(button) {
    const group = button.dataset.arg;
    document
      .querySelectorAll(".filterChip")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    document.querySelectorAll("#grid .course").forEach((card) => {
      card.classList.toggle(
        "dimmed",
        group !== "all" && card.dataset.group !== group,
      );
    });
  }

  /* Quick check */
  const TOPICS = {
    "BCIS 313": [
      ["Variables", "المتغيرات"],
      ["Conditions", "الشروط"],
      ["Loops", "الحلقات"],
    ],
    "BCIS 311": [
      ["SELECT", "SELECT"],
      ["WHERE", "WHERE"],
      ["JOIN", "JOIN"],
    ],
    "BCIS 317": [
      ["HTML", "HTML"],
      ["CSS", "CSS"],
      ["JavaScript", "JavaScript"],
    ],
    "BCIS 324": [
      ["Processes", "العمليات"],
      ["Master data", "البيانات الرئيسية"],
      ["Integration", "التكامل"],
    ],
    "BCIS 411": [
      ["Warehouses", "المستودعات"],
      ["Dashboards", "لوحات المؤشرات"],
      ["ETL", "ETL"],
    ],
    "BCIS 421": [
      ["Functions", "الدوال"],
      ["Pivot tables", "الجداول المحورية"],
      ["Charts", "المخططات"],
    ],
  };
  // q: [english, arabic]; o: options as [english, arabic]; a: correct index;
  // e: explanation [english, arabic]; t: topic index.
  const QUESTIONS = {
    "BCIS 313": [
      {
        q: ["What does int('25') + 5 return?", "ما ناتج int('25') + 5؟"],
        o: [["30"], ["255"], ["'255'"], ["TypeError", "خطأ في النوع"]],
        a: 0,
        e: [
          "int() turns the text '25' into a whole number, so 25 + 5 = 30.",
          "int() تحوّل النص '25' إلى عدد صحيح، فيصبح الناتج 25 + 5 = 30.",
        ],
        t: 0,
      },
      {
        q: [
          "Which statement runs code only when a condition is true?",
          "أي جملة تنفّذ كودًا فقط عندما يتحقق شرط؟",
        ],
        o: [["for"], ["if"], ["print()"], ["def"]],
        a: 1,
        e: [
          "An if statement runs its block only when the condition is True.",
          "جملة if تنفّذ الكتلة التي تحتها فقط عندما يكون الشرط True.",
        ],
        t: 1,
      },
      {
        q: [
          "How many times does for i in range(3) repeat?",
          "كم مرة تتكرر الحلقة for i in range(3)؟",
        ],
        o: [["2"], ["3"], ["4"], ["Forever", "بلا نهاية"]],
        a: 1,
        e: [
          "range(3) produces 0, 1 and 2: three values.",
          "range(3) تنتج 0 و1 و2، أي ثلاث قيم.",
        ],
        t: 2,
      },
    ],
    "BCIS 311": [
      {
        q: [
          "Which part of SELECT name FROM orders chooses the columns shown?",
          "أي جزء في SELECT name FROM orders يحدد الأعمدة المعروضة؟",
        ],
        o: [["SELECT"], ["FROM"], ["WHERE"], ["ORDER BY"]],
        a: 0,
        e: [
          "SELECT lists the columns returned; here only name.",
          "SELECT تحدد الأعمدة المعروضة، وهنا عمود name فقط.",
        ],
        t: 0,
      },
      {
        q: [
          "Which clause keeps only the rows that meet a condition?",
          "أي جزء يُبقي فقط الصفوف التي تحقق شرطًا؟",
        ],
        o: [["ORDER BY"], ["GROUP BY"], ["WHERE"], ["SELECT"]],
        a: 2,
        e: [
          "WHERE filters rows, for example WHERE total >= 300.",
          "WHERE تُرشّح الصفوف، مثل WHERE total >= 300.",
        ],
        t: 1,
      },
      {
        q: [
          "Which join returns only rows that match in both tables?",
          "أي نوع ربط يعيد الصفوف المتطابقة في الجدولين فقط؟",
        ],
        o: [["LEFT JOIN"], ["INNER JOIN"], ["FULL JOIN"], ["CROSS JOIN"]],
        a: 1,
        e: [
          "INNER JOIN keeps rows that have a match in both tables.",
          "INNER JOIN يعيد الصفوف التي لها تطابق في الجدولين.",
        ],
        t: 2,
      },
    ],
    "BCIS 317": [
      {
        q: [
          "Which tag creates a link to another page?",
          "أي وسم يُنشئ رابطًا لصفحة أخرى؟",
        ],
        o: [["<link>"], ["<a>"], ["<href>"], ["<nav>"]],
        a: 1,
        e: [
          "The <a> tag with an href attribute creates a clickable link.",
          "الوسم <a> مع الخاصية href يُنشئ رابطًا قابلًا للنقر.",
        ],
        t: 0,
      },
      {
        q: [
          "Which CSS property changes the text colour?",
          "أي خاصية CSS تغيّر لون النص؟",
        ],
        o: [["background"], ["color"], ["font"], ["border"]],
        a: 1,
        e: [
          "color sets the text colour; background sets the fill behind it.",
          "color تتحكم بلون النص، و background بلون الخلفية.",
        ],
        t: 1,
      },
      {
        q: [
          "What does addEventListener('click', f) do?",
          "ماذا تفعل addEventListener('click', f)؟",
        ],
        o: [
          ["Deletes the element", "تحذف العنصر"],
          ["Runs f on each click", "تشغّل f عند كل نقرة"],
          ["Changes the colour", "تغيّر اللون"],
          ["Reloads the page", "تعيد تحميل الصفحة"],
        ],
        a: 1,
        e: [
          "It registers f to run every time the element is clicked.",
          "تسجّل الدالة f لتُنفّذ كلما نُقر العنصر.",
        ],
        t: 2,
      },
    ],
    "BCIS 324": [
      {
        q: [
          "Which process starts with a purchase requisition and ends with paying the supplier?",
          "أي عملية تبدأ بطلب شراء وتنتهي بالدفع للمورد؟",
        ],
        o: [
          ["Order-to-Cash"],
          ["Procure-to-Pay"],
          ["Hire-to-Retire"],
          ["Plan-to-Produce"],
        ],
        a: 1,
        e: [
          "Procure-to-Pay covers purchasing from the request to supplier payment.",
          "Procure-to-Pay تغطي دورة الشراء من الطلب حتى سداد المورد.",
        ],
        t: 0,
      },
      {
        q: [
          "Stable customer and product records are called:",
          "بيانات العميل والمنتج الثابتة تُسمى:",
        ],
        o: [
          ["Transaction data", "بيانات المعاملات"],
          ["Master data", "البيانات الرئيسية"],
          ["Temporary data", "البيانات المؤقتة"],
          ["Report data", "بيانات التقارير"],
        ],
        a: 1,
        e: [
          "Master data changes rarely and is reused by many transactions.",
          "البيانات الرئيسية ثابتة نسبيًا وتُستخدم في معاملات كثيرة.",
        ],
        t: 1,
      },
      {
        q: [
          "What is the main benefit of an ERP system?",
          "ما الميزة الأساسية لنظام ERP؟",
        ],
        o: [
          [
            "One shared database for all departments",
            "قاعدة بيانات مشتركة لكل الإدارات",
          ],
          ["Faster email", "بريد إلكتروني أسرع"],
          ["Website design", "تصميم مواقع"],
          ["A separate accounting tool", "برنامج محاسبة منفصل"],
        ],
        a: 0,
        e: [
          "ERP links departments through shared data, so information flows without re-entry.",
          "ERP يربط الإدارات ببيانات مشتركة فتنتقل المعلومة دون إدخال مكرر.",
        ],
        t: 2,
      },
    ],
    "BCIS 411": [
      {
        q: [
          "A data warehouse is designed mainly for:",
          "مستودع البيانات مصمم أساسًا من أجل:",
        ],
        o: [
          ["Daily transactions", "المعاملات اليومية"],
          ["Analysis and reporting", "التحليل والتقارير"],
          ["Storing images", "تخزين الصور"],
          ["Email", "البريد"],
        ],
        a: 1,
        e: [
          "A warehouse holds organised historical data to support analysis.",
          "مستودع البيانات يجمع بيانات تاريخية منظمة لدعم التحليل.",
        ],
        t: 0,
      },
      {
        q: [
          "What shows key performance indicators visually on one screen?",
          "ما الذي يعرض مؤشرات الأداء الرئيسية بصريًا في شاشة واحدة؟",
        ],
        o: [
          ["A dashboard", "لوحة مؤشرات"],
          ["A database", "قاعدة بيانات"],
          ["A raw spreadsheet", "جدول بيانات خام"],
          ["An SQL query", "استعلام SQL"],
        ],
        a: 0,
        e: [
          "A dashboard brings KPIs together in one visual view.",
          "لوحة المؤشرات تجمع مؤشرات الأداء في عرض مرئي واحد.",
        ],
        t: 1,
      },
      {
        q: ["What does the T in ETL stand for?", "ماذا تعني T في ETL؟"],
        o: [["Transfer"], ["Transform"], ["Test"], ["Track"]],
        a: 1,
        e: [
          "Transform: cleaning and reshaping data before loading it.",
          "Transform: تنظيف البيانات وتحويلها قبل تحميلها.",
        ],
        t: 2,
      },
    ],
    "BCIS 421": [
      {
        q: [
          "Which function adds up values that meet one condition?",
          "أي دالة تجمع القيم التي تحقق شرطًا واحدًا؟",
        ],
        o: [["COUNT"], ["VLOOKUP"], ["SUMIF"], ["AVERAGE"]],
        a: 2,
        e: [
          "SUMIF(range, criteria, sum_range) adds only the matching values.",
          "SUMIF(range, criteria, sum_range) تجمع القيم المطابقة للشرط فقط.",
        ],
        t: 0,
      },
      {
        q: [
          "Which tool best summarises sales by city and month?",
          "ما الأداة الأنسب لتلخيص المبيعات حسب المدينة والشهر؟",
        ],
        o: [
          ["Pivot table", "جدول محوري"],
          ["Conditional formatting", "تنسيق شرطي"],
          ["Data validation", "التحقق من البيانات"],
          ["Freeze panes", "تجميد الأجزاء"],
        ],
        a: 0,
        e: [
          "A pivot table summarises data across two or more dimensions.",
          "الجدول المحوري يلخّص البيانات عبر بعدين أو أكثر بسرعة.",
        ],
        t: 1,
      },
      {
        q: [
          "Which chart best shows a sales trend across months?",
          "أي مخطط يناسب إظهار اتجاه المبيعات عبر الأشهر؟",
        ],
        o: [
          ["Pie", "دائري"],
          ["Line", "خطي"],
          ["Scatter", "مبعثر"],
          ["Radar", "راداري"],
        ],
        a: 1,
        e: [
          "A line chart shows change over time.",
          "المخطط الخطي يوضّح التغير عبر الزمن.",
        ],
        t: 2,
      },
    ],
  };
  const pick = (pair) => (ar() && pair[1] ? pair[1] : pair[0]);
  const digits = (n) =>
    ar() ? String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]) : String(n);
  let course = "BCIS 313",
    qi = 0,
    results = [],
    chosen = null,
    streak = 0;

  function renderQuestion() {
    const list = QUESTIONS[course],
      name = COURSES[course]?.name || course;
    $("qcSub").textContent =
      course +
      " · " +
      I18n.t(name) +
      " · " +
      I18n.t("Instant feedback after every answer");
    const dots = list
      .map((_, i) => {
        const cls =
          i < results.length
            ? results[i]
              ? "ok"
              : "bad"
            : i === qi
              ? "cur"
              : "";
        return `<i class="${cls}"></i>`;
      })
      .join("");
    const card = $("qcCard");
    if (qi >= list.length) {
      const n = results.filter(Boolean).length;
      card.innerHTML = `<div class="qcHead"><span>${esc(L("Quick check complete", "اكتمل التحدي"))}</span><div class="qcDots">${dots}</div></div>
        <p class="qcQuestion">${esc(L(`You got ${n} of ${list.length}`, `حصلت على ${digits(n)} من ${digits(list.length)}`))}</p>
        <p class="qcNote">${esc(L("Ready for more? Practice Mode gives you 10 questions and saves your mastery.", "جاهز للمزيد؟ وضع التدريب يعطيك ١٠ أسئلة ويحفظ إتقانك."))}</p>
        <div class="qcActions"><button type="button" class="btn pri" data-action="chooseCourse" data-arg="${esc(course)}">${esc(L("Open Practice Mode", "افتح وضع التدريب"))}</button><button type="button" class="btn sec" data-action="qcRetry">${esc(L("Try again", "حاول مرة أخرى"))}</button></div>`;
      return;
    }
    const q = list[qi],
      topic = pick(TOPICS[course][q.t]);
    const answered = chosen !== null;
    const options = q.o
      .map((o, i) => {
        let cls = "";
        if (answered && i === q.a) cls = " good";
        else if (answered && i === chosen) cls = " wrong";
        return `<button type="button" class="qcOpt${cls}" data-action="qcAnswer" data-arg="${i}"${answered ? " disabled" : ""}><b>${esc(L("ABCD"[i], "أبجد"[i]))}</b><span dir="auto">${esc(pick(o))}</span></button>`;
      })
      .join("");
    const ok = chosen === q.a;
    const feedback = answered
      ? `<div class="qcFeed ${ok ? "good" : "wrong"}">${esc(ok ? L("✓ Correct", "✓ إجابة صحيحة") : L("✗ Not quite", "✗ ليست الإجابة الصحيحة"))}<p dir="auto">${esc(pick(q.e))}</p></div>
         <div class="qcActions"><button type="button" class="btn pri" data-action="qcNext">${esc(qi < list.length - 1 ? L("Next question", "السؤال التالي") : L("See result", "عرض النتيجة"))}</button></div>`
      : "";
    card.innerHTML = `<div class="qcHead"><span>${esc(L(`Question ${qi + 1} of ${list.length}`, `السؤال ${digits(qi + 1)} من ${digits(list.length)}`))} · ${esc(topic)}</span><div class="qcDots">${dots}</div></div>
      <p class="qcQuestion" dir="auto">${esc(pick(q.q))}</p>
      <div class="qcOpts">${options}</div>${feedback}`;
  }
  function renderSide() {
    const list = QUESTIONS[course];
    const pct = results.length
      ? Math.round((100 * results.filter(Boolean).length) / results.length)
      : 0;
    $("qcRingFg").style.strokeDashoffset = String(314.16 * (1 - pct / 100));
    $("qcRingVal").textContent = digits(pct) + (ar() ? "٪" : "%");
    $("qcStreak").textContent = digits(streak);
    $("qcTopics").innerHTML = TOPICS[course]
      .map((t, ti) => {
        const idx = list
          .map((q, i) => (q.t === ti && i < results.length ? i : -1))
          .filter((i) => i >= 0);
        const right = idx.filter((i) => results[i]).length;
        const p = idx.length ? Math.round((100 * right) / idx.length) : 0;
        const label = idx.length
          ? digits(p) + (ar() ? "٪" : "%")
          : L("Not tried", "لم يُجرّب");
        return `<div class="qcTopic"><span>${esc(pick(t))}</span><span>${esc(label)}</span><div class="qcTrack"><i style="width:${p}%"></i></div></div>`;
      })
      .join("");
  }
  function startQuickCheck(code, scroll) {
    if (!QUESTIONS[code]) return;
    course = code;
    qi = 0;
    results = [];
    chosen = null;
    renderQuestion();
    renderSide();
    if (scroll)
      $("quickCheck").scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
  }
  function answer(i) {
    if (chosen !== null) return;
    chosen = i;
    const ok = i === QUESTIONS[course][qi].a;
    results.push(ok);
    streak = ok ? streak + 1 : 0;
    renderQuestion();
    renderSide();
    $("qcCard")
      .querySelector("[data-action=qcNext]")
      ?.focus({ preventScroll: true });
  }

  /* How Tamareen works stepper */
  const STEP_DETAILS = [
    "Multiple-choice practice and Python, SQL and Web labs linked to your course topics.",
    "Every answer shows an explanation, and the AI tutor can give a hint without revealing the answer.",
    "Your practice history shows which topics are weaker, and your next practice focuses on them.",
    "Course Mastery and Topic Mastery in My Progress show how far you have come.",
  ];
  let step = 0,
    stepTimer = null,
    stepPaused = reduceMotion;
  function showStep(n) {
    step = n;
    document
      .querySelectorAll(".workStep")
      .forEach((b, i) => b.setAttribute("aria-selected", String(i === n)));
    $("workDetail").textContent = STEP_DETAILS[n];
    const bar = $("workProgress");
    bar.classList.remove("go");
    void bar.offsetWidth;
    if (!stepPaused) bar.classList.add("go");
    clearTimeout(stepTimer);
    if (!stepPaused)
      stepTimer = setTimeout(
        () => showStep((step + 1) % STEP_DETAILS.length),
        4500,
      );
  }
  // Pause the auto-advance while the reader hovers or focuses the steps.
  const works = $("howItWorks");
  const pause = () => {
    stepPaused = true;
    clearTimeout(stepTimer);
    $("workProgress").classList.remove("go");
  };
  const resume = () => {
    if (reduceMotion) return;
    stepPaused = false;
    showStep(step);
  };
  works.addEventListener("mouseenter", pause);
  works.addEventListener("mouseleave", resume);
  works.addEventListener("focusin", pause);
  works.addEventListener("focusout", (e) => {
    if (!works.contains(e.relatedTarget)) resume();
  });

  Tamareen.actions({
    termTab: (el) => playSnippet(el.dataset.arg),
    filterCourses: (el) => filterCourses(el),
    quickCheck: (el) => startQuickCheck(el.dataset.arg, true),
    qcAnswer: (el) => answer(Number(el.dataset.arg)),
    qcNext: () => {
      qi++;
      chosen = null;
      renderQuestion();
    },
    qcRetry: () => startQuickCheck(course, false),
    workStep: (el) => showStep(Number(el.dataset.arg)),
  });
  window.addEventListener("languagechange", () => {
    renderQuestion();
    renderSide();
  });

  playSnippet("py");
  startQuickCheck(course, false);
  showStep(0);
})();
