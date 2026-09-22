// Generated from assets/projects.json by scripts/build.js.
window.PROJECTS = [
  {
    "id": "project-sales-dashboard",
    "course": "BCIS 313",
    "lab": "python-lab",
    "title": "Sales dashboard",
    "ar": "لوحة المبيعات",
    "brief": "Aggregate paid revenue by region; ignore unpaid records.",
    "briefAr": "اجمع إيرادات المبيعات المدفوعة حسب المنطقة واستبعد غير المدفوعة.",
    "deliverables": "Return a dictionary of region totals. Test repeated regions and empty input.",
    "deliverablesAr": "أعد قاموسًا بإجمالي كل منطقة، واختبر تكرار المنطقة والمدخلات الفارغة.",
    "example": "{\"West\": 150, \"East\": 80}",
    "executable": true
  },
  {
    "id": "project-inventory-planner",
    "course": "BCIS 313",
    "lab": "python-lab",
    "title": "Inventory planner",
    "ar": "مخطط المخزون",
    "brief": "Calculate replenishment quantities from stock and target levels.",
    "briefAr": "احسب كميات إعادة الطلب من المخزون والمستوى المستهدف.",
    "deliverables": "Submit your function and tests for zero stock, target stock and surplus.",
    "deliverablesAr": "سلّم الدالة واختبارات المخزون الصفري والمطابق للمستهدف والفائض.",
    "example": "Item A: stock 3, target 10 → reorder 7",
    "executable": true
  },
  {
    "id": "project-customer-invoice",
    "course": "BCIS 313",
    "lab": "python-lab",
    "title": "Customer invoice",
    "ar": "فاتورة العميل",
    "brief": "Calculate line totals, discounts and a rounded invoice summary.",
    "briefAr": "احسب إجمالي البنود والخصومات وملخص الفاتورة بعد التقريب.",
    "deliverables": "Submit your function and tests at the exact discount boundary.",
    "deliverablesAr": "سلّم الدالة واختبارات عند حد تطبيق الخصم بالضبط.",
    "example": "Subtotal 100; discount 10; total 90",
    "executable": true
  },
  {
    "id": "project-sales-sql",
    "course": "BCIS 311",
    "lab": "sql-lab",
    "title": "SQL sales report",
    "ar": "تقرير المبيعات باستخدام SQL",
    "brief": "Design customers and orders tables. Report paid revenue per customer, including customers without orders.",
    "briefAr": "صمّم جدولَي العملاء والطلبات، واعرض الإيراد المدفوع لكل عميل بما يشمل من ليس لديهم طلبات.",
    "deliverables": "Submit CREATE TABLE, sample INSERT statements, a LEFT JOIN aggregate query and its expected result. Explain NULL handling.",
    "deliverablesAr": "سلّم إنشاء الجداول والبيانات التجريبية واستعلام تجميع باستخدام LEFT JOIN والنتيجة المتوقعة، واشرح التعامل مع NULL.",
    "example": "customers(id,name); orders(id,customer_id,amount,status)\nA: paid 100 + cancelled 50 → 100; B: no orders → 0",
    "executable": false
  },
  {
    "id": "project-storefront",
    "course": "BCIS 317",
    "lab": "web-lab",
    "title": "Accessible storefront",
    "ar": "واجهة متجر متاحة للجميع",
    "brief": "Build a responsive catalogue with three products, a category filter and a cart total.",
    "briefAr": "أنشئ كتالوجًا متجاوبًا لثلاثة منتجات مع تصفية حسب الفئة وحساب إجمالي السلة.",
    "deliverables": "Submit one HTML document with CSS and JavaScript. Include labelled controls, keyboard interaction, an empty state and tests at 360px.",
    "deliverablesAr": "سلّم ملف HTML يتضمن CSS وJavaScript وعناصر تحكم مسمّاة ودعم لوحة المفاتيح وحالة فارغة واختبارات بعرض 360 بكسل.",
    "example": "Add product A (25) twice and B (10) once → cart total 60",
    "executable": false
  },
  {
    "id": "project-order-process",
    "course": "BCIS 324",
    "lab": "erp-lab",
    "title": "Order-to-cash process",
    "ar": "عملية الطلب حتى التحصيل",
    "brief": "Map a customer order through inventory, shipping, invoicing and payment. Include a stock shortage and a returned item.",
    "briefAr": "ارسم دورة طلب العميل عبر المخزون والشحن والفاتورة والسداد، وأضف نقص المخزون وإرجاع منتج.",
    "deliverables": "Submit a numbered process, responsible roles, document names, accounting effects and two exception scenarios.",
    "deliverablesAr": "سلّم خطوات العملية والمسؤوليات والمستندات والأثر المحاسبي وسيناريوهين استثنائيين.",
    "example": "Order 10 units, available 6 → ship 6, backorder 4; invoice shipped quantity only",
    "executable": false
  },
  {
    "id": "project-kpi-scorecard",
    "course": "BCIS 411",
    "lab": "bi-lab",
    "title": "Business KPI scorecard",
    "ar": "بطاقة مؤشرات أداء الأعمال",
    "brief": "Design a dashboard for monthly revenue, gross margin and returns. State the decision each metric supports.",
    "briefAr": "صمّم لوحة للإيرادات الشهرية وهامش الربح والمرتجعات، وحدد القرار الذي يدعمه كل مؤشر.",
    "deliverables": "Submit a metric dictionary, sample data, calculations, chart choices and a short management recommendation. Test a zero-revenue month.",
    "deliverablesAr": "سلّم قاموس المؤشرات وبيانات تجريبية وحسابات واختيار الرسوم وتوصية إدارية، واختبر شهرًا بلا إيرادات.",
    "example": "Revenue 1000, cost 700 → gross margin 30%; revenue 0 → margin unavailable",
    "executable": false
  },
  {
    "id": "project-campaign-analysis",
    "course": "BCIS 421",
    "lab": "analytics-lab",
    "title": "Campaign performance analysis",
    "ar": "تحليل أداء الحملات",
    "brief": "Compare two campaigns using spend, clicks and conversions; clean duplicates and missing values before comparing.",
    "briefAr": "قارن حملتين باستخدام الإنفاق والنقرات والتحويلات، ونظّف التكرار والقيم المفقودة قبل المقارنة.",
    "deliverables": "Submit a small dataset, cleaning log, conversion rate and acquisition cost calculations, and a recommendation with limitations.",
    "deliverablesAr": "سلّم بيانات صغيرة وسجل التنظيف وحساب معدل التحويل وتكلفة الاكتساب وتوصية تتضمن حدود الاستنتاج.",
    "example": "A: spend 200, clicks 100, conversions 10 → rate 10%, cost 20; zero conversions → cost unavailable",
    "executable": false
  }
]
;
