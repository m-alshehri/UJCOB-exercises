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

test('learning studio rejects unauthenticated publication and student administration',async()=>{
 const {default:handler}=await import('../api/learning-admin.js');let r=response();await handler({method:'POST',headers:{},body:{action:'saveQuestion'}},r);assert.equal(r.code,401);
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({id:'11111111-1111-4111-8111-111111111111',email:'student@example.test'}),{status:200,headers:{'Content-Type':'application/json'}});
 try{for(const action of ['saveQuestion','content','quality','feedback','resolveReport']){r=response();await handler({method:'POST',headers:{authorization:'Bearer test'},body:{action}},r);assert.equal(r.code,403,action);}}finally{globalThis.fetch=original;}
});
test('instructor cannot review a submission outside their own group',async()=>{
 const {default:handler}=await import('../api/learning-admin.js'),original=globalThis.fetch,env={INSTRUCTOR_EMAILS:process.env.INSTRUCTOR_EMAILS,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY};process.env.INSTRUCTOR_EMAILS='teacher@example.test';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service';let writes=0;
 globalThis.fetch=async(input,init)=>{const url=new URL(typeof input==='string'?input:input.url);let value;if(url.pathname.includes('/auth/'))value={id:'11111111-1111-4111-8111-111111111111',email:'teacher@example.test'};else if(url.pathname.endsWith('project_submissions'))value={id:'s',group_id:'g'};else if(url.pathname.endsWith('study_groups')){assert.equal(url.searchParams.get('owner_id'),'eq.11111111-1111-4111-8111-111111111111');value=null;}else{writes++;value={};}return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});};
 try{const r=response();await handler({method:'POST',headers:{authorization:'Bearer test'},body:{action:'feedback',id:'s'}},r);assert.equal(r.code,403);assert.equal(writes,0);}finally{globalThis.fetch=original;for(const [k,v]of Object.entries(env))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
test('lab tutor uses server exercise context, Arabic guidance and the existing quota',async()=>{
 const original=globalThis.fetch,previous=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test';let paid=0;
 globalThis.fetch=async(input,init)=>{const url=new URL(typeof input==='string'?input:input.url);let value;if(url.pathname.includes('/auth/'))value={id:'11111111-1111-4111-8111-111111111111',email:'student@example.test'};else if(url.pathname.endsWith('consume_tutor_quota'))value=true;else{paid++;const body=JSON.parse(init.body);assert.match(body.instructions,/Respond in Arabic/);assert.match(body.instructions,/Never provide the complete solution/);assert.match(body.input[0].content,/inventory planner/);value={output_text:'Test hint'};}return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});};
 try{let r=response();await tutor({method:'POST',headers:{authorization:'Bearer test'},body:{kind:'hint',lab:'python-lab',exercise:'project-inventory-planner',code:'pass',result:'FAIL',level:2,language:'ar'}},r);assert.equal(r.code,200);assert.equal(r.body.answer,'Test hint');r=response();await tutor({method:'POST',headers:{authorization:'Bearer test'},body:{kind:'hint',lab:'python-lab',exercise:'not-real'}},r);assert.equal(r.code,400);assert.equal(paid,1);}finally{globalThis.fetch=original;if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;}
});

test('journey never returns roles or notifications without a verified session',async()=>{
 const {default:handler}=await import('../api/journey.js');
 for(const action of ['role','notifications']){const r=response();await handler({method:'POST',headers:{},body:{action}},r);assert.equal(r.code,401);assert.equal(r.headers['Cache-Control'],'no-store');}
});
test('journey uses server allowlist rather than user metadata for instructor links',async()=>{
 const {default:handler}=await import('../api/journey.js'),original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({id:'u',email:'unlisted@example.test',user_metadata:{role:'instructor'}}),{status:200,headers:{'Content-Type':'application/json'}});
 try{const r=response();await handler({method:'POST',headers:{authorization:'Bearer test'},body:{action:'role'}},r);assert.equal(r.code,200);assert.equal(r.body.instructor,false);}finally{globalThis.fetch=original;}
});
