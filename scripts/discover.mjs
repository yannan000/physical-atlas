#!/usr/bin/env node
// Physical Atlas discovery — find new Physical AI papers across preprint servers, journals
// and conference proceedings, screen them with the GMI model, brief the keepers, render
// their graphics, and index them in data/discovered.json.
//
//   Sources (no API keys needed):
//     hf        Hugging Face Papers search          huggingface.co/api/papers/search
//     arxiv     arXiv API (Atom, recency window)     export.arxiv.org/api/query
//     s2        Semantic Scholar Graph API           api.semanticscholar.org/graph/v1  — journals + proceedings, venue-filtered
//     openalex  OpenAlex works API                   api.openalex.org/works            — journals, venue-filtered
//
//   Pipeline per run:
//     1. fetch candidates for each query from each source → normalise → dedupe (arXiv id, DOI, title)
//        against curated + indexed + previously rejected papers
//     2. screen in batches with the GMI LLM: relevant? domain? significance 1-5? one-line reason
//     3. keep relevant papers scoring ≥ --min-score, cap at --max per run
//     4. write a brief for each keeper (same schema as the curated papers)
//     5. render a Seedream graphic from the brief (skip with --no-graphics)
//
//   npm run discover                                        # all sources, default queries + venues, ≤ 12 new papers
//   npm run discover -- --source s2,openalex                # journals & proceedings only
//   npm run discover -- --query "event camera drone" --query "tactile sensing manipulation"
//   npm run discover -- --venue "Science Robotics" --venue "IEEE Transactions on Robotics"
//   npm run discover -- --any-venue --days 14 --max 20      # no venue filter on s2/openalex
//   npm run discover -- --per-source 80                     # take more candidates from each source per query (default 40)
//   npm run discover -- --min-score 4 --no-graphics
//   npm run discover -- --no-balance                       # pure score order instead of round-robin across domains
//   npm run discover -- --backlog-only --max 700            # index everything already screened into the backlog, no fetching
//   npm run discover -- --dry-run                           # fetch + dedupe only, no model calls
//
// Auth: GMI_API_KEY in the environment, .env.local, or ~/.config/gmi/.env.
import path from 'node:path';
import {root,LLM_MODEL,IMAGE_MODEL,chatJson,writeBrief,renderGraphic,pool,readJson,writeJson,sleep} from './gmi.mjs';

const DATA=path.join(root,'data','discovered.json');
const argv=process.argv.slice(2);
const opt=(n,d)=>{const i=argv.indexOf(`--${n}`);return i>-1?argv[i+1]:d};
const flag=n=>argv.includes(`--${n}`);
const multi=n=>argv.flatMap((a,i)=>a===`--${n}`?[argv[i+1]]:[]);
const SOURCES=new Set((opt('source','all')==='all'?'hf,arxiv,s2,openalex':opt('source','all')).split(','));
const DAYS=Number(opt('days',90));            // recency window (arXiv, s2, openalex)
const MAX=Number(opt('max',12));              // new papers indexed per run (cost cap)
const MIN_SCORE=Number(opt('min-score',3));
const GRAPHICS=!flag('no-graphics');
const DRY=flag('dry-run');
const ANY_VENUE=flag('any-venue');
const BALANCE=!flag('no-balance');          // spread keepers across domains instead of pure score order
const BACKLOG_ONLY=flag('backlog-only');    // skip fetching and screening; index straight from the backlog
const CONC=Number(opt('concurrency',6));     // parallel briefs/graphics

const DEFAULT_QUERIES=[
  // physical AI / embodied
  'physical AI','vision-language-action model','embodied agent navigation','world model robotics','sim-to-real transfer','robot foundation model',
  // manipulation & humanoids & legged
  'robot manipulation policy','dexterous hand','humanoid robot control','legged locomotion learning',
  // drones / UAVs / aerial robotics
  'UAV autonomous flight','drone navigation','quadrotor learning control','agile flight reinforcement learning','aerial robotics perception','multi-UAV swarm coordination','drone obstacle avoidance vision',
  // ground autonomy
  'autonomous driving planning','off-road autonomous navigation',
];
const DEFAULT_VENUES=['Science Robotics','IEEE Transactions on Robotics','IEEE Robotics and Automation Letters','The International Journal of Robotics Research','Conference on Robot Learning','Robotics: Science and Systems','IEEE International Conference on Robotics and Automation','IEEE/RSJ International Conference on Intelligent Robots and Systems','Nature Machine Intelligence','Autonomous Robots','Journal of Field Robotics','Nature','Science'];
const QUERIES=multi('query').length?multi('query'):DEFAULT_QUERIES;
const VENUES=multi('venue').length?multi('venue'):DEFAULT_VENUES;
const venueOk=v=>ANY_VENUE||!v||VENUES.some(x=>String(v).toLowerCase().includes(x.toLowerCase()));

// ---------- helpers ----------
const UA={'User-Agent':'physical-atlas/1.0 (research index; github.com/yannan000)'};
if(process.env.S2_API_KEY)UA['x-api-key']=process.env.S2_API_KEY; // optional: lifts Semantic Scholar's unauthenticated rate limit
const arxivId=s=>{const m=String(s||'').match(/(\d{4}\.\d{4,5})(v\d+)?/);return m?m[1]:null};
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const clean=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
const since=()=>new Date(Date.now()-DAYS*864e5).toISOString().slice(0,10);
async function getJson(url,tries=3){
  for(let a=0;a<tries;a++){
    const r=await fetch(url,{headers:UA});
    if(r.status===429||r.status>=500){await sleep(3000*2**a);continue}
    if(!r.ok)throw new Error(`${r.status} ${url.slice(0,80)}`);
    return r.json();
  }
  throw new Error(`rate-limited: ${url.slice(0,80)}`);
}
/** Canonical record. `key` is the dedupe identity: arXiv id → DOI → title. */
function record(o){
  const ax=o.arxiv||null,doi=o.doi?String(o.doi).toLowerCase().replace(/^https?:\/\/doi\.org\//,''):null;
  return {...o,arxiv:ax,doi,key:ax?`arxiv:${ax}`:doi?`doi:${doi}`:`title:${norm(o.title)}`,title:clean(o.title),abstract:clean(o.abstract)};
}

// ---------- sources ----------
async function fromHuggingFace(q){
  const rows=await getJson(`https://huggingface.co/api/papers/search?q=${encodeURIComponent(q)}`);
  return rows.map(x=>{const p=x.paper||x;const id=arxivId(p.id);if(!id)return null;
    return record({arxiv:id,title:p.title,abstract:p.summary,authors:(p.authors||[]).map(a=>a.name).filter(Boolean).slice(0,8),publishedAt:(p.publishedAt||'').slice(0,10),
      url:`https://huggingface.co/papers/${id}`,pdf:`https://arxiv.org/pdf/${id}`,source:'huggingface',venue:'arXiv',upvotes:x.paper?.upvotes||x.upvotes||0,citations:0,org:(p.organization||x.organization)?.fullname||(p.organization||x.organization)?.name||null})}).filter(Boolean);
}
const tag=(xml,t)=>{const m=xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`));return m?m[1]:''};
async function fromArxiv(q){
  const from=since().replace(/-/g,'')+'0000';
  const search=`(cat:cs.RO OR cat:cs.CV OR cat:cs.LG OR cat:cs.AI) AND all:"${q}" AND submittedDate:[${from} TO 209912312359]`;
  const r=await fetch(`http://export.arxiv.org/api/query?search_query=${encodeURIComponent(search)}&sortBy=submittedDate&sortOrder=descending&max_results=25`,{headers:UA});
  if(!r.ok)throw new Error(`arxiv ${r.status}`);
  const xml=await r.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m=>{const e=m[1];const id=arxivId(tag(e,'id'));if(!id)return null;
    return record({arxiv:id,title:tag(e,'title'),abstract:tag(e,'summary'),authors:[...e.matchAll(/<name>([^<]+)<\/name>/g)].map(x=>x[1].trim()).slice(0,8),
      publishedAt:tag(e,'published').slice(0,10),url:`https://arxiv.org/abs/${id}`,pdf:`https://arxiv.org/pdf/${id}`,source:'arxiv',venue:'arXiv',upvotes:0,citations:0,org:null})}).filter(Boolean);
}
async function fromSemanticScholar(q){
  const fields='paperId,externalIds,title,abstract,year,publicationDate,venue,publicationVenue,authors,citationCount,url,openAccessPdf';
  const venue=ANY_VENUE?'':`&venue=${encodeURIComponent(VENUES.join(','))}`;
  const yr=new Date(since()).getFullYear();
  const d=await getJson(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q)}&limit=25&year=${yr}-&fields=${fields}${venue}`);
  return (d.data||[]).filter(p=>p.title&&p.abstract).map(p=>{const ax=p.externalIds?.ArXiv||null,doi=p.externalIds?.DOI||null;const v=p.publicationVenue?.name||p.venue||'';
    return record({arxiv:ax,doi,title:p.title,abstract:p.abstract,authors:(p.authors||[]).map(a=>a.name).slice(0,8),publishedAt:p.publicationDate||`${p.year||''}`,
      url:doi?`https://doi.org/${doi}`:ax?`https://arxiv.org/abs/${ax}`:p.url,pdf:p.openAccessPdf?.url||(ax?`https://arxiv.org/pdf/${ax}`:null),source:'semanticscholar',venue:v,upvotes:0,citations:p.citationCount||0,org:null})});
}
const invertAbstract=inv=>{if(!inv)return '';const words=[];for(const [w,pos] of Object.entries(inv))for(const i of pos)words[i]=w;return words.join(' ')};
async function fromOpenAlex(q){
  const sel='id,doi,title,publication_date,primary_location,authorships,cited_by_count,abstract_inverted_index,ids,open_access,type';
  const d=await getJson(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&filter=from_publication_date:${since()},type:article&sort=cited_by_count:desc&per-page=25&select=${sel}`);
  return (d.results||[]).map(w=>{const v=w.primary_location?.source?.display_name||'';if(!venueOk(v))return null;const abstract=invertAbstract(w.abstract_inverted_index);if(!w.title||!abstract)return null;
    const ax=arxivId(w.ids?.arxiv||w.ids?.openalex&&''), doi=w.doi||null;
    return record({arxiv:ax,doi,title:w.title,abstract,authors:(w.authorships||[]).map(a=>a.author?.display_name).filter(Boolean).slice(0,8),publishedAt:w.publication_date||'',
      url:doi||w.id,pdf:w.open_access?.oa_url||null,source:'openalex',venue:v,upvotes:0,citations:w.cited_by_count||0,org:(w.authorships?.[0]?.institutions?.[0]?.display_name)||null})}).filter(Boolean);
}
const SOURCE_FNS={hf:fromHuggingFace,arxiv:fromArxiv,s2:fromSemanticScholar,openalex:fromOpenAlex};
const SOURCE_DELAY={hf:300,arxiv:3100,s2:3200,openalex:300};
const PER_SOURCE=Number(opt('per-source',40));   // cap candidates taken from each source per query // be polite: arXiv asks ≥3 s, S2 ~1 req/s unauthenticated

// ---------- screening ----------
const SCREEN_SYSTEM=`You are the acquisitions editor of Physical Atlas, an index of Physical AI research: robots, drones, autonomous vehicles, manipulation, locomotion, embodied agents, world models and simulation used for physical systems.
Judge each candidate from its title, venue and abstract only. Be strict: pure computer vision, pure NLP, non-embodied RL benchmarks, medical imaging, and surveys without new systems are NOT relevant.
Significance 1-5: 5 = likely field-shaping (new capability, large open dataset/model, real-world deployment at scale); 3 = solid, useful contribution; 1 = incremental.
Respond with one JSON object: {"results":[{"id":"...","relevant":true|false,"domain":"robots|drones|autonomy|manipulation|embodied|simulation|other","significance":1-5,"reason":"one sentence, max 25 words"}]}`;

async function screen(batch){
  const user=batch.map((c,i)=>`[${i+1}] id: ${c.key}\ntitle: ${c.title}\nvenue: ${c.venue||'unknown'} (${c.publishedAt||'n.d.'})\nabstract: ${c.abstract.slice(0,1200)}`).join('\n\n');
  const {json,usage}=await chatJson(SCREEN_SYSTEM,`Candidates:\n\n${user}\n\nReturn a result for every id, using the id exactly as given.`,{maxTokens:2500,temperature:0.1,validate:j=>{if(!Array.isArray(j.results))throw new Error('no results array')}});
  const byId=new Map(json.results.map(r=>[String(r.id),r]));
  return {results:batch.map((c,i)=>{const r=byId.get(c.key)||json.results[i]||{};return {relevant:!!r.relevant,domain:String(r.domain||'other'),significance:Math.max(1,Math.min(5,Number(r.significance)||1)),reason:String(r.reason||'')}}),usage};
}

// ---------- main ----------
const {atlasPapers,slugify}=await import('../lib/papers.ts');
const data=await readJson(DATA,{papers:[],rejected:{},backlog:{}});
data.rejected??={};data.backlog??={};
const save=()=>writeJson(DATA,data);

const known=new Set([...data.papers.map(p=>p.key||p.id),...Object.keys(data.rejected),...Object.keys(data.backlog),...atlasPapers.map(p=>arxivId(p.url)).filter(Boolean).map(a=>`arxiv:${a}`)]);
const knownTitles=new Set([...data.papers.map(p=>norm(p.title)),...atlasPapers.map(p=>norm(p.title)),...Object.values(data.rejected).map(r=>norm(r.title))]);
const usedSlugs=new Set([...data.papers.map(p=>p.slug),...atlasPapers.map(p=>p.slug)]);
const uniqueSlug=t=>{let s=slugify(t)||'paper',i=1;const b=s;while(usedSlugs.has(s))s=`${b}-${++i}`;usedSlugs.add(s);return s};

console.log(`Physical Atlas discover — ${QUERIES.length} queries · sources ${[...SOURCES].join(',')} · window ${DAYS}d · venues ${ANY_VENUE?'any':VENUES.length+' listed'} · LLM ${LLM_MODEL}${GRAPHICS?` · image ${IMAGE_MODEL}`:' · graphics off'}`);
const seen=new Map();const perSource={};
for(const q of (BACKLOG_ONLY?[]:QUERIES)){
  const line=[];
  for(const s of SOURCES){
    if(!SOURCE_FNS[s]){console.error(`  unknown source "${s}"`);continue}
    let rows=[];try{rows=(await SOURCE_FNS[s](q)).slice(0,PER_SOURCE)}catch(e){line.push(`${s}:err`);console.error(`    ${s} "${q}": ${e.message}`)}
    let fresh=0;
    for(const c of rows){
      if(!c.title||!c.abstract||known.has(c.key)||knownTitles.has(norm(c.title)))continue;
      // same paper seen via another source: merge venue/citation info, prefer the arXiv/DOI-keyed identity
      const dup=[...seen.values()].find(x=>x.key===c.key||norm(x.title)===norm(c.title));
      if(dup){dup.sources.add(c.source);if(!dup.doi&&c.doi)dup.doi=c.doi;if(!dup.arxiv&&c.arxiv)dup.arxiv=c.arxiv;if((!dup.venue||dup.venue==='arXiv')&&c.venue)dup.venue=c.venue;dup.citations=Math.max(dup.citations,c.citations);dup.upvotes=Math.max(dup.upvotes,c.upvotes);if(!dup.queries.includes(q))dup.queries.push(q);continue}
      seen.set(c.key,{...c,sources:new Set([c.source]),queries:[q]});fresh++;
    }
    perSource[s]=(perSource[s]||0)+rows.length;line.push(`${s}:${rows.length}/+${fresh}`);
    await sleep(SOURCE_DELAY[s]);
  }
  console.log(`  ${q.padEnd(32)} ${line.join('  ')}`);
}
const candidates=[...seen.values()].map(c=>({...c,sources:[...c.sources]})).sort((a,b)=>(b.upvotes+b.citations)-(a.upvotes+a.citations)||(b.publishedAt>a.publishedAt?1:-1));
console.log(`\n${candidates.length} new candidates after dedupe against ${known.size} known/rejected papers  (fetched: ${Object.entries(perSource).map(([k,v])=>`${k} ${v}`).join(', ')})`);
if(DRY){candidates.slice(0,40).forEach(c=>console.log(`  · ${c.key.padEnd(28)} ${c.title.slice(0,80).padEnd(80)} ${(c.venue||'').slice(0,34)}  [${c.sources.join('+')}${c.upvotes?` ▲${c.upvotes}`:''}${c.citations?` c${c.citations}`:''}]`));console.log('dry run — no model calls');process.exit(0)}
const backlog=Object.values(data.backlog);
if(!candidates.length&&!backlog.length)process.exit(0);
if(backlog.length)console.log(`${backlog.length} already-screened papers waiting in the backlog from earlier runs`);

let tokens=0;const screened=[];
const batches=[];for(let i=0;i<candidates.length;i+=10)batches.push(candidates.slice(i,i+10));
await pool(batches,3,async b=>{try{const {results,usage}=await screen(b);tokens+=usage?.total_tokens||0;results.forEach((r,i)=>screened.push({...b[i],screen:r}))}catch(e){console.error(`  ✗ screen batch: ${e.message}`)}});
const signal=p=>(p.upvotes||0)+(p.citations||0);
const eligible=[...backlog,...screened.filter(p=>p.screen.relevant&&p.screen.significance>=MIN_SCORE)]
  .sort((a,b)=>(b.screen.significance-a.screen.significance)||(signal(b)-signal(a)));
/** Pick up to MAX: round-robin across domains (best first within each) so one hot topic cannot crowd out drones, autonomy, etc. */
function pick(list,max){
  if(!BALANCE)return list.slice(0,max);
  const byDomain=new Map();for(const p of list)(byDomain.get(p.screen.domain)??byDomain.set(p.screen.domain,[]).get(p.screen.domain)).push(p);
  const domains=[...byDomain.keys()].sort((a,b)=>byDomain.get(b)[0].screen.significance-byDomain.get(a)[0].screen.significance);
  const out=[];while(out.length<max&&domains.some(d=>byDomain.get(d).length))for(const d of domains){const q=byDomain.get(d);if(q.length&&out.length<max)out.push(q.shift())}
  return out;
}
const keepers=pick(eligible,MAX);
const fromBacklog=keepers.filter(k=>backlog.includes(k)).length;
console.log(`screened ${screened.length} · eligible ${eligible.length} (incl. ${backlog.length} from backlog) · keeping ${keepers.length}${fromBacklog?` (${fromBacklog} from backlog)`:''} (relevant, score ≥ ${MIN_SCORE}, max ${MAX}${BALANCE?', balanced across domains':''})`);
const today=new Date().toISOString().slice(0,10);
for(const p of screened)if(!(p.screen.relevant&&p.screen.significance>=MIN_SCORE))data.rejected[p.key]={title:p.title,venue:p.venue,...p.screen,at:today};
for(const p of eligible)if(!keepers.includes(p))data.backlog[p.key]={...p,at:p.at||today};
for(const p of keepers)delete data.backlog[p.key];
await save();

let fails=0;
await pool(keepers,CONC,async c=>{
  const rec={id:c.key,key:c.key,arxiv:c.arxiv,doi:c.doi,slug:uniqueSlug(c.title),title:c.title,abstract:c.abstract,authors:c.authors,publishedAt:c.publishedAt,year:String(c.publishedAt||'').slice(0,4),
    url:c.url,pdf:c.pdf,source:c.sources[0],sources:c.sources,venue:c.venue||null,upvotes:c.upvotes,citations:c.citations,org:c.org,queries:c.queries,screen:c.screen,discoveredAt:new Date().toISOString()};
  try{
    const b=await writeBrief({title:rec.title,lab:rec.org||rec.venue||'unverified affiliation',labKind:rec.venue&&rec.venue!=='arXiv'?`published in ${rec.venue}`:'preprint',year:rec.year,url:rec.url,abstract:rec.abstract});
    tokens+=b.usage?.total_tokens||0;delete b.usage;rec.ai=b;
    if(GRAPHICS){try{Object.assign(rec.ai,await renderGraphic(b.graphicPrompt,rec.slug))}catch(e){console.error(`  ✗ graphic ${rec.slug}: ${e.message}`);fails++}}
    data.papers.push(rec);await save();
    console.log(`  ✓ indexed  ★${rec.screen.significance} ${rec.screen.domain.padEnd(12)} ${rec.title.slice(0,64).padEnd(64)} ${(rec.venue||'').slice(0,28)}${rec.ai.graphic?'  ▣':''}`);
  }catch(e){fails++;console.error(`  ✗ brief ${c.key}: ${e.message}`)}
});
await save();
console.log(`\nDone. index now holds ${data.papers.length} discovered papers · ${Object.keys(data.backlog).length} eligible in backlog · ${Object.keys(data.rejected).length} screened out · ${tokens} LLM tokens this run · ${fails} failures`);
process.exit(fails?1:0);
