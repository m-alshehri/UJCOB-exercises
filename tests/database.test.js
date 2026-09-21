import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
const user = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222",
  attempt = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
await db.exec(
  `create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;`,
);
const setup = (await readFile("supabase/setup.sql", "utf8")).replace(
  "create extension if not exists pgcrypto;",
  "",
);
await db.exec(setup);
await db.exec(
  `insert into auth.users values('${user}','{"student_name":"Test Student"}'),('${other}','{}');grant select,insert,update,delete on all tables in schema public to authenticated;`,
);
const first = (
  await db.query(
    "select id,course_id,correct_answer,wrong_answers from questions order by id limit 1",
  )
).rows[0];
async function asUser(id, fn) {
  await db.exec(`set role authenticated;set request.jwt.claim.sub='${id}';`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
test("setup is repeatable and seed IDs/counts are preserved", async () => {
  const before = (await db.query("select count(*)::int n from questions"))
    .rows[0].n;
  assert.equal(before, 600);
  await db.exec(setup);
  assert.equal(
    (await db.query("select count(*)::int n from questions")).rows[0].n,
    600,
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::int n from questions where topic_id is null",
      )
    ).rows[0].n,
    0,
  );
  assert.equal(
    (await db.query("select display_name from profiles where id=$1", [user]))
      .rows[0].display_name,
    "Test Student",
  );
});
test("duplicate answer requests produce one answer and a server-calculated score", async () => {
  await asUser(user, async () => {
    await db.query("select start_practice_attempt($1,$2,$3,$4)", [
      attempt,
      first.course_id,
      [first.id],
      "practice",
    ]);
    for (let n = 0; n < 2; n++)
      await db.query("select submit_practice_answer($1,$2,$3)", [
        attempt,
        first.id,
        first.correct_answer,
      ]);
    const result = (
      await db.query("select finish_practice_attempt($1) result", [attempt])
    ).rows[0].result;
    assert.equal(result.correct_answers, 1);
    assert.equal(Number(result.score_percent), 100);
    assert.equal(
      (await db.query("select count(*)::int n from attempt_answers")).rows[0].n,
      1,
    );
    assert.deepEqual(
      (await db.query("select finish_practice_attempt($1) result", [attempt]))
        .rows[0].result,
      result,
    );
  });
});
test("another student cannot read or submit another student attempt", async () => {
  await asUser(other, async () => {
    assert.equal((await db.query("select * from attempts")).rows.length, 0);
    await assert.rejects(
      db.query("select submit_practice_answer($1,$2,$3)", [
        attempt,
        first.id,
        first.correct_answer,
      ]),
      /Attempt not found/,
    );
  });
});
test("direct score writes are blocked by RLS", async () => {
  await asUser(user, async () => {
    const result = await db.query(
      "update attempts set score_percent=200 where id=$1 returning id",
      [attempt],
    );
    assert.equal(result.rows.length, 0);
    await assert.rejects(
      db.query("insert into attempts(user_id,course_id) values($1,$2)", [
        user,
        first.course_id,
      ]),
      /row-level security/,
    );
  });
});
test("quota is persistent and fails after six requests in one minute", async () => {
  await asUser(user, async () => {
    for (let n = 0; n < 6; n++)
      assert.equal(
        (await db.query("select consume_tutor_quota() ok")).rows[0].ok,
        true,
      );
    assert.equal(
      (await db.query("select consume_tutor_quota() ok")).rows[0].ok,
      false,
    );
  });
});
test("exam deadline is enforced by the database", async () => {
  const id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  await asUser(user, () =>
    db.query("select start_practice_attempt($1,$2,$3,$4)", [
      id,
      first.course_id,
      [first.id],
      "exam",
    ]),
  );
  await db.query(
    "update attempts set started_at=now()-interval '11 minutes' where id=$1",
    [id],
  );
  await asUser(user, () =>
    assert.rejects(
      db.query("select submit_practice_answer($1,$2,$3)", [
        id,
        first.id,
        first.correct_answer,
      ]),
      /Time is up/,
    ),
  );
});
test.after(() => db.close());
