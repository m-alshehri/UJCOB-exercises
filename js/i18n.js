window.I18n = (() => {
  const dictionary = {
    "Completion queued on this device. Reconnect to sync.": "حُفظ الإنجاز مؤقتًا على هذا الجهاز. ستتم المزامنة عند عودة الاتصال.",
    "My learning today": "تعلمي اليوم",
    "Labs": "المختبرات",
    "Main navigation": "التنقل الرئيسي",
    "Instructor dashboard": "لوحة المدرس",
    "Notifications": "الإشعارات",
    "Choose a lab to practise your course skills.": "اختر مختبرًا لتطبيق مهارات المقرر.",
    "Choose a project, read the requirements, practise in the lab, then submit your work and tests.": "اختر مشروعًا واقرأ متطلباته وتدرّب في المختبر، ثم سلّم عملك واختباراتك.",
    "All courses": "جميع المقررات",
    "Deliverables": "المخرجات المطلوبة",
    "Example": "مثال",
    "Executable tests in the lab": "اختبارات تنفيذية داخل المختبر",
    "Instructor-reviewed project: submit your work and evidence.": "يقيّم المدرس هذا المشروع: سلّم عملك والأدلة الداعمة.",
    "Open related lab": "فتح المختبر المرتبط",
    "Start project submission": "بدء تسليم المشروع",
    "Assignment": "التكليف",
    "Independent project": "مشروع مستقل",
    "Your work (code or report)": "عملك (كود أو تقرير)",
    "Save assignment draft": "حفظ مسودة التكليف",
    "Load assignment draft": "تحميل مسودة التكليف",
    "Local storage unavailable. Keep this page open until cloud saving succeeds.": "التخزين المحلي غير متاح. أبقِ الصفحة مفتوحة حتى ينجح الحفظ السحابي.",
    "Local draft restored.": "تمت استعادة المسودة المحلية.",
    "Your edits will be saved on this device.": "ستُحفظ تعديلاتك على هذا الجهاز.",
    "Saved on this device. Cloud saving pending.": "تم الحفظ على هذا الجهاز، وبانتظار الحفظ السحابي.",
    "Saved on this device. Reconnect to sync.": "تم الحفظ على هذا الجهاز. ستتم المزامنة عند عودة الاتصال.",
    "Draft changed on another device. Load the cloud draft before saving.": "تغيرت المسودة من جهاز آخر. حمّل المسودة السحابية قبل الحفظ.",
    "Cloud draft differs. Choose the cloud version or keep your local version.": "تختلف المسودة السحابية. اختر النسخة السحابية أو احتفظ بنسختك المحلية.",
    "Keep local version": "الاحتفاظ بالنسخة المحلية",
    "Needs revision": "يحتاج تعديل",
    "Submitted": "تم التسليم",
    "Draft": "مسودة",
    "View submitted work": "عرض العمل المُسلّم",
    "Review outcome": "نتيجة المراجعة",
    "Feedback only": "ملاحظات فقط",
    "Project submission": "تسليم مشروع",
    "New assignment": "تكليف جديد",
    "Revision requested": "طُلب تعديل عملك",
    "Your notifications": "إشعاراتك",
    "No notifications yet.": "لا توجد إشعارات حتى الآن.",
    "Mark all as read": "تحديد الكل كمقروء",
    "Mark as read": "تحديد كمقروء",
    "Read": "مقروء",
    "Open activity": "فتح النشاط",
    "Some activities could not load. Refresh to retry.": "تعذر تحميل بعض الأنشطة. حدّث الصفحة لإعادة المحاولة.",
    "Your next step, reviews and assignments in one place.": "خطوتك التالية والمراجعات والتكليفات في مكان واحد.",
    "Continue your last lab draft": "متابعة آخر مسودة في المختبر",
    "Continue your practice": "متابعة تدريبك",
    "Choose your next learning path": "اختر مسار تعلمك التالي",
    "Review due questions": "مراجعة الأسئلة المستحقة",
    "Recommended now": "المقترح الآن",
    "Start now": "ابدأ الآن",
    "Continue learning": "متابعة التعلم",
    "Continue": "متابعة",
    "No unfinished activities.": "لا توجد أنشطة غير مكتملة.",
    "Due reviews": "المراجعات المستحقة",
    "questions ready for review": "أسئلة جاهزة للمراجعة",
    "Next learning step": "خطوة التعلم التالية",
    "Your assignments": "تكليفاتك",
    "Due": "موعد التسليم",
    "No due date": "دون موعد تسليم",
    "No pending assignments.": "لا توجد تكليفات معلّقة.",
    "Complete": "مكتمل",
    "Not started": "لم يبدأ",
    "Overdue": "متأخر",
    "Saving draft…": "جارٍ حفظ المسودة…",
    "Cloud draft saved.": "تم حفظ المسودة سحابيًا.",
    "Cloud draft restored.": "تمت استعادة المسودة السحابية.",
    "Sign in with the same account to save this result.": "سجّل الدخول بالحساب نفسه لحفظ هذه النتيجة.",
    "Practice completion": "إنجاز التدريب",
    "SQL sales report": "تقرير المبيعات باستخدام SQL",
    "Accessible storefront": "واجهة متجر متاحة للجميع",
    "Order-to-cash process": "عملية الطلب حتى التحصيل",
    "Business KPI scorecard": "بطاقة مؤشرات أداء الأعمال",
    "Campaign performance analysis": "تحليل أداء الحملات",

    Courses: "المقررات",
    Resources: "المراجع",
    "My Progress": "تقدمي",
    "Review mistakes": "المراجعة",
    Projects: "المشاريع",
    Groups: "المجموعات",
    Submissions: "التسليمات",
    "Learning paths": "مسارات التعلم",
    "Content studio": "إدارة المحتوى",
    "Question quality": "جودة الأسئلة",
    "Project submissions": "تسليمات المشاريع",
    Login: "تسجيل الدخول",
    Logout: "تسجيل الخروج",
    "Sign up": "إنشاء حساب",
    Email: "البريد الإلكتروني",
    Password: "كلمة المرور",
    "Confirm password": "تأكيد كلمة المرور",
    "Student name": "اسم الطالب",
    "STUDENT ACCOUNT": "حساب الطالب",
    "Login to tamareen": "تسجيل الدخول إلى تمارين",
    "Sign in to save your attempts and follow your learning progress.":
      "سجّل الدخول لحفظ محاولاتك ومتابعة تقدمك.",
    "Your account is used to save quiz attempts, scores and learning activity. You can use the same account from different devices.":
      "يُستخدم حسابك لحفظ المحاولات والنتائج ونشاط التعلم. يمكنك استخدام الحساب نفسه من أجهزة مختلفة.",
    "Interactive learning & self-assessment": "تعلم تفاعلي وتقييم ذاتي",
    "Learn by doing.": "تعلّم بالتطبيق.",
    LEARNING: "التعلم",
    PROJECT: "المشروع",
    "GitHub Repository": "مستودع المشروع",
    "Course References": "مراجع المقرر",
    "Interactive Practice": "تدريب تفاعلي",
    "Skip to content": "الانتقال إلى المحتوى",
    "Open navigation": "فتح القائمة",
    "Tamareen home": "الرئيسية",
    "Tamareen logo": "شعار تمارين",
    "GitHub repository": "مستودع المشروع",
    Practice: "تدرّب",
    "Practice.": "تدرّب.",
    "Code.": "اكتب الكود.",
    "Analyze.": "حلّل.",
    "Experiment.": "جرّب.",
    "Improve.": "تطوّر.",
    "Practice smarter.": "تدرّب بذكاء.",
    "Master faster.": "أتقن أسرع.",
    "SMARTER PRACTICE FOR BUSINESS STUDENTS": "تدريب أذكى لطلاب الأعمال",
    "Interactive practice, coding labs, adaptive mastery tracking and AI tutoring — built around your UJ College of Business courses.":
      "تدريب تفاعلي ومختبرات برمجة ومتابعة للإتقان ومساعد تعليمي، مصممة لمقررات كلية الأعمال بجامعة جدة.",
    "Start practicing →": "ابدأ التدريب ←",
    "View My Progress →": "شاهد تقدمك ←",
    "6 learning spaces": "٦ مساحات للتعلم",
    "Instant feedback": "تغذية راجعة فورية",
    "Course-aligned scenarios": "سيناريوهات مرتبطة بالمقرر",
    "Why Tamareen?": "لماذا تمارين؟",
    "Smarter practice designed around how students learn":
      "تدريب أذكى يناسب طريقة تعلم الطلاب",
    "AI-driven Tutoring": "مساعد تعليمي ذكي",
    "Get intelligent hints and concept explanations while practicing, helping you understand the reasoning without simply revealing the answer.":
      "احصل على تلميحات وشروحات أثناء التدريب تساعدك على فهم طريقة التفكير قبل الوصول للإجابة.",
    "Learn by Doing": "التعلم بالتطبيق",
    "Move beyond multiple-choice questions with hands-on Python, SQL and Web coding labs, instant checking, and live feedback.":
      "طبّق مهاراتك في مختبرات بايثون وSQL والويب مع فحص فوري وتغذية راجعة مباشرة.",
    "Adaptive Learning": "التعلم التكيفي",
    "Tamareen learns from your practice history, identifies weaker topics, and guides you toward the areas that need more attention.":
      "تستفيد تمارين من سجل تدريبك لتحديد الموضوعات التي تحتاج إلى مزيد من التدريب وتوجيهك إليها.",
    "Learning analytics": "تحليلات التعلم",
    "Your performance is continuously reflected in Course Mastery and Topic Mastery, so your next practice session can focus on the areas where improvement matters most.":
      "ينعكس أداؤك في إتقان المقررات والموضوعات لتوجيه التدريب القادم نحو المهارات التي تحتاج إلى تحسين.",
    "How Tamareen works": "كيف تعمل تمارين؟",
    "A continuous loop designed to turn practice into mastery.":
      "خطوات متتابعة لتحويل التدريب إلى إتقان.",
    "Choose a course": "اختر مقررًا",
    "Answer questions and write code": "أجب عن الأسئلة واكتب الكود",
    "Understand mistakes instantly": "افهم أخطاءك فورًا",
    "Identify your weaker topics": "تعرّف على ما يحتاج إلى تدريب",
    "Track improvement over time": "تابع تطورك مع الوقت",
    Ask: "اسأل",
    Adapt: "تكيّف",
    Master: "أتقن",
    "CONTINUE LEARNING": "واصل التعلم",
    "Pick up where you left off": "أكمل من حيث توقفت",
    "Pick a subject and start practicing": "اختر مادة وابدأ التدريب",
    "Ready for your next practice?": "جاهز للتدريب القادم؟",
    "Choose a course and start improving one question at a time.":
      "اختر مقررًا وطوّر مستواك سؤالًا بعد سؤال.",
    "See it in action": "شاهد طريقة العمل",
    "Choose another course": "اختر مقررًا آخر",
    "Change course": "تغيير المقرر",
    Back: "رجوع",
    Next: "التالي",
    "Next question": "السؤال التالي",
    "Next exercise": "التمرين التالي",
    "Check answer": "تحقق من الإجابة",
    "Check task": "تحقق من المهمة",
    Reset: "إعادة ضبط",
    "Run & Check": "تشغيل وفحص",
    "Run code": "تشغيل الكود",
    "Random exercise": "تمرين عشوائي",
    "Practice Mode": "وضع التدريب",
    "Mock Exam": "اختبار تجريبي",
    "Exam simulation": "محاكاة الاختبار",
    "Immediate feedback": "تغذية راجعة مباشرة",
    "10 questions randomly selected from the question bank.":
      "١٠ أسئلة مختارة عشوائيًا من بنك الأسئلة.",
    "10 random questions · 10-minute timer · no immediate feedback.":
      "١٠ أسئلة عشوائية · ١٠ دقائق · النتيجة عند الانتهاء.",
    "10 random questions with immediate feedback and explanations.":
      "١٠ أسئلة مع تغذية راجعة وشروحات فورية.",
    "Choose how you want to practice.": "اختر طريقة التدريب.",
    "QUIZ COMPLETED": "اكتملت المحاولة",
    "New random attempt": "محاولة عشوائية جديدة",
    Score: "النتيجة",
    Mode: "الوضع",
    Date: "التاريخ",
    Question: "السؤال",
    Topic: "الموضوع",
    Course: "المقرر",
    All: "الكل",
    "All courses": "كل المقررات",
    "All questions": "كل الأسئلة",
    "All mistakes": "كل الأخطاء",
    Reviewed: "تمت المراجعة",
    "Due for review": "حان وقت المراجعة",
    "Review status": "حالة المراجعة",
    "Practice due questions": "تدرّب على أسئلة المراجعة",
    "Review all practiced concepts, including correct answers. Reviews are scheduled after 1, 3, 7, 14 and 30 days; a mistake brings the question back immediately.":
      "راجع كل المفاهيم التي تدربت عليها، بما فيها الإجابات الصحيحة. تتكرر المراجعة بعد يوم ثم ٣ و٧ و١٤ و٣٠ يومًا؛ والخطأ يعيد السؤال للمراجعة فورًا.",
    "Review answer and explanation": "عرض الإجابة والشرح",
    "Practice this question again →": "تدرّب على هذا السؤال مجددًا ←",
    "No mistakes match these filters. Complete a quiz to build your review list.":
      "لا توجد أسئلة مطابقة. أكمل تدريبًا لبناء قائمة مراجعتك.",
    "Next review": "المراجعة القادمة",
    "Your earlier answer:": "إجابتك السابقة:",
    "Correct answer:": "الإجابة الصحيحة:",
    "Why each option is right or wrong": "لماذا كل خيار صحيح أو خاطئ؟",
    "This question is archived. Review the explanation above.":
      "هذا السؤال مؤرشف. يمكنك مراجعة الشرح أعلاه.",
    "LEARN FROM FEEDBACK": "تعلم من التغذية الراجعة",
    "LEARN WITH A PLAN": "تعلم بخطة واضحة",
    "Start with a short diagnostic, then follow the recommended step. All steps remain available.":
      "ابدأ باختبار تشخيصي قصير، ثم اتبع الخطوة المقترحة. تظل جميع الخطوات متاحة لك.",
    "Your next step →": "خطوتك التالية ←",
    "Your next step": "خطوتك التالية",
    "Take a diagnostic →": "ابدأ التشخيص ←",
    "Spaced review →": "المراجعة المتباعدة ←",
    "Recommended starting point": "نقطة البداية المقترحة",
    "Mastery needs 3 distinct recent questions and 70% accuracy.":
      "يتطلب الإتقان ٣ أسئلة مختلفة حديثة ودقة ٧٠٪.",
    "Latest diagnostic": "آخر تشخيص",
    "Apply your skills in the lab": "طبّق مهاراتك في المختبر",
    Ready: "جاهز",
    "Keep learning": "واصل التعلم",
    "Distinct questions": "الأسئلة المختلفة",
    Accuracy: "الدقة",
    "Practice this step": "تدرّب على هذه الخطوة",
    "LEARNING ACTIVITY": "نشاط التعلم",
    "Your saved practice activity and recent results.":
      "نشاطك المحفوظ ونتائجك الأخيرة.",
    "Completed attempts": "المحاولات المكتملة",
    "Average score": "متوسط النتيجة",
    "Best score": "أفضل نتيجة",
    "Course mastery": "إتقان المقررات",
    "Topic mastery": "إتقان الموضوعات",
    "Lab progress": "تقدم المختبرات",
    "Activity over time": "النشاط مع الوقت",
    "Recent attempts": "المحاولات الأخيرة",
    "Average score by course.": "متوسط النتيجة لكل مقرر.",
    "Performance across the topics you have answered.":
      "أداؤك في الموضوعات التي أجبت عنها.",
    "Completed exercises across your coding and analytics labs.":
      "التمارين المكتملة في مختبرات البرمجة والتحليل.",
    "Attempts and average score from your recent learning activity.":
      "المحاولات ومتوسط النتائج في نشاطك التعليمي الأخير.",
    "Personal practice results · not verified grades.":
      "نتائج تدريب شخصية وليست درجات معتمدة.",
    "Personal practice results · not verified grades. Statistics cover all completed attempts; the history lists the latest 30.":
      "نتائج تدريب شخصية وليست درجات معتمدة. تشمل الإحصاءات كل المحاولات المكتملة، ويعرض السجل أحدث ٣٠ محاولة.",
    "Build a broader picture. More distinct questions are needed before identifying a weak topic.":
      "كوّن صورة أوضح عن مستواك. نحتاج إلى أسئلة مختلفة أكثر قبل تحديد موضوع يحتاج إلى تدريب.",
    "Activity chart data": "بيانات مخطط النشاط",
    "Course chart data": "بيانات مخطط المقررات",
    "Topic chart data": "بيانات مخطط الموضوعات",
    "Chart. Equivalent data is listed below.":
      "مخطط. البيانات المقابلة متاحة أدناه.",
    "Python Coding Lab": "مختبر بايثون",
    "SQL Coding Lab": "مختبر SQL",
    "Web Coding Lab": "مختبر الويب",
    "Python Coding Practice": "تدريب برمجة بايثون",
    "SQL Coding Practice": "تدريب SQL",
    "ERP Process Lab": "مختبر عمليات ERP",
    "BI Analytics Lab": "مختبر ذكاء الأعمال",
    "Data Analytics Lab": "مختبر تحليل البيانات",
    "33 hands-on exercises · automatic test cases · progressive difficulty":
      "٣٣ تمرينًا عمليًا · اختبارات تلقائية · صعوبة متدرجة",
    "33 hands-on exercises · live practice database · automatic result checking":
      "٣٣ تمرينًا عمليًا · قاعدة بيانات للتدريب · فحص تلقائي للنتائج",
    "Python engine loads on your first run.":
      "يُحمّل محرك بايثون عند أول تشغيل.",
    "SQL engine loads on your first run.": "يُحمّل محرك SQL عند أول تشغيل.",
    "Python runs locally in an isolated worker.":
      "يعمل بايثون محليًا في بيئة معزولة.",
    "Running Python in an isolated worker…":
      "جارٍ تشغيل بايثون في بيئة معزولة…",
    Basics: "الأساسيات",
    Conditions: "الشروط",
    Loops: "الحلقات",
    Functions: "الدوال",
    Strings: "النصوص",
    Lists: "القوائم",
    Dictionaries: "القواميس",
    Mixed: "مهارات متنوعة",
    Beginner: "مبتدئ",
    Intermediate: "متوسط",
    Advanced: "متقدم",
    Example: "مثال",
    "Console / test results": "وحدة التحكم / نتائج الاختبار",
    "Query result / checker": "نتيجة الاستعلام / الفحص",
    "Practice database": "قاعدة بيانات التدريب",
    "Live Preview": "معاينة مباشرة",
    "Edit the code, then run and check your work.":
      "عدّل الكود ثم شغّله وتحقق من النتيجة.",
    "Write HTML, CSS and JavaScript and see the result instantly.":
      "اكتب HTML وCSS وJavaScript وشاهد النتيجة مباشرة.",
    "Practice support": "مساعدة التدريب",
    "Show next hint": "عرض التلميح التالي",
    "Save cloud draft": "حفظ المسودة السحابية",
    "Load cloud draft": "تحميل المسودة السحابية",
    "Test contract": "متطلبات الاختبار",
    "Connecting draft storage…": "جارٍ الاتصال بحفظ المسودات…",
    "Loading cloud draft…": "جارٍ تحميل المسودة السحابية…",
    "No cloud draft yet. Edits are saved after you pause.":
      "لا توجد مسودة سحابية بعد. تُحفظ التعديلات بعد توقفك عن الكتابة.",
    "Cloud draft saved.": "حُفظت المسودة السحابية.",
    "Cloud draft restored.": "استُعيدت المسودة السحابية.",
    "Saving draft…": "جارٍ حفظ المسودة…",
    "Cloud version loaded.": "حُمّلت النسخة السحابية.",
    "Cloud draft available. Local edits are preserved; use Load cloud draft to replace them.":
      "توجد مسودة سحابية. احتُفظ بتعديلاتك المحلية؛ استخدم تحميل المسودة لاستبدالها.",
    "No cloud version exists yet. You can save this draft.":
      "لا توجد نسخة سحابية بعد. يمكنك حفظ هذه المسودة.",
    "Wait for the draft to load, or switch away and back to retry.":
      "انتظر تحميل المسودة، أو انتقل إلى تمرين آخر ثم ارجع للمحاولة.",
    "Completion saved.": "حُفظ الإنجاز.",
    "Correct! All checks passed.": "صحيح! اجتازت الإجابة جميع الاختبارات.",
    "Lab tutor": "المساعد التعليمي للمختبر",
    "Send this exercise, your code and test output to the AI tutor for a hint. Do not include passwords or personal data.":
      "أرسل التمرين والكود ونتيجة الاختبار إلى المساعد الذكي للحصول على تلميح. لا تُدرج كلمات مرور أو بيانات شخصية.",
    "Hint level": "مستوى التلميح",
    "1 · Think about the approach": "١ · فكّر في طريقة الحل",
    "2 · Find the misconception": "٢ · حدّد الفهم غير الصحيح",
    "3 · Plan a small correction": "٣ · خطّط لتصحيح صغير",
    "Your question": "سؤالك",
    "Ask for guidance": "اطلب إرشادًا",
    "Thinking…": "جارٍ التفكير…",
    "✦ AI Tutor": "✦ المساعد الذكي",
    "Give me a hint": "أعطني تلميحًا",
    "Explain concept": "اشرح المفهوم",
    "Explain more simply": "اشرح بطريقة أبسط",
    "Another example": "مثال آخر",
    "What should I focus on?": "على ماذا أركز؟",
    "AI Tutor is thinking…": "المساعد الذكي يفكر…",
    "AI Tutor is not available yet. Please try again shortly.":
      "المساعد غير متاح الآن. حاول بعد قليل.",
    "Ask for a hint when you are stuck or request a concept explanation. The tutor supports your reasoning while keeping the learning task in your hands.":
      "اطلب تلميحًا أو شرحًا للمفهوم. يساعدك المساعد على التفكير ويترك مهمة التعلم بين يديك.",
    "CONNECT YOUR SKILLS": "اربط مهاراتك",
    "Mini projects": "مشاريع تطبيقية",
    "Combine functions, data structures, conditions and calculations in a business task. Each project has executable tests, progressive hints and a cloud draft.":
      "اجمع الدوال وهياكل البيانات والشروط والحسابات في مهمة أعمال. لكل مشروع اختبارات وتلميحات متدرجة ومسودة سحابية.",
    "Sales dashboard": "لوحة المبيعات",
    "Inventory planner": "مخطط المخزون",
    "Customer invoice": "فاتورة العميل",
    "Filter paid sales and aggregate revenue by region. Check repeated regions, excluded records and empty input.":
      "رشّح المبيعات المدفوعة واجمع الإيرادات حسب المنطقة. اختبر تكرار المناطق والسجلات المستبعدة والمدخلات الفارغة.",
    "Compare stock against targets and calculate replenishment quantities. Check zero stock and items already at target.":
      "قارن المخزون بالمستهدف واحسب كميات إعادة الطلب. اختبر المخزون الصفري والأصناف التي حققت المستهدف.",
    "Calculate line totals, apply a threshold discount and return a rounded invoice summary. Test the exact discount boundary.":
      "احسب إجماليات البنود وطبّق خصمًا عند الحد المحدد وأعد ملخص فاتورة مقربًا. اختبر حد الخصم بدقة.",
    "Build the sales report →": "ابنِ تقرير المبيعات ←",
    "Build the planner →": "ابنِ مخطط المخزون ←",
    "Build the invoice →": "ابنِ الفاتورة ←",
    "Submissions and feedback →": "التسليمات والتغذية الراجعة ←",
    "Save a personal submission or share it with your group instructor. Each resubmission keeps the previous version and feedback.":
      "احفظ تسليمًا شخصيًا أو شاركه مع مدرس مجموعتك. تحتفظ إعادة التسليم بالنسخة السابقة والتعليقات.",
    "Assessment rubric": "معايير التقييم",
    "Each criterion is scored 0–4: 0 missing, 1 beginning, 2 partial, 3 proficient, 4 complete.":
      "لكل معيار تقييم من ٠ إلى ٤: ٠ غائب، ١ أولي، ٢ جزئي، ٣ جيد، ٤ مكتمل.",
    "Correctness: meets the input/output contract and handles boundaries.":
      "الصحة: يحقق متطلبات المدخلات والمخرجات ويتعامل مع الحالات الحدية.",
    "Clarity: readable structure, meaningful names and a clear explanation.":
      "الوضوح: تنظيم مقروء وأسماء معبّرة وشرح واضح.",
    "Testing: examples cover typical, empty and boundary cases.":
      "الاختبار: أمثلة تغطي الحالات المعتادة والفارغة والحدية.",
    "Instructor feedback supports learning; these are not official grades.":
      "تقييم المدرس لدعم التعلم وليس درجات رسمية.",
    Project: "المشروع",
    "Share with": "المشاركة مع",
    "Personal only": "شخصي فقط",
    "Your code": "الكود",
    "Explain your approach and tests": "اشرح طريقة الحل والاختبارات",
    "Submit new version": "تسليم نسخة جديدة",
    "Submission history": "سجل التسليمات",
    Show: "عرض",
    "All submissions": "كل التسليمات",
    "My submissions": "تسليماتي",
    "Awaiting my feedback": "بانتظار تقييمي",
    Version: "النسخة",
    "View submitted code": "عرض الكود المُسلّم",
    "Instructor feedback": "تقييم المدرس",
    "Awaiting feedback": "بانتظار التقييم",
    "Revise and resubmit": "تعديل وإعادة تسليم",
    Feedback: "التغذية الراجعة",
    Correctness: "الصحة",
    Clarity: "الوضوح",
    Testing: "الاختبار",
    "Save feedback": "حفظ التقييم",
    "No submissions yet.": "لا توجد تسليمات بعد.",
    "Edit your code, then submit a new version.":
      "عدّل الكود ثم سلّم نسخة جديدة.",
    "Feedback saved.": "حُفظ التقييم.",
    "Submission saved.": "حُفظ التسليم.",
    "No cloud draft found.": "لم نعثر على مسودة سحابية.",
    "Cloud draft loaded.": "حُمّلت المسودة السحابية.",
    "LEARN TOGETHER": "تعلم مع مجموعتك",
    "Groups & assignments": "المجموعات والواجبات",
    "Practice activities, not verified grades. Joining a group shares your practice history and completion with its instructor.":
      "أنشطة تدريب وليست درجات معتمدة. الانضمام يشارك سجل تدريبك وإنجازك مع مدرس المجموعة.",
    "Join your class": "انضم إلى مجموعتك",
    "Group code": "رمز المجموعة",
    "Join group": "الانضمام",
    "Create a group": "إنشاء مجموعة",
    "Group name": "اسم المجموعة",
    "Create group": "إنشاء المجموعة",
    "No groups yet. Join using an instructor’s code.":
      "لا توجد مجموعات بعد. انضم باستخدام رمز المدرس.",
    "Working…": "جارٍ التنفيذ…",
    "Site health": "حالة الموقع",
    "Updates every minute while this page is open. Five matching reports in one hour trigger an alert. No code or message content is collected; reports expire after seven days.":
      "تُحدّث كل دقيقة أثناء فتح الصفحة. خمسة بلاغات متطابقة خلال ساعة تُظهر تنبيهًا. لا يُجمع الكود أو محتوى الرسائل، وتُحذف البلاغات بعد سبعة أيام.",
    "Report a question": "الإبلاغ عن سؤال",
    Reason: "السبب",
    "Unclear wording": "صياغة غير واضحة",
    "Incorrect answer": "إجابة غير صحيحة",
    Other: "أخرى",
    Notes: "ملاحظات",
    "Send report": "إرسال البلاغ",
    "Report saved. Thank you.": "حُفظ البلاغ. شكرًا لك.",
    "Draft, preview and publish questions. Publishing a revision preserves the previous question and answer history.":
      "أنشئ الأسئلة وعاينها وانشرها. يحفظ نشر التعديل نسخة السؤال السابقة وسجل الإجابات.",
    "Find a question": "البحث عن سؤال",
    "Existing question": "سؤال موجود",
    "Choose a question": "اختر سؤالًا",
    "Choose a draft": "اختر مسودة",
    "Edit selected question": "تعديل السؤال المحدد",
    "Saved drafts": "المسودات المحفوظة",
    "New question": "سؤال جديد",
    "Correct answer": "الإجابة الصحيحة",
    "Correct answer explanation": "شرح الإجابة الصحيحة",
    "Incorrect option 1": "الخيار الخاطئ ١",
    "Incorrect option 2": "الخيار الخاطئ ٢",
    "Incorrect option 3": "الخيار الخاطئ ٣",
    "Option 1 explanation": "شرح الخيار ١",
    "Option 2 explanation": "شرح الخيار ٢",
    "Option 3 explanation": "شرح الخيار ٣",
    Explanation: "الشرح",
    "Question type": "نوع السؤال",
    Recall: "تذكر",
    Application: "تطبيق",
    Code: "كود",
    Debugging: "تصحيح أخطاء",
    Preview: "معاينة",
    "Save draft": "حفظ المسودة",
    "Publish question": "نشر السؤال",
    "Revision history": "سجل التعديلات",
    Published: "منشور",
    Saved: "محفوظ",
    Draft: "مسودة",
    "New draft": "مسودة جديدة",
    "Editing question": "تعديل السؤال",
    "No revisions yet.": "لا توجد تعديلات بعد.",
    "Published. New practice sessions use this version.":
      "نُشر السؤال. تستخدم المحاولات الجديدة هذه النسخة.",
    "Draft saved.": "حُفظت المسودة.",
    "Saving…": "جارٍ الحفظ…",
    "Latest completed answer per learner and question. Fewer than 5 learners is insufficient evidence; low accuracy alone does not mean a question is wrong.":
      "أحدث إجابة مكتملة لكل متعلم وسؤال. أقل من ٥ متعلمين لا يكفي للاستنتاج؛ انخفاض الدقة وحده لا يعني وجود خطأ في السؤال.",
    "Search questions": "البحث في الأسئلة",
    "Unresolved reports only": "البلاغات المفتوحة فقط",
    questions: "أسئلة",
    Active: "نشط",
    Archived: "مؤرشف",
    Learners: "المتعلمون",
    "Insufficient evidence": "أدلة غير كافية",
    "Review with context": "راجع مع مراعاة السياق",
    "Option selections": "توزيع اختيار الإجابات",
    Resolved: "تمت المعالجة",
    Open: "مفتوح",
    "Mark resolved": "وضع علامة تمت المعالجة",
    "Edit content": "تعديل المحتوى",
    unclear: "غير واضح",
    incorrect: "غير صحيح",
    other: "أخرى",
    "Loading…": "جارٍ التحميل…",
    "Loading progress…": "جارٍ تحميل التقدم…",
    "Loading lab progress…": "جارٍ تحميل تقدم المختبرات…",
    "Loading your saved answers…": "جارٍ تحميل إجاباتك المحفوظة…",
    "Ready.": "جاهز.",
    "Could not load progress. Try again.": "تعذّر تحميل التقدم. حاول مجددًا.",
    "Instructor access required": "هذه الصفحة مخصصة للمدرسين المصرح لهم",
    "Sign in required.": "يلزم تسجيل الدخول.",
    "Your session expired. Sign in again.": "انتهت الجلسة. سجّل الدخول مجددًا.",
    "Could not save or load. Please try again.":
      "تعذّر الحفظ أو التحميل. حاول مجددًا.",
    "Answer saved.": "حُفظت الإجابة.",
    "Completed attempt saved.": "حُفظت المحاولة المكتملة.",
    "Progress saving is connected. Personal practice, not a verified grade.":
      "حفظ التقدم متصل. هذا تدريب شخصي وليس درجة معتمدة.",
    "Score shown at completion": "تظهر النتيجة عند الانتهاء",
    "Excellent work!": "عمل ممتاز!",
    "Good progress": "تقدم جيد",
    "Keep practicing": "واصل التدريب",
    "Retry saving": "إعادة محاولة الحفظ",
    "Account connection unavailable. Refresh to try again.":
      "تعذّر الاتصال بالحساب. حدّث الصفحة للمحاولة.",
    "INSTRUCTOR DASHBOARD · V1": "لوحة المدرس",
    "A live overview of student practice, course performance and learning gaps.":
      "نظرة مباشرة على تدريب الطلاب وأداء المقررات والمهارات التي تحتاج إلى تحسين.",
    "Active students": "الطلاب النشطون",
    Attempts: "المحاولات",
    Average: "المتوسط",
    Best: "الأفضل",
    "Courses with activity": "المقررات النشطة",
    "Average score across completed attempts.":
      "متوسط نتائج المحاولات المكتملة.",
    "Performance by course": "الأداء حسب المقرر",
    "Weakest topics": "الموضوعات التي تحتاج إلى تدريب",
    "Topics with the lowest observed mastery.":
      "الموضوعات ذات الإتقان الأقل حسب النشاط المسجل.",
    "Student performance": "أداء الطلاب",
    "Aggregate learning activity per student.":
      "ملخص النشاط التعليمي لكل طالب.",
    Student: "الطالب",
    "Last active": "آخر نشاط",
    "Most difficult questions": "الأسئلة الأكثر صعوبة",
    "Questions students answer incorrectly most often.":
      "الأسئلة التي تتكرر فيها الإجابات الخاطئة.",
    "Loading instructor analytics…": "جارٍ تحميل تحليلات المدرس…",
    "Manage groups, assignments and site health →":
      "إدارة المجموعات والواجبات وحالة الموقع ←",
    "COURSE REFERENCES": "مراجع المقررات",
    "Core references and teaching materials used to organize the practice content for each course.":
      "المراجع والمواد التعليمية المستخدمة لتنظيم التدريب لكل مقرر.",
    "Programming for Business": "البرمجة للأعمال",
    "Enterprise Resource Planning (ERP) Systems": "نظم تخطيط موارد المؤسسة",
    "Web, Design, Development & Management": "تصميم وتطوير وإدارة الويب",
    "Business Intelligence System": "نظم ذكاء الأعمال",
    "Business Data Analytics": "تحليل بيانات الأعمال",
    "Database Management System": "نظم إدارة قواعد البيانات",
    "Python learning materials": "مواد تعلم بايثون",
    "Web development course materials": "مواد تطوير الويب",
    completed: "مكتمل",
    "Your next recommended practice": "التدريب التالي المقترح",
    "Start adaptive practice →": "ابدأ التدريب التكيفي ←",
    "ADAPTIVE LEARNING": "التعلم التكيفي",
  };

  Object.assign(dictionary, {
    "Create your tamareen account": "أنشئ حسابك في تمارين",
    "Reset your password": "استعادة كلمة المرور",
    "Choose a new password": "اختر كلمة مرور جديدة",
    "Enter your email to receive a password reset link.":
      "أدخل بريدك الإلكتروني لإرسال رابط استعادة كلمة المرور.",
    "Save your personal practice and follow your learning progress.":
      "احفظ تدريبك الشخصي وتابع تقدمك التعليمي.",
    "Create account": "إنشاء الحساب",
    "Send reset link": "إرسال رابط الاستعادة",
    "Save new password": "حفظ كلمة المرور الجديدة",
    "Forgot password?": "نسيت كلمة المرور؟",
    "Enter a valid email address.": "أدخل بريدًا إلكترونيًا صحيحًا.",
    "Enter your password.": "أدخل كلمة المرور.",
    "Use a password with at least 8 characters.":
      "استخدم كلمة مرور من ٨ أحرف على الأقل.",
    "Passwords do not match.": "كلمتا المرور غير متطابقتين.",
    "Enter your name.": "أدخل اسمك.",
    "If this email has an account, a reset link will arrive shortly.":
      "إذا كان البريد مسجلًا فسيصل رابط الاستعادة قريبًا.",
    "Account created. Check your email to confirm your account, then log in.":
      "أُنشئ الحساب. أكد بريدك الإلكتروني ثم سجّل الدخول.",
    "Authentication failed. Please try again.":
      "تعذّر تسجيل الدخول. حاول مجددًا.",
    "Assign practice": "إسناد تدريب",
    Title: "العنوان",
    Type: "النوع",
    "One practice quiz": "اختبار تدريبي واحد",
    "Selected lab exercises": "تمارين مختبر محددة",
    Exercises: "التمارين",
    "Due date (your local time, optional)":
      "موعد التسليم (بتوقيتك المحلي، اختياري)",
    "Assign to group": "إسناد للمجموعة",
    "No assignments yet.": "لا توجد واجبات بعد.",
    "No recent reports.": "لا توجد بلاغات حديثة.",
    "Group code not found": "لم نعثر على رمز المجموعة",
    "Enter a valid group code": "أدخل رمز مجموعة صحيحًا",
    "Your Python code": "كود بايثون",
    "Your SQL code": "كود SQL",
    "HTML, CSS and JavaScript code": "كود HTML وCSS وJavaScript",
    "Course slide set covering introduction, expressions, conditions, functions, iterations, strings, lists and dictionaries.":
      "شرائح المقرر للمقدمة والتعبيرات والشروط والدوال والتكرار والنصوص والقوائم والقواميس.",
    "Connolly & Hoar chapter materials covering the foundations of web design and development.":
      "مواد فصول Connolly وHoar لأساسيات تصميم الويب وتطويره.",
    "Kroenke 9e course materials, including core database concepts, SQL and database design topics.":
      "مواد Kroenke، الطبعة التاسعة، لمفاهيم قواعد البيانات وSQL وتصميم قواعد البيانات.",
    "Motiwalla course materials, chapters 1–12.":
      "مواد Motiwalla، الفصول ١–١٢.",
    "Sharda 11e course materials covering analytics, data, modeling and related decision-support topics.":
      "مواد Sharda، الطبعة الحادية عشرة، للتحليل والبيانات والنمذجة ودعم القرار.",
    "Sharda course materials used across the Business Intelligence chapters.":
      "مواد Sharda المستخدمة في فصول ذكاء الأعمال.",
    "Practice business intelligence decisions using KPIs, visualization, data warehousing, dashboards and analytics scenarios aligned with the course.":
      "تدرّب على قرارات ذكاء الأعمال باستخدام مؤشرات الأداء والتصور ومستودعات البيانات ولوحات المعلومات والتحليلات.",
    "Practice data preparation, descriptive and predictive analytics, model evaluation and prescriptive decision scenarios aligned with the course.":
      "تدرّب على إعداد البيانات والتحليل الوصفي والتنبؤي وتقييم النماذج واتخاذ القرار.",
    "Practice integrated enterprise processes, shared data, module relationships and ERP implementation decisions through short business scenarios.":
      "تدرّب على عمليات المؤسسة المتكاملة والبيانات المشتركة وعلاقات الوحدات وقرارات تنفيذ ERP عبر سيناريوهات قصيرة.",
    "Write real code, run it in the browser, and use progressive hints and automatic feedback to improve your solution.":
      "اكتب كودًا فعليًا وشغّله في المتصفح، واستفد من التلميحات المتدرجة والفحص التلقائي لتحسين الحل.",
    "Write and run Python code with automatic test cases.":
      "اكتب وشغّل كود بايثون مع اختبارات تلقائية.",
    "Write and execute SQL queries against a practice database.":
      "اكتب ونفّذ استعلامات SQL على قاعدة بيانات للتدريب.",
    "Write HTML, CSS and JavaScript with a live preview and automatic task checks.":
      "اكتب HTML وCSS وJavaScript مع معاينة مباشرة وفحص تلقائي.",
    "Practice integrated ERP processes, shared data and implementation decisions.":
      "تدرّب على عمليات ERP المتكاملة والبيانات المشتركة وقرارات التنفيذ.",
    "Practice KPIs, dashboards, visualization and BI analytics decisions.":
      "تدرّب على مؤشرات الأداء ولوحات المعلومات والتصور وقرارات ذكاء الأعمال.",
    "Practice data preparation, predictive analytics and model evaluation.":
      "تدرّب على إعداد البيانات والتحليل التنبؤي وتقييم النماذج.",
    "The quiz could not start. Return to the course and try again.":
      "تعذّر بدء التدريب. ارجع إلى المقرر وحاول مجددًا.",
    "Loading questions…": "جارٍ تحميل الأسئلة…",
    "No questions are available for this course.":
      "لا توجد أسئلة متاحة لهذا الاختيار.",
    "Attempt resumed. Submitted answers and the original exam deadline are preserved.":
      "استُكملت المحاولة مع الاحتفاظ بالإجابات المحفوظة وموعد انتهاء الاختبار الأصلي.",
    "This attempt is complete. View My Progress for the result.":
      "هذه المحاولة مكتملة. شاهد النتيجة في صفحة تقدمي.",
    "Build a broader picture": "كوّن صورة أوضح عن مستواك",
    "More distinct questions are needed before identifying a weak topic.":
      "نحتاج إلى أسئلة مختلفة أكثر قبل تحديد موضوع يحتاج إلى تدريب.",
    "Your assessed topics are doing well. Try varied questions to broaden your practice.":
      "أداؤك جيد في الموضوعات المقيمة. جرّب أسئلة متنوعة لتوسيع تدريبك.",
    "More practice builds confidence": "المزيد من التدريب يعزز الثقة",
    "Varied practice · recent evidence · no verified grade":
      "تدريب متنوع · أدلة حديثة · ليست درجة معتمدة",
    "Tutor is temporarily unavailable. Please try later.":
      "المساعد غير متاح مؤقتًا. حاول لاحقًا.",
    "Tutor is not configured yet. Practice remains available.":
      "المساعد غير مهيأ حاليًا. التدريب متاح.",
    "Tutor limit reached. Try later (6 requests per minute, 60 per day).":
      "بلغت حد المساعد. حاول لاحقًا (٦ طلبات في الدقيقة و٦٠ يوميًا).",
    "Report limit reached": "بلغت الحد اليومي للبلاغات",
    "Submission limit reached": "بلغت الحد اليومي للتسليمات",
    "Join the group before submitting": "انضم إلى المجموعة قبل التسليم",
    "Draft changed. Reload before saving.":
      "تغيّرت المسودة. أعد تحميلها قبل الحفظ.",
    "Question was revised elsewhere. Start from the current version.":
      "عُدّل السؤال في مكان آخر. ابدأ من النسخة الحالية.",
    "Enter three incorrect options": "أدخل ثلاثة خيارات غير صحيحة",
    "Options must be distinct": "يجب أن تكون الخيارات مختلفة",
    "Explain every option": "اشرح كل خيار",
  });
  dictionary[
    "A diagnostic suggests a starting point; practice confirms mastery."
  ] = "التشخيص يقترح نقطة بداية، والتدريب يؤكد الإتقان.";
  let lang;
  try {
    lang = localStorage.getItem("tamareen:language");
  } catch {}
  if (!["ar", "en"].includes(lang))
    lang = navigator.language.startsWith("ar") ? "ar" : "en";
  const normalize = (s) => s.replace(/\s+/g, " ").trim();
  function translate(s) {
    const key = normalize(s);
    if (dictionary[key]) return dictionary[key];
    if (key.includes(" · "))
      return key
        .split(" · ")
        .map((part) => dictionary[part] || part)
        .join(" · ");
    if (key.endsWith(" →") && dictionary[key.slice(0, -2)])
      return dictionary[key.slice(0, -2)] + " ←";
    if (key.endsWith(" · tamareen"))
      return (dictionary[key.slice(0, -11)] || key.slice(0, -11)) + " · تمارين";
    const patterns = [
      [/^Question (\d+) of (\d+)$/i, (_, a, b) => `السؤال ${a} من ${b}`],
      [/^QUESTION (\d+) OF (\d+)$/, (_, a, b) => `السؤال ${a} من ${b}`],
      [/^Exercise (\d+) of (\d+)$/, (_, a, b) => `التمرين ${a} من ${b}`],
      [/^Solved: (.*)$/, (_, a) => `المكتمل: ${a}`],
      [/^Score: (.*)$/, (_, a) => `النتيجة: ${a}`],
      [/^Time left: (.*)$/, (_, a) => `الوقت المتبقي: ${a}`],
      [/^(\d+) questions$/, (_, a) => `${a} أسئلة`],
      [
        /^You scored (.*)\. Personal practice result, not a verified grade\.$/,
        (_, a) => `نتيجتك ${a}. نتيجة تدريب شخصية وليست درجة معتمدة.`,
      ],
    ];
    for (const [re, fn] of patterns)
      if (re.test(key)) return key.replace(re, fn);
    return s;
  }
  const t = (s) => (lang === "ar" ? translate(String(s)) : String(s)),
    nodes = new WeakMap(),
    attrs = new WeakMap();
  let pending = false;
  const ignored = (el) =>
    el?.closest(
      'script,style,pre,code,textarea,svg,iframe,[translate="no"],#qtext,.opt,#termText',
    );
  function render() {
    observer.disconnect();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    let node;
    while ((node = walker.nextNode())) {
      if (ignored(node.parentElement) || !node.nodeValue.trim()) continue;
      let state = nodes.get(node);
      if (!state || node.nodeValue !== state.last)
        state = { original: node.nodeValue };
      const translated = t(state.original);
      if (node.nodeValue !== translated) node.nodeValue = translated;
      state.last = translated;
      nodes.set(node, state);
    }
    for (const el of document.querySelectorAll(
      '[placeholder],[aria-label],input[type="submit"]',
    )) {
      if (ignored(el)) continue;
      let map = attrs.get(el) || {};
      for (const a of [
        "placeholder",
        "aria-label",
        ...(el.matches('input[type="submit"]') ? ["value"] : []),
      ]) {
        const value = el.getAttribute(a);
        if (value === null) continue;
        let v = map[a];
        if (!v || value !== v.last) v = { original: value };
        v.last = t(v.original);
        if (value !== v.last) el.setAttribute(a, v.last);
        map[a] = v;
      }
      attrs.set(el, map);
    }
    const btn = document.getElementById("languageToggle");
    if (btn) {
      btn.textContent = lang === "ar" ? "English" : "العربية";
      btn.setAttribute(
        "aria-label",
        lang === "ar" ? "Switch to English" : "التبديل إلى العربية",
      );
    }
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    pending = false;
  }
  const observer = new MutationObserver(() => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(render);
    }
  });
  function init() {
    const button = document.createElement("button");
    button.id = "languageToggle";
    button.type = "button";
    button.setAttribute("translate", "no");
    button.onclick = () => {
      lang = lang === "ar" ? "en" : "ar";
      try {
        localStorage.setItem("tamareen:language", lang);
      } catch {}
      render();
      window.dispatchEvent(new Event("languagechange"));
    };
    (
      document.querySelector(".headerActions") ||
      document.querySelector("header") ||
      document.body
    ).append(button);
    render();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
  return {
    t,
    get lang() {
      return lang;
    },
    dictionary,
  };
})();
