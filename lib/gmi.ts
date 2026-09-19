// Server-side GMI Cloud helpers (never imported by client components).
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const LLM_BASE='https://api.gmi-serving.com/v1';
export const LLM_MODEL=process.env.ATLAS_LLM_MODEL||'deepseek-ai/DeepSeek-V4-Flash';

/** GMI_API_KEY from the environment, then the `gmi` CLI's config file (dev convenience). */
export function gmiKey():string|undefined{
  if(process.env.GMI_API_KEY)return process.env.GMI_API_KEY;
  for(const f of [path.join(os.homedir(),'.config','gmi','.env'),path.join(os.homedir(),'.config','gmi','env')]){
    if(!existsSync(f))continue;
    const m=readFileSync(f,'utf8').match(/^\s*GMI_API_KEY\s*=\s*"?([^"\n]+)"?/m);
    if(m)return m[1].trim();
  }
}

export async function chatJson<T=any>(system:string,user:string,opts:{maxTokens?:number;temperature?:number}={}):Promise<T>{
  const key=gmiKey();if(!key)throw new Error('GMI_API_KEY is not configured');
  const r=await fetch(`${LLM_BASE}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:LLM_MODEL,temperature:opts.temperature??0.3,max_tokens:opts.maxTokens??1200,response_format:{type:'json_object'},
      messages:[{role:'system',content:system},{role:'user',content:user}]})});
  if(!r.ok)throw new Error(`GMI ${r.status}: ${(await r.text()).slice(0,200)}`);
  const d=await r.json();const text:string=d.choices?.[0]?.message?.content||'';
  try{return JSON.parse(text)}catch{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error('model returned no JSON');return JSON.parse(m[0])}
}
