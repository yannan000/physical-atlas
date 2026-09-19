#!/usr/bin/env node
// NVIDIA Research publications → Physical Atlas.
//
// Crawls research.nvidia.com/publications (all pages, or --areas), reads each publication's
// date, venue, research areas and arXiv link, fetches abstracts from arXiv, dedupes against
// the atlas, has TypeSafe Jev judge every paper, and indexes the Physical AI keepers with a
// DeepSeek brief and a Seedream graphic. Rejections are remembered so re-runs only see new work.
//
//   npm run nvidia                          # crawl everything, judge, index keepers
//   npm run nvidia -- --areas 2947,3445,4608,4823   # Robotics, Autonomous Vehicles, Physical AI, World Simulation only
//   npm run nvidia -- --dry-run             # crawl + abstracts + dedupe, no model calls
//   npm run nvidia -- --recrawl             # ignore the cached crawl in data/nvidia-crawl.json
//   npm run nvidia -- --min-score 3 --max 50 --no-graphics --limit 100
//
// Requires a Jev key (TYPESAFE_API_KEY or AI_GATEWAY_API_KEY) for screening.
import path from 'node:path';
import {createHash} from 'node:crypto';
import {root,LLM_MODEL,IMAGE_MODEL,writeBrief,renderGraphic,pool,readJson,writeJson,sleep} from './gmi.mjs';
import {jevAvailable,judgePaper,JEV_MODEL,POLICY,QUESTIONS,jevHint,explainAuthError,isFatal} from './jev.mjs';

const argv=process.argv.slice(2);const opt=(n,d)=>{const i=argv.indexOf(`--${n}`);return i>-1?argv[i+1]:d};const flag=n=>argv.includes(`--${n}`);
const AREAS=(opt('areas','')||'').split(',').filter(Boolean);
const LIMIT=Number(opt('limit',Infinity))||Infinity, MAX=Number(opt('max',Infinity))||Infinity, MIN_SCORE=Number(opt('min-score',1))||1;
const CONC=Math.max(1,Number(opt('concurrency',6))||6);
const DRY=flag('dry-run'),RECRAWL=flag('recrawl'),GRAPHICS=!flag('no-graphics');
const BASE='https://research.nvidia.com';const UA={'User-Agent':'Mozilla/5.0 (physical-atlas research index; github.com/yannan000/physical-atlas)'};
const AREA_NAMES={26:'AI & ML',23:'Computer Vision',17:'Computer Graphics',22:'Computer Architecture',3915:'Generative AI',2947:'Robotics',19:'Circuits & VLSI',18:'Algorithms',25:'HPC',30:'Real-Time Rendering',36:'VR/AR/Display',2537:'HCI',3445:'Autonomous Vehicles',31:'Resilience & Safety',29:'PL & Systems',21:'Computational Imaging',4390:'NLP',4391:'Speech',3365:'Applied Perception',3364:'Esports',3714:'Telecom',3210:'Medical',4608:'Physical AI',3348:'Hyperscale Graphics',4454:'Security',27:'Networking',4389:'Machine Translation',4359:'Quantum',4823:'World Simulation',3692:'Climate Simulation',3664:'Storage & Systems'};

const CRAWL=path.join(root,'data','nvidia-crawl.json'),DISC=path.join(root,'data','discovered.json'),CLS=path.join(root,'data','classified.json');
const strip=s=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#039;|&#39;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const arxivId=s=>{const m=String(s||'').match(/(\d{4}\.\d{4,5})(v\d+)?/);return m?m[1]:null};
async function get(url,tries=3){for(let a=0;;a++){try{const r=await fetch(url,{headers:UA});if(r.status===429||r.status>=500){if(a<tries){await sleep(2000*2**a);continue}}if(!r.ok)throw new Error(`${r.status}`);return await r.text()}catch(e){if(a>=tries)throw e;await sleep(1500*2**a)}}}

// ---------- 1. crawl ----------
function listUrl(page,area){return `${BASE}/publications?${area?`f%5B0%5D=research_area%3A${area}&`:''}page=${page}`}
function parseList(html){
  return html.split('<div class="views-row">').slice(1).map(b=>{
    const t=b.match(/views-field-title[\s\S]*?<a href="(\/publication\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);if(!t)return null;
    const au=b.match(/views-field-field-authors[\s\S]*?<span class="field-content">([\s\S]*?)<\/span>\s*<\/div>/);
    const vn=b.match(/views-field-field-published-in[\s\S]*?<span class="field-content">([\s\S]*?)<\/span>/);
    return {path:t[1],title:strip(t[2]),authors:au?strip(au[1]).split(/,\s*/).filter(Boolean).slice(0,10):[],venue:vn?strip(vn[1]):''}}).filter(Boolean);
}
function parseDetail(html){
  const block=k=>{const i=html.indexOf(`blocknodepublication${k}`);if(i<0)return '';const start=html.lastIndexOf('<div',i);const rest=html.slice(start+10);const j=rest.search(/<div[^>]*block-field-blocknodepublication|<footer|<\/main/);return strip(rest.slice(0,j>0?j:4000))};
  const date=(block('field-publication-date').match(/([A-Z][a-z]+ \d{1,2}, \d{4})/)||[])[1];
  const iso=date?new Date(date+' UTC').toISOString().slice(0,10):'';
  const venue=block('field-published-in').replace(/^Published in\s*/i,'').trim();
  const areas=[...html.matchAll(/research_area(?:%3A|:)(\d+)/g)].map(m=>Number(m[1])).filter((v,i,a)=>a.indexOf(v)===i);
  const links=[...new Set([...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m=>m[1]))].filter(u=>!/nvidia\.com|twitter|facebook|linkedin|youtube|instagram|google\.com|apple\.com|creativecommons|w3\.org/.test(u));
  const ax=links.map(arxivId).find(Boolean)||null;
  const pdf=links.find(u=>/\.pdf($|\?)/i.test(u))||(ax?`https://arxiv.org/pdf/${ax}`:null);
  const external=links.find(u=>/arxiv\.org|openreview|acm\.org|ieee\.org|springer|nature\.com|science\.org|mlr\.press|neurips|proceedings/i.test(u))||links[0]||null;
  return {publishedAt:iso,venue,areas,arxiv:ax,pdf,external};
}
async function crawl(){
  const cache=RECRAWL?null:await readJson(CRAWL,null);
  if(cache?.pubs?.length){console.log(`using cached crawl of ${cache.pubs.length} publications from ${cache.at} (--recrawl to refresh)`);return cache.pubs}
  const targets=AREAS.length?AREAS:[null];const seen=new Map();
  for(const area of targets){
    const first=await get(listUrl(0,area));const last=Math.max(0,...[...first.matchAll(/page=(\d+)/g)].map(m=>Number(m[1])));
    console.log(`  ${area?AREA_NAMES[area]||area:'all areas'}: ${last+1} pages`);
    for(const p of parseList(first))seen.set(p.path,p);
    await pool(Array.from({length:last},(_,i)=>i+1),3,async pg=>{try{for(const p of parseList(await get(listUrl(pg,area))))seen.set(p.path,p)}catch(e){console.error(`    page ${pg}: ${e.message}`)}});
  }
  const pubs=[...seen.values()];console.log(`  ${pubs.length} publications listed; reading detail pages…`);
  let n=0;await pool(pubs,CONC,async p=>{try{Object.assign(p,parseDetail(await get(BASE+p.path)))}catch(e){p.error=e.message}if(++n%100===0)console.log(`    ${n}/${pubs.length}`)});
  // abstracts from arXiv, 50 ids per call, ≥3 s apart
  const ids=pubs.filter(p=>p.arxiv).map(p=>p.arxiv);const byId=new Map();
  for(let i=0;i<ids.length;i+=50){
    try{const xml=await get(`http://export.arxiv.org/api/query?id_list=${ids.slice(i,i+50).join(',')}&max_results=50`);
      for(const e of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)){const id=arxivId((e[1].match(/<id>([^<]+)<\/id>/)||[])[1]);const ab=(e[1].match(/<summary>([\s\S]*?)<\/summary>/)||[])[1];if(id&&ab)byId.set(id,strip(ab))}
    }catch(e){console.error(`    arXiv batch ${i}: ${e.message}`)}
    await sleep(3100);
  }
  for(const p of pubs)if(p.arxiv&&byId.has(p.arxiv))p.abstract=byId.get(p.arxiv);
  // fallbacks: Hugging Face papers API for arXiv ids arXiv did not return; OpenAlex title search for the rest
  const inv=x=>{if(!x)return '';const w=[];for(const [t,pos] of Object.entries(x))for(const i of pos)w[i]=t;return w.join(' ')};
  await pool(pubs.filter(p=>!p.abstract&&p.arxiv),4,async p=>{try{const d=JSON.parse(await get(`https://huggingface.co/api/papers/${p.arxiv}`));if(d.summary)p.abstract=strip(d.summary)}catch{}});
  await pool(pubs.filter(p=>!p.abstract),3,async p=>{try{const d=JSON.parse(await get(`https://api.openalex.org/works?search=${encodeURIComponent(p.title)}&per-page=3&select=title,abstract_inverted_index,doi,publication_date`));
    const hit=(d.results||[]).find(w=>norm(w.title)===norm(p.title))||(d.results||[]).find(w=>norm(w.title).includes(norm(p.title).slice(0,40)));
    if(hit){const ab=inv(hit.abstract_inverted_index);if(ab)p.abstract=ab;if(hit.doi&&!p.doi)p.doi=hit.doi.replace(/^https?:\/\/doi\.org\//,'');if(!p.publishedAt&&hit.publication_date)p.publishedAt=hit.publication_date}}catch{}await sleep(150)});
  console.log(`  abstracts: ${pubs.filter(p=>p.abstract).length}/${pubs.length} (${ids.length} had arXiv links)`);
  await writeJson(CRAWL,{at:new Date().toISOString(),areas:AREAS,pubs});return pubs;
}

// ---------- main ----------
const {atlasPapers,slugify}=await import('../lib/papers.ts');
const data=await readJson(DISC,{papers:[],rejected:{},backlog:{}});data.rejected??={};
const cls=await readJson(CLS,{model:JEV_MODEL,questionsHash:createHash('sha1').update(JSON.stringify(QUESTIONS)).digest('hex').slice(0,10),policy:POLICY,papers:{}});
console.log(`Physical Atlas · NVIDIA Research → atlas · screen ${jevAvailable()?`Jev ${JEV_MODEL}`:'NONE'} · briefs ${LLM_MODEL}${GRAPHICS?` · image ${IMAGE_MODEL}`:' · graphics off'}`);
const pubs=await crawl();
const known=new Set([...data.papers.map(p=>p.key||p.id),...Object.keys(data.rejected),...atlasPapers.map(p=>arxivId(p.url)).filter(Boolean).map(a=>`arxiv:${a}`)]);
const knownTitles=new Set([...data.papers.map(p=>norm(p.title)),...atlasPapers.map(p=>norm(p.title)),...Object.values(data.rejected).map(r=>norm(r.title))]);
const fresh=pubs.filter(p=>p.title&&!p.error).map(p=>({...p,key:p.arxiv?`arxiv:${p.arxiv}`:`title:${norm(p.title)}`})).filter(p=>!known.has(p.key)&&!knownTitles.has(norm(p.title))).slice(0,LIMIT);
console.log(`${fresh.length} new to the atlas (of ${pubs.length} crawled) · ${fresh.filter(p=>p.abstract).length} with abstracts`);
if(DRY){fresh.slice(0,15).forEach(p=>console.log(`  · ${(p.publishedAt||'').slice(0,7)} ${p.title.slice(0,70).padEnd(70)} ${(p.venue||'').slice(0,20).padEnd(20)} ${p.areas.map(a=>AREA_NAMES[a]||a).join('/').slice(0,40)}${p.abstract?'':'  (no abstract)'}`));console.log('dry run — no model calls');process.exit(0)}
if(!fresh.length)process.exit(0);
if(!jevAvailable()){console.error(`No Jev key. ${jevHint}`);process.exit(2)}

// screen
let jevTok=0;const judged=[];
await pool(fresh,8,async c=>{try{const j=await judgePaper({title:c.title,venue:c.venue||'NVIDIA Research',publishedAt:c.publishedAt,abstract:c.abstract||`(no abstract available) Research areas: ${c.areas.map(a=>AREA_NAMES[a]||a).join(', ')}. Authors: ${c.authors.join(', ')}.`});
  jevTok+=(j.usage?.input||0)+(j.usage?.output||0);judged.push({...c,jev:j})}catch(e){console.error(`  ✗ jev ${c.title.slice(0,60)}: ${explainAuthError(e)}`);if(isFatal(e))process.exit(2)}});
const keep=judged.filter(x=>x.jev.derived.relevant&&x.jev.derived.significance>=MIN_SCORE).sort((a,b)=>(b.jev.derived.significance-a.jev.derived.significance)||((b.publishedAt||'')>(a.publishedAt||'')?1:-1)).slice(0,MAX);
const today=new Date().toISOString().slice(0,10);
for(const x of judged)if(!keep.includes(x))data.rejected[x.key]={title:x.title,venue:x.venue,relevant:x.jev.derived.relevant,domain:x.jev.derived.domain,significance:x.jev.derived.significance,reason:x.jev.derived.reason,screener:'jev',source:'nvidia-research',at:today};
await writeJson(DISC,data);
console.log(`judged ${judged.length} with Jev (${jevTok} tokens) · keeping ${keep.length} Physical AI papers · ${judged.length-keep.length} set aside`);
const dom={};for(const k of keep)dom[k.jev.derived.domain]=(dom[k.jev.derived.domain]||0)+1;console.log('  by domain:',JSON.stringify(dom));

// brief + graphic + index
const used=new Set([...data.papers.map(p=>p.slug),...atlasPapers.map(p=>p.slug)]);
const uniqueSlug=t=>{let s=slugify(t)||'paper',i=1;const b=s;while(used.has(s))s=`${b}-${++i}`;used.add(s);return s};
let fails=0,done=0;
await pool(keep,CONC,async c=>{
  const d=c.jev.derived;const rec={id:c.key,key:c.key,arxiv:c.arxiv,doi:null,slug:uniqueSlug(c.title),title:c.title,abstract:c.abstract||'',authors:c.authors,publishedAt:c.publishedAt||'',year:(c.publishedAt||'').slice(0,4),
    url:c.arxiv?`https://arxiv.org/abs/${c.arxiv}`:(c.external||BASE+c.path),pdf:c.pdf,source:'nvidia-research',sources:['nvidia-research'],venue:c.venue||'NVIDIA Research',upvotes:0,citations:0,org:'NVIDIA',
    queries:['nvidia-research'],areas:c.areas.map(a=>AREA_NAMES[a]||String(a)),nvidiaPage:BASE+c.path,screen:{relevant:true,domain:d.domain,significance:d.significance,reason:d.reason,screener:'jev'},discoveredAt:new Date().toISOString()};
  try{const b=await writeBrief({title:rec.title,lab:'NVIDIA Research',labKind:rec.venue,year:rec.year,url:rec.url,abstract:rec.abstract});delete b.usage;rec.ai=b;
    if(GRAPHICS){try{Object.assign(rec.ai,await renderGraphic(b.graphicPrompt,rec.slug))}catch(e){fails++;console.error(`  ✗ graphic ${rec.slug}: ${e.message}`)}}
    data.papers.push(rec);cls.papers[rec.slug]={at:new Date().toISOString(),origin:'discovered',transport:c.jev.transport,raw:c.jev.raw,derived:d};
    if(++done%10===0){await writeJson(DISC,data);await writeJson(CLS,cls)}
    console.log(`  ✓ ${String(done).padStart(3)} ★${d.significance} ${d.domain.padEnd(12)} ${rec.title.slice(0,62).padEnd(62)} ${(rec.venue||'').slice(0,22)}${rec.ai.graphic?'  ▣':''}`);
  }catch(e){fails++;console.error(`  ✗ brief ${c.title.slice(0,60)}: ${e.message}`)}
});
await writeJson(DISC,data);await writeJson(CLS,cls);
console.log(`\nDone. index now holds ${data.papers.length} discovered papers · +${done} from NVIDIA Research · ${fails} failures`);
process.exit(fails?1:0);
