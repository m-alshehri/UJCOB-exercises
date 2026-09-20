export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:'AI Tutor is not configured yet.'});
  const {kind,course,topic,question,options,selectedAnswer,answered,message,history}=req.body||{};
  if(!question) return res.status(400).json({error:'Missing question'});
  if(String(question).length>1200||String(message||'').length>300) return res.status(400).json({error:'Request is too long'});
  const base=answered
    ? 'The student has already submitted an answer. You may explain why their selected answer is right or wrong and teach the concept clearly, but keep the focus on learning rather than merely naming an option.'
    : 'The student has not submitted an answer yet. Use a Socratic approach. Do not reveal, quote, identify, or strongly imply the correct option.';
  const task=kind==='hint'
    ? 'Give one concise Socratic hint.'
    : kind==='explain'
      ? 'Explain the underlying concept concisely so the student can reason independently.'
      : 'Answer the student follow-up in context. Prefer guiding questions, simple explanations, or a fresh example as appropriate.';
  const safeHistory=Array.isArray(history)?history.slice(-6).map(x=>({role:x?.role==='user'?'user':'assistant',content:String(x?.content||'').slice(0,500)})):[];
  const context='Course: '+(course||'')+'\nTopic: '+(topic||'General')+'\nQuestion: '+question+'\nOptions: '+JSON.stringify(options||[])+'\nStudent selected: '+(selectedAnswer||'No answer submitted yet')+'\nSubmitted: '+Boolean(answered);
  const input=[{role:'user',content:context},...safeHistory];
  if(message) input.push({role:'user',content:String(message).slice(0,300)});
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({
      model:'gpt-5.6-luna',
      instructions:'You are Tamareen AI Tutor for university business computing students. '+base+' '+task+' Use clear English suitable for an undergraduate. Be supportive but concise. Keep the answer under 140 words.',
      input
    })});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data?.error?.message||'AI request failed'});
    const answer=data.output_text||data.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||'';
    return res.status(200).json({answer});
  }catch(e){return res.status(500).json({error:'AI Tutor is temporarily unavailable.'})}
}