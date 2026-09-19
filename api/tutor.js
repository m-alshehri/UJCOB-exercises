export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:'AI Tutor is not configured yet.'});
  const {kind,course,topic,question,options}=req.body||{};
  if(!question) return res.status(400).json({error:'Missing question'});
  const instruction=kind==='hint'
    ? 'Give one concise Socratic hint. Do not reveal, quote, identify, or strongly imply the correct option.'
    : 'Explain the underlying concept concisely so the student can reason independently. Do not reveal, quote, identify, or strongly imply the correct option.';
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({
      model:'gpt-5.6-luna',
      instructions:'You are Tamareen AI Tutor for university business computing students. '+instruction+' Use clear English suitable for an undergraduate. Keep the answer under 120 words.',
      input:'Course: '+(course||'')+'\nTopic: '+(topic||'General')+'\nQuestion: '+question+'\nOptions: '+JSON.stringify(options||[])
    })});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data?.error?.message||'AI request failed'});
    const answer=data.output_text||data.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||'';
    return res.status(200).json({answer});
  }catch(e){return res.status(500).json({error:'AI Tutor is temporarily unavailable.'})}
}