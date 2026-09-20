import {createClient} from '@supabase/supabase-js';

function esc(v){return String(v??'').slice(0,500)}
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const auth=req.headers.authorization||'';
  if(!auth.startsWith('Bearer ')) return res.status(401).json({error:'Sign in required'});
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'https://ulueevjobheawtnqgupf.supabase.co';
  const anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!anon||!service) return res.status(500).json({error:'Instructor analytics is not configured'});
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:ue}=await userClient.auth.getUser();
  if(ue||!user) return res.status(401).json({error:'Invalid session'});
  const allowed=(process.env.INSTRUCTOR_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!allowed.includes((user.email||'').toLowerCase())) return res.status(403).json({error:'Instructor access required'});
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const {data:attempts,error}=await admin.from('attempts').select('id,user_id,course_id,total_questions,correct_answers,score_percent,mode,completed_at,courses(code,name)').not('completed_at','is',null).order('completed_at',{ascending:false}).limit(5000);
  if(error) return res.status(500).json({error:error.message});
  const rows=attempts||[], ids=rows.map(x=>x.id);
  let answers=[];
  for(let i=0;i<ids.length;i+=500){
    const {data:a,error:ae}=await admin.from('attempt_answers').select('attempt_id,question_id,is_correct,questions(question,topics(name),courses(code))').in('attempt_id',ids.slice(i,i+500));
    if(ae) return res.status(500).json({error:ae.message});
    answers.push(...(a||[]));
  }
  const users=[...new Set(rows.map(x=>x.user_id).filter(Boolean))];
  const names={};
  if(users.length){const {data:p}=await admin.from('profiles').select('id,display_name').in('id',users);(p||[]).forEach(x=>names[x.id]=x.display_name)}
  const courseMap={},studentMap={};
  rows.forEach(x=>{
    const code=x.courses?.code||'Unknown',score=Number(x.score_percent||0);
    if(!courseMap[code])courseMap[code]={code,name:x.courses?.name||'',attempts:0,sum:0,students:new Set()};
    const c=courseMap[code];c.attempts++;c.sum+=score;if(x.user_id)c.students.add(x.user_id);
    if(x.user_id){if(!studentMap[x.user_id])studentMap[x.user_id]={id:x.user_id,name:names[x.user_id]||'Student',attempts:0,sum:0,best:0,last:null};const st=studentMap[x.user_id];st.attempts++;st.sum+=score;st.best=Math.max(st.best,score);if(!st.last||x.completed_at>st.last)st.last=x.completed_at}
  });
  const topics={},questions={};
  answers.forEach(a=>{
    const code=a.questions?.courses?.code||'',topic=a.questions?.topics?.name||'General',q=a.questions?.question||'Question',tk=code+'|'+topic,qk=a.question_id;
    if(!topics[tk])topics[tk]={code,topic,ok:0,n:0};topics[tk].n++;if(a.is_correct)topics[tk].ok++;
    if(!questions[qk])questions[qk]={code,question:q,ok:0,n:0};questions[qk].n++;if(a.is_correct)questions[qk].ok++;
  });
  const avg=rows.length?Math.round(rows.reduce((n,x)=>n+Number(x.score_percent||0),0)/rows.length):0;
  return res.status(200).json({
    summary:{students:users.length,attempts:rows.length,average:avg,courses:Object.keys(courseMap).length},
    courses:Object.values(courseMap).map(x=>({code:x.code,name:x.name,attempts:x.attempts,students:x.students.size,average:Math.round(x.sum/x.attempts)})).sort((a,b)=>a.code.localeCompare(b.code)),
    topics:Object.values(topics).map(x=>({...x,mastery:Math.round(x.ok/x.n*100)})).sort((a,b)=>a.mastery-b.mastery).slice(0,12),
    difficult:Object.values(questions).filter(x=>x.n>=1).map(x=>({...x,correctRate:Math.round(x.ok/x.n*100)})).sort((a,b)=>a.correctRate-b.correctRate||b.n-a.n).slice(0,10),
    students:Object.values(studentMap).map(x=>({id:x.id,name:esc(x.name),attempts:x.attempts,average:Math.round(x.sum/x.attempts),best:Math.round(x.best),last:x.last})).sort((a,b)=>a.average-b.average).slice(0,100)
  });
}