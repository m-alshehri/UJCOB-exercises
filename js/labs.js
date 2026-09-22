(() => {
  function draw() {
    document.getElementById('labDirectory').innerHTML = Object.entries(LAB_CATALOG).map(([key,lab]) => `<article class="learningCard"><h2>${lab.code} · ${I18n.t({'python-lab':'Python Coding Lab','sql-lab':'SQL Coding Lab','web-lab':'Web Coding Lab','erp-lab':'ERP Process Lab','bi-lab':'BI Analytics Lab','analytics-lab':'Data Analytics Lab'}[key])}</h2><a href="${lab.url}">${I18n.t('Open related lab')} →</a></article>`).join('');
  }
  draw(); window.addEventListener('languagechange',draw);
})();
