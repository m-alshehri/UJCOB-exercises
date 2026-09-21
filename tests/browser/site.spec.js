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
