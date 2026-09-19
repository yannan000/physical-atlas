// Shared GMI Cloud plumbing for the atlas scripts (enrich.mjs, discover.mjs).
//   LLM:    api.gmi-serving.com/v1  (OpenAI-compatible chat completions)
//   Studio: console.gmicloud.ai/api/v1/ie/requestqueue/apikey  (async image queue)
import fs from 'node:fs/promises';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const exec=promisify(execFile);
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const GRAPHICS_DIR=path.join(root,'public','graphics');
export const LLM_BASE='https://api.gmi-serving.com/v1';
export const STUDIO_BASE='https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey';
export const LLM_MODEL=process.env.ATLAS_LLM_MODEL||'deepseek-ai/DeepSeek-V4-Flash';
export const IMAGE_MODEL=process.env.ATLAS_IMAGE_MODEL||'seedream-4-0-250828';
export const IMAGE_SIZE='1024x1024';

export function loadKey(){
  if(process.env.GMI_API_KEY)return process.env.GMI_API_KEY;
  for(const f of [path.join(root,'.env.local'),path.join(os.homedir(),'.config','gmi','.env'),path.join(os.homedir(),'.config','gmi','env')]){
    if(!existsSync(f))continue;
    const m=readFileSync(f,'utf8').match(/^\s*GMI_API_KEY\s*=\s*"?([^"\n]+)"?/m);
    if(m)return m[1].trim();
  }
  throw new Error('GMI_API_KEY not found. Export it, add it to .env.local, or run `gmi login`.');
}
let _headers;
export const headers=()=>_headers??=(()=>({Authorization:`Bearer ${loadKey()}`,'Content-Type':'application/json'}))();

export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function pool(items,n,fn){const out=[];let i=0;await Promise.all(Array.from({length:Math.min(n,items.length)},async()=>{while(i<items.length){const k=i++;out[k]=await fn(items[k],k)}}));return out}
export const pad=n=>String(n).padStart(2,'0');

export function extractJson(text){
  if(!text)throw new Error('empty completion');
  try{return JSON.parse(text)}catch{}
  const m=text.match(/[\[{][\s\S]*[\]}]/);if(!m)throw new Error(`no JSON in completion: ${text.slice(0,200)}`);
  return JSON.parse(m[0]);
}

/** One chat-completions call returning parsed JSON, with retry on 429/5xx and on unparseable output. */
export async function chatJson(system,user,{maxTokens=2000,temperature=0.3,validate}={}){
  const body={model:LLM_MODEL,temperature,max_tokens:maxTokens,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:user}]};
  let lastErr;
  for(let attempt=0;attempt<3;attempt++){
    const r=await fetch(`${LLM_BASE}/chat/completions`,{method:'POST',headers:headers(),body:JSON.stringify(body)});
    if(r.status===429||r.status>=500){await sleep(2000*2**attempt);continue}
    if(!r.ok)throw new Error(`LLM ${r.status}: ${(await r.text()).slice(0,300)}`);
    const d=await r.json();
    try{const j=extractJson(d.choices?.[0]?.message?.content);if(validate)validate(j);return {json:j,usage:d.usage}}
    catch(e){lastErr=e;body.temperature=Math.min(0.7,temperature+0.2)}
  }
  throw lastErr||new Error('LLM call failed');
}

// ---------- paper briefs ----------
export const BRIEF_SYSTEM=`You are the research editor of Physical Atlas, a public index of Physical AI research (robots, drones, autonomy, manipulation, embodied AI, simulation).
Write for a technically literate industry reader who has not read the paper. Be concrete and specific to THIS paper. No hype, no marketing language, no first person.
Never invent numbers, benchmarks, or claims that are not supported by the provided context or your reliable knowledge of the paper. If unsure, stay general rather than fabricate.
Respond with a single JSON object and nothing else.`;

export function briefPrompt(p){return `Paper: ${p.title}
Lab / organization: ${p.lab||'unknown'}${p.labKind?` (${p.labKind})`:''}
Year: ${p.year||'unknown'}
Primary link: ${p.url}
${p.abstract?`Abstract: ${p.abstract}\n`:''}${p.summary?`Editor's one-line summary: ${p.summary}\n`:''}${p.impact?`Editor's industry note: ${p.impact}\n`:''}
Return JSON with exactly these keys:
{
 "tldr": "one sentence, max 28 words, what the paper does and shows",
 "whatChanged": "2-3 sentences: what was true before this paper, and what this paper changed or made possible",
 "soWhat": "2 sentences in plain English a smart 14-year-old would follow; a concrete analogy is welcome",
 "industry": "2-3 sentences: what this specific paper contributes to products, deployments, datasets or tooling, and who would use it",
 "keywords": ["3 to 6 short lowercase technical keywords"],
 "graphicPrompt": "a visual concept for one editorial illustration of the paper's core idea in 30-60 words: concrete objects, actions and spatial arrangement only; no text, no letters, no logos, no people's faces"
}`}

export function validateBrief(j){
  for(const k of ['tldr','whatChanged','soWhat','industry','graphicPrompt'])if(typeof j[k]!=='string'||!j[k].trim())throw new Error(`brief missing ${k}`);
  if(!Array.isArray(j.keywords))j.keywords=[];j.keywords=j.keywords.map(String).slice(0,6);
}

export async function writeBrief(p){
  const {json,usage}=await chatJson(BRIEF_SYSTEM,briefPrompt(p),{validate:validateBrief});
  return {...json,model:LLM_MODEL,generatedAt:new Date().toISOString(),usage};
}

// ---------- graphics ----------
export const STYLE='Flat geometric vector illustration, editorial style, deep navy background (#0b1730), warm amber and cyan accent colors, crisp shapes, soft long shadows, generous negative space, centered composition. Purely pictorial: absolutely no text, no letters, no words, no captions, no labels, no annotations, no diagram callouts, no numbers, no logos, no watermarks, no human faces.';

async function toPng(srcBuf,srcExt,outPng){
  const tmp=path.join(os.tmpdir(),`atlas-${Date.now()}-${Math.random().toString(36).slice(2)}.${srcExt}`);
  await fs.writeFile(tmp,srcBuf);
  try{try{await exec('sips',['-s','format','png',tmp,'--out',outPng])}catch{await exec('ffmpeg',['-y','-v','error','-i',tmp,outPng])}}
  finally{await fs.rm(tmp,{force:true})}
}

/** Render one graphic from an illustration brief and save it as public/graphics/<name>.png. */
export async function renderGraphic(brief,name,{timeoutMs=240000}={}){
  await fs.mkdir(GRAPHICS_DIR,{recursive:true});
  let r;
  for(let a=0;;a++){
    r=await fetch(`${STUDIO_BASE}/requests`,{method:'POST',headers:headers(),body:JSON.stringify({model:IMAGE_MODEL,payload:{prompt:`${brief}\n\n${STYLE}`,size:IMAGE_SIZE,max_images:1,watermark:false}})});
    if((r.status===429||r.status>=500)&&a<4){await sleep(3000*2**a);continue}
    break;
  }
  if(!r.ok)throw new Error(`Studio submit ${r.status}: ${(await r.text()).slice(0,300)}`);
  const {request_id}=await r.json();
  const t0=Date.now();let done;
  for(;;){
    const s=await fetch(`${STUDIO_BASE}/requests/${encodeURIComponent(request_id)}`,{headers:headers()});
    if(s.ok){const d=await s.json();if(['success','failed','cancelled'].includes(d.status)){done=d;break}}
    if(Date.now()-t0>timeoutMs)throw new Error(`timeout waiting for ${request_id}`);
    await sleep(3000);
  }
  if(done.status!=='success')throw new Error(`generation ${done.status}: ${done.reason||''}`);
  const url=done.outcome?.media_urls?.[0]?.url;if(!url)throw new Error('no media url in outcome');
  const img=await fetch(url);if(!img.ok)throw new Error(`download ${img.status}`);
  const buf=Buffer.from(await img.arrayBuffer());
  const ext=(new URL(url).pathname.split('.').pop()||'jpg').toLowerCase();
  const out=path.join(GRAPHICS_DIR,`${name}.png`);
  if(ext==='png')await fs.writeFile(out,buf);else await toPng(buf,ext,out);
  return {graphic:`/graphics/${name}.png`,graphicModel:IMAGE_MODEL,graphicRequestId:request_id};
}

export async function readJson(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'))}catch{return fallback}}
export async function writeJson(file,data){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(data,null,1)+'\n')}
