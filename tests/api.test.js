import test from "node:test";
import assert from "node:assert/strict";
import tutor from "../api/tutor.js";
import instructor from "../api/instructor-analytics.js";
function response() {
  return {
    code: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.code = n;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}
test("tutor rejects unauthenticated requests before calling a paid API", async () => {
  const r = response();
  await tutor({ method: "POST", headers: {}, body: { question: "hello" } }, r);
  assert.equal(r.code, 401);
});
test("tutor bounds request size", async () => {
  const r = response();
  await tutor(
    { method: "POST", headers: {}, body: { message: "x".repeat(11000) } },
    r,
  );
  assert.equal(r.code, 413);
});
test("instructor endpoint requires a bearer session", async () => {
  const r = response();
  await instructor({ method: "GET", headers: {} }, r);
  assert.equal(r.code, 401);
  assert.equal(r.headers["Cache-Control"], "no-store");
});

test('classrooms reject unauthenticated requests before service access',async()=>{
 const {default:handler}=await import('../api/classrooms.js');let status,body;
 const res={setHeader(){},status(n){status=n;return this;},json(j){body=j;return this;}};
 await handler({method:'POST',headers:{},body:{action:'createGroup',name:'Group'}},res);assert.equal(status,401);assert.match(body.error,/Sign in/);
});
