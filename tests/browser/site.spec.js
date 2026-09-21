import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const uid = "11111111-1111-4111-8111-111111111111",
  cid = "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  qid = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
async function setup(page, { signedIn = true, failSave = false } = {}) {
  const writes = [];
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // All database traffic stays in this controlled fixture; no real student records are touched.
  const umd = await readFile(
    "node_modules/@supabase/supabase-js/dist/umd/supabase.js",
    "utf8",
  );
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**", (r) =>
    r.fulfill({ contentType: "text/javascript", body: umd }),
  );
  if (signedIn)
    await page.addInitScript(
      ({ uid }) =>
        window===window.top && localStorage.setItem(
          "sb-ulueevjobheawtnqgupf-auth-token",
          JSON.stringify({
            access_token: "test-token",
            refresh_token: "test-refresh",
            expires_at: 4102444800,
            expires_in: 3600,
            token_type: "bearer",
            user: {
              id: uid,
              email: "test@example.test",
              aud: "authenticated",
              role: "authenticated",
            },
          }),
        ),
      { uid },
    );
  await page.route(
    "https://ulueevjobheawtnqgupf.supabase.co/**",
    async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      let value = [];
      const method = request.method();
      if (url.pathname.includes("/auth/"))
        value = { id: uid, email: "test@example.test" };
      else if (url.pathname.includes("/rpc/")) {
        writes.push({ path: url.pathname, body: request.postDataJSON() });
        if (url.pathname.endsWith("start_practice_attempt"))
          value = { id: request.postDataJSON().p_id };
        else if (url.pathname.endsWith("submit_practice_answer")) {
          await new Promise((r) => setTimeout(r, 250));
          value = { is_correct: true, correct_answers: 1 };
        } else
          value = {
            correct_answers: 1,
            score_percent: 100,
            total_questions: 1,
          };
      } else if (url.pathname.endsWith("/courses")) {
        value = { id: cid, code: "BCIS 313", name: "Programming for Business" };
        if (!request.headers().accept?.includes("object")) value = [value];
      } else if (url.pathname.endsWith("/questions"))
        value = [
          {
            id: qid,
            question: "Which value is correct?",
            correct_answer: "Correct option",
            wrong_answers: ["Wrong one", "Wrong two", "Wrong three"],
            explanation: "Test explanation.",
            topics: { name: "Basics" },
          },
        ];
      else if (url.pathname.endsWith("/lab_progress") && method === "POST") {
        writes.push({ path: url.pathname, body: request.postDataJSON() });
        if (failSave)
          return route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ message: "Save unavailable" }),
          });
        value = null;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(value),
      });
    },
  );
  return { writes, errors };
}
test("public routes load, keyboard course selection and auth redirect work", async ({
  page,
}) => {
  const { errors } = await setup(page, { signedIn: false });
  await page.goto("/");
  await expect(page.locator("#grid .course")).toHaveCount(6);
  await page.locator("#grid .course").first().press("Enter");
  await expect(page).toHaveURL(/courses\/bcis313/);
  await page.reload();
  await expect(page.locator("#modeTitle")).toContainText("BCIS 313");
  await page.goto("/dashboard.html");
  await expect(page).toHaveURL(/login.html\?next=/);
  expect(errors).toEqual([]);
});
test("quiz double submission saves exactly one answer and completion", async ({
  page,
}) => {
  const { writes, errors } = await setup(page);
  await page.goto("/?course=BCIS%20313&mode=practice");
  await expect(page.locator("#qtext")).toHaveText("Which value is correct?");
  await page.getByRole("button", { name: /Correct option/ }).click();
  await page.locator("#check").dblclick({ force: true });
  await expect(page.locator("#feed")).toContainText("Correct!");
  await page.locator("#next").click();
  await expect(page.locator("#finalScore")).toHaveText("1/1");
  expect(
    writes.filter((x) => x.path.endsWith("submit_practice_answer")),
  ).toHaveLength(1);
  expect(
    writes.filter((x) => x.path.endsWith("finish_practice_attempt")),
  ).toHaveLength(1);
  expect(errors).toEqual([]);
});
test("web lab checks rendered behavior and saves a stable key", async ({
  page,
}) => {
  const { writes, errors } = await setup(page);
  await page.goto("/web-lab.html");
  await expect(page.locator("#title")).toHaveText("Build a heading");
  await page.locator("#code").fill("<!-- <h1>Welcome to Tamareen</h1> -->");
  await page.getByRole("button", { name: "Check task", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Not complete");
  await page.locator("#code").fill("<h1>Welcome to Tamareen</h1>");
  await page.getByRole("button", { name: "Check task", exact: true }).click();
  await expect(page.locator("#saveStatus")).toContainText("Completion saved");
  expect(writes.at(-1).body.exercise_key).toBe("build-a-heading");
  expect(errors).toEqual([]);
});
test("failed lab save never claims completion was saved", async ({ page }) => {
  await setup(page, { failSave: true });
  await page.goto("/erp-lab.html");
  await page
    .getByRole("button", {
      name: "Sales order → delivery → billing → payment",
      exact: true,
    })
    .click();
  await expect(page.locator("#saveStatus")).toContainText("not saved");
  await expect(page.locator("#done")).toHaveText("0");
  await expect(
    page.getByRole("button", { name: "Retry saving" }),
  ).toBeVisible();
});
test("Python executes in a worker without clearing the solution", async ({
  page,
}) => {
  const { errors } = await setup(page);
  await page.goto("/python-lab.html");
  const code = 'print("Hello, tamareen!")';
  await page.locator("#editor").fill(code);
  await page.locator("#run").click();
  await expect(page.locator("#feedback")).toContainText("All checks passed", {
    timeout: 40000,
  });
  await expect(page.locator("#saveStatus")).toContainText("Completion saved");
  await expect(page.locator("#editor")).toHaveValue(code);
  await page.getByRole("button", { name: "Beginner", exact: true }).click();
  await page.getByRole("button", { name: "Mixed", exact: true }).click();
  await expect(page.locator("#desc")).toContainText("No exercises");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  expect(errors).toEqual([]);
});
test("SQL result text cannot inject HTML into the authenticated page", async ({
  page,
}) => {
  const { errors } = await setup(page);
  await page.goto("/sql-lab.html");
  await page
    .locator("#editor")
    .fill(
      `SELECT '<img src=x onerror="document.body.dataset.injected=1">' AS value;`,
    );
  await page.locator("#run").click();
  await expect(page.locator("#console")).toContainText("<img src=x", {
    timeout: 30000,
  });
  await expect(page.locator("#console img")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveAttribute("data-injected");
  expect(errors).toEqual([]);
});
test("resources header reflects the session; dashboard handles no history", async ({
  page,
}) => {
  const { errors } = await setup(page);
  await page.goto("/resources.html");
  await expect(page.locator("#authHeader")).toHaveText("Logout");
  await page.goto("/dashboard.html");
  await expect(page.locator("#attempts")).toHaveText("0");
  await expect(page.locator("#list")).toContainText("No completed attempts");
  expect(errors).toEqual([]);
});
test('Web Lab checks JavaScript interaction and mobile layout behavior',async({page})=>{const {errors}=await setup(page);await page.goto('/web-lab.html');for(let n=0;n<3;n++)await page.getByRole('button',{name:'Next exercise',exact:true}).click();await page.locator('#code').fill('<p id="message">Ready</p><button onclick="document.getElementById(\'message\').textContent=\'Changed\'">Change</button>');await page.getByRole('button',{name:'Check task',exact:true}).click();await expect(page.locator('#status')).toContainText('Correct!');await page.getByRole('button',{name:'Next exercise',exact:true}).click();await page.locator('#code').fill('<style>.container{display:grid;grid-template-columns:1fr 1fr}@media(max-width:600px){.container{grid-template-columns:1fr}}</style><div class="container"><div>One</div><div>Two</div></div>');await page.getByRole('button',{name:'Check task',exact:true}).click();await expect(page.locator('#status')).toContainText('Correct!');expect(errors).toEqual([]);});

test('resume restores an existing attempt without creating another or resetting the clock',async({page})=>{
 const {writes,errors}=await setup(page);const aid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 await page.route('**/rest/v1/attempts?**',r=>r.fulfill({json:{id:aid,mode:'exam',started_at:new Date(Date.now()-120000).toISOString(),completed_at:null,question_ids:[qid],courses:{code:'BCIS 313'}}}));
 await page.goto('/?resume='+aid);await expect(page.locator('#qtext')).toHaveText('Which value is correct?');await expect(page.locator('#examTimer')).toContainText(/Time left: [78]:/);
 expect(writes.filter(w=>w.path.endsWith('start_practice_attempt'))).toHaveLength(0);expect(errors).toEqual([]);
});
test('review page shows wrong answer, explanation and a targeted practice link',async({page})=>{
 const {errors}=await setup(page);
 await page.route('**/rest/v1/attempts?**',r=>r.fulfill({json:[{id:'a',courses:{code:'BCIS 313'}}]}));
 await page.route('**/rest/v1/attempt_answers?**',r=>r.fulfill({json:[{id:'answer',question_id:qid,is_correct:false,selected_answer:'Wrong one',answered_at:new Date().toISOString(),questions:{id:qid,question:'Review this question',correct_answer:'Correct option',explanation:'A clear explanation',is_active:true,topics:{name:'Basics'},courses:{code:'BCIS 313'},option_explanations:{'Wrong one':'Why it fails'}}}]}));
 await page.goto('/review.html');await expect(page.locator('#reviewList')).toContainText('Wrong one');await page.getByText('Review answer and explanation',{exact:true}).click();await expect(page.locator('#reviewList')).toContainText('Why it fails');await expect(page.getByRole('link',{name:'Practice this question again →'})).toHaveAttribute('href',new RegExp('reviewQuestion='+qid));expect(errors).toEqual([]);
});
test('cloud drafts restore and hints progress without revealing a complete solution',async({page})=>{
 const {errors,writes}=await setup(page);
 await page.route('**/rest/v1/lab_drafts?**',r=>r.fulfill({json:[{code:'print("cloud draft")',revision:3}]}));
 await page.goto('/python-lab.html');await expect(page.locator('#editor')).toHaveValue('print("cloud draft")');
 for(let n=0;n<3;n++)await page.getByRole('button',{name:'Show next hint',exact:true}).click();await expect(page.locator('#hintList li')).toHaveCount(3);await expect(page.locator('#hintNext')).toBeDisabled();
 await page.locator('#editor').fill('print("edited")');await page.getByRole('button',{name:'Save cloud draft',exact:true}).click();await expect(page.locator('#draftState')).toContainText('Cloud draft saved');expect(writes.find(w=>w.path.endsWith('save_lab_draft')).body.p_revision).toBe(3);expect(errors).toEqual([]);
});
test('mobile navigation and learning pages do not overflow at 390px',async({page})=>{
 const {errors}=await setup(page);await page.setViewportSize({width:390,height:844});
 for(const path of ['/projects.html','/review.html','/python-lab.html','/web-lab.html']){await page.goto(path);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,overflow:[...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,id:e.id,class:e.className,width:e.getBoundingClientRect().width,text:e.textContent.slice(0,70)})).slice(0,15)})),path).toMatchObject({width:390});}
 await page.goto('/projects.html');await page.getByRole('button',{name:'Open navigation',exact:true}).click();await expect(page.getByRole('link',{name:'Groups',exact:true})).toBeVisible();expect(errors).toEqual([]);
});
test('instructor can create a group and assign selected exercises through the UI',async({page})=>{
 const {errors}=await setup(page);const requests=[];let created=false;
 await page.route('**/api/classrooms',r=>{const b=r.request().postDataJSON();requests.push(b);if(b.action==='createGroup')created=true;return r.fulfill({json:b.action==='load'?{instructor:true,health:[{kind:'quiz_save',page:'/',count:5,alert:true}],groups:created?[{id:'g',name:'Section A',join_code:'a'.repeat(32),owned:true,members:0,assignments:[],topics:[]}]:[]}:{ok:true}});});
 await page.goto('/classrooms.html');await page.locator('#groupName').fill('Section A');await page.getByRole('button',{name:'Create group',exact:true}).click();await expect(page.locator('#groups')).toContainText('Section A');await page.getByText('Create assignment',{exact:true}).click();await page.locator('input[name=title]').fill('Basics practice');await page.locator('select[name=kind]').selectOption('lab');await page.locator('input[name=exercise]').first().check();await page.getByRole('button',{name:'Assign to group',exact:true}).click();await expect.poll(()=>requests.some(x=>x.action==='assign'&&x.exercises.length===1)).toBe(true);await expect(page.locator('#healthTitle')).toContainText('Attention');expect(errors).toEqual([]);
});

test('learning paths show the next step and language choice survives reload',async({page})=>{
 const {errors}=await setup(page);await page.goto('/pathways.html');await expect(page.locator('#pathList article')).toHaveCount(5);await expect(page.locator('#nextStep')).toHaveAttribute('href',/stage=0/);await page.locator('#languageToggle').click();await expect(page.locator('html')).toHaveAttribute('dir','rtl');await expect(page.locator('h1')).toHaveText('مسارات التعلم');await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','ar');await page.goto('/python-lab.html');await expect(page.locator('#editor')).toHaveCSS('direction','ltr');await expect(page.locator('#labTutorSend')).toHaveText('اطلب إرشادًا');expect(errors).toEqual([]);
});
test('diagnostic tags the attempt and withholds hints and answer feedback',async({page})=>{
 const {writes,errors}=await setup(page);await page.route('**/rest/v1/questions?**',r=>r.fulfill({json:[{id:qid,question:'Diagnostic question',correct_answer:'Correct option',wrong_answers:['A','B','C'],explanation:'Explain later',topics:{name:'Python interpreter'}}]}));
 await page.goto('/?course=BCIS%20313&diagnostic=1');await expect(page.locator('#qtext')).toHaveText('Diagnostic question');await expect(page.locator('#tutor')).toBeHidden();await page.getByRole('button',{name:/Correct option/}).click();await page.locator('#check').click();await expect(page.locator('#next')).toBeVisible();await expect(page.locator('#feed')).not.toContainText('Explain later');expect(writes.find(w=>w.path.endsWith('tag_practice_attempt')).body.p_purpose).toBe('diagnostic');await page.locator('#next').click();await expect(page.locator('#pathResult')).toBeVisible();expect(errors).toEqual([]);
});
test('content studio previews safe text and sends a validated four-option draft',async({page})=>{
 const {errors}=await setup(page);const requests=[];await page.route('**/api/learning-admin',r=>{const b=r.request().postDataJSON();requests.push(b);return r.fulfill({json:b.action==='content'?{courses:[{code:'BCIS 313',name:'Python'}],drafts:[],questions:[],versions:[]}:{draft:{id:b.id,revision:1,question_id:null}}});});
 await page.goto('/content-studio.html');await expect(page.locator('#studio')).toBeVisible();await page.locator('#editTopic').fill('variable');await page.locator('#editText').fill('<img src=x onerror=alert(1)> is text');await page.locator('#editCorrect').fill('A');await page.locator('#editExplanation').fill('Because');for(let i=1;i<=3;i++)await page.locator('#wrong'+i).fill('Option '+i);for(let i=0;i<=3;i++)await page.locator('#rationale'+i).fill('Explanation '+i);await page.locator('#previewQuestion').click();await expect(page.locator('#questionPreview img')).toHaveCount(0);await page.getByRole('button',{name:'Save draft',exact:true}).click();await expect(page.locator('#studioStatus')).toHaveText('Draft saved.');const b=requests.find(x=>x.action==='saveQuestion');expect(b.publish).toBe(false);expect(Object.keys(b.payload.rationales)).toHaveLength(4);expect(errors).toEqual([]);
});
test('project submission includes selected group and immutable snapshot and displays feedback',async({page})=>{
 const {errors}=await setup(page),sent=[];await page.route('**/api/learning-admin',r=>{const b=r.request().postDataJSON();sent.push(b);return r.fulfill({json:b.action==='load'?{instructor:false,userId:uid,groups:[{id:'g',name:'Group'}],owned:[],submissions:[],feedback:[]}:{submission:{id:b.id}}});});await page.goto('/submissions.html');await expect(page.locator('#submissionForm')).toBeVisible();await page.locator('#submissionGroup').selectOption('g');await page.locator('#submissionCode').fill('def reorder(items): return {}');await page.locator('#submissionReflection').fill('I tested the empty case.');await page.getByRole('button',{name:'Submit new version'}).click();await expect(page.locator('#submissionStatus')).toHaveText('Submission saved.');const b=sent.find(x=>x.action==='submit');expect(b.groupId).toBe('g');expect(b.code).toContain('def reorder');expect(b.id).toMatch(/^[a-f0-9-]{36}$/);expect(errors).toEqual([]);
});
test('new learning screens fit a narrow Arabic viewport',async({page})=>{
 await setup(page);await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>localStorage.setItem('tamareen:language','ar'));await page.route('**/api/learning-admin',r=>r.fulfill({json:{instructor:false,userId:uid,groups:[],owned:[],submissions:[],feedback:[],courses:[{code:'BCIS 313',name:'Python'}],drafts:[],questions:[],versions:[]}}));for(const route of ['/pathways.html','/content-studio.html','/question-quality.html','/submissions.html']){await page.goto(route);await expect(page.locator('html')).toHaveAttribute('dir','rtl');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
});
