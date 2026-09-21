window.LAB_CATALOG = {
  "python-lab": {
    code: "BCIS 313",
    url: "/python-lab.html",
  },
  "sql-lab": {
    code: "BCIS 311",
    url: "/sql-lab.html",
  },
  "web-lab": {
    code: "BCIS 317",
    url: "/web-lab.html",
  },
  "erp-lab": {
    code: "BCIS 324",
    url: "/erp-lab.html",
  },
  "bi-lab": {
    code: "BCIS 411",
    url: "/bi-lab.html",
  },
  "analytics-lab": {
    code: "BCIS 421",
    url: "/analytics-lab.html",
  },
};
for (const [type, lab] of Object.entries(LAB_CATALOG))
  lab.exercises = LAB_CONTENT[type].map((q) => ({
    id: q.id,
    title: q.title || q[type === "web-lab" ? 0 : 2],
    legacyIndex: q.legacyIndex,
  }));
