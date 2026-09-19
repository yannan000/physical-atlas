import {NextRequest,NextResponse} from 'next/server';
import {chatJson,gmiKey,LLM_MODEL} from '../../../lib/gmi';

// On-demand summary for a paper from the live Hugging Face feed, written by a
// GMI-hosted model. Cached in memory per paper id for the life of the server.
const cache=new Map<string,any>();
const SYSTEM=`You are the research editor of Physical Atlas, an index of Physical AI research. Write for an industry reader who has not read the paper. Be concrete, never invent results. Respond with one JSON object only.`;

export async function POST(req:NextRequest){
  if(!gmiKey())return NextResponse.json({enabled:false,reason:'Set GMI_API_KEY to enable model summaries.'},{status:503});
  const {id,title,summary}=await req.json();
  if(!title)return NextResponse.json({error:'title required'},{status:400});
  const key=String(id||title);
  if(cache.has(key))return NextResponse.json({enabled:true,cached:true,model:LLM_MODEL,...cache.get(key)});
  try{
    const out=await chatJson(SYSTEM,`Title: ${title}\nAbstract: ${summary||'(none provided)'}\n\nReturn JSON: {"tldr":"one sentence, max 28 words","soWhat":"2 plain-English sentences on why this matters for industry","domain":"one of robots|drones|autonomy|manipulation|embodied|simulation|other"}`,{maxTokens:900});
    const res={tldr:String(out.tldr||''),soWhat:String(out.soWhat||''),domain:String(out.domain||'other')};
    cache.set(key,res);
    return NextResponse.json({enabled:true,model:LLM_MODEL,...res});
  }catch(e:any){return NextResponse.json({error:e.message||'summarize failed'},{status:502})}
}
