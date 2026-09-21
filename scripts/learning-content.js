import {readFile,writeFile} from 'node:fs/promises';
const content=JSON.parse(await readFile('content/applied-questions.json','utf8'));
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
const items=Object.entries(content).flatMap(([course,rows])=>rows.map((r,i)=>({course,key:`applied-v1-${course.replace(' ','-')}-${i+1}`,topic:r[0],q:r[1],c:r[2],w:r[3],e:r[4],rationales:Object.fromEntries([[r[2],r[4]],...r[3].map((w,j)=>[w,r[5][j]])]),kind:r[6]})));
for(const q of items){if(new Set([q.c,...q.w]).size!==4||Object.values(q.rationales).some(x=>!x))throw new Error('Invalid content '+q.key)}
let sql='-- Applied questions: stable content keys preserve answer history on repeat runs.\n';
for(const q of items)sql+=`insert into public.topics(course_id,name) select id,${quote(q.topic)} from public.courses where code=${quote(q.course)} on conflict(course_id,name) do nothing;\ninsert into public.questions(course_id,topic_id,question,correct_answer,wrong_answers,explanation,option_explanations,question_kind,content_key) select c.id,t.id,${quote(q.q)},${quote(q.c)},${quote(JSON.stringify(q.w))}::jsonb,${quote(q.e)},${quote(JSON.stringify(q.rationales))}::jsonb,${quote(q.kind)},${quote(q.key)} from public.courses c join public.topics t on t.course_id=c.id and t.name=${quote(q.topic)} where c.code=${quote(q.course)} on conflict(content_key) where content_key is not null do nothing;\n`;
await writeFile('supabase/migrations/005_applied_questions.sql',sql);
await writeFile('js/applied-questions.js','window.APPLIED_QUESTIONS='+JSON.stringify(items)+';\nfor(const q of APPLIED_QUESTIONS) COURSES[q.course].questions.push(q);\n');
const base=await readFile('supabase/setup.sql','utf8');
const marker='-- Learning experience upgrade';
const original=base.split(marker)[0].replace(/\s*notify pgrst, 'reload schema';\s*commit;\s*$/,'');
const upgrade=await readFile('supabase/migrations/004_learning_experience.sql','utf8');
await writeFile('supabase/learning_upgrade.sql','begin;\n'+upgrade+'\n'+sql+"\nnotify pgrst, 'reload schema';\ncommit;\n");
await writeFile('supabase/setup.sql',original+'\n'+marker+'\n'+upgrade+'\n'+sql+"\nnotify pgrst, 'reload schema';\ncommit;\n");
