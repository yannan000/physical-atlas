#!/usr/bin/env node
// Add one paper or model release to the discovered index by hand, through the same pipeline
// the discovery pass uses: Jev typed judgments → DeepSeek brief → Seedream graphic → index.
// For work that has no arXiv/DOI record yet (a model card, a technical blog, a lab report).
//
//   npm run add-paper -- --title "…" --url https://… --abstract "…" [--venue "Hugging Face model card"] \
//                         [--date 2026-08-04] [--org NVIDIA] [--pdf https://…] [--authors "A, B"] [--no-graphics]
//   npm run add-paper -- --from paper.json        # same fields as a JSON object
//
// The record is marked source "manual" and carries the venue you give, so the site labels it honestly.
import path from 'node:path';
import fs from 'node:fs/promises';
import {root,LLM_MODEL,IMAGE_MODEL,writeBrief,renderGraphic,readJson,writeJson} from './gmi.mjs';
import {jevAvailable,judgePaper,JEV_MODEL,POLICY,QUESTIONS,explainAuthError} from './jev.mjs';
import {createHash} from 'node:crypto';

const argv=process.argv.slice(2);const opt=(n,d)=>{const i=argv.indexOf(`--${n}`);return i>-1?argv[i+1]:d};const flag=n=>argv.includes(`--${n}`);
let rec=opt('from')?JSON.parse(await fs.readFile(opt('from'),'utf8')):{};
for(const k of ['title','url','abstract','venue','date','org','pdf','authors'])if(opt(k)!==undefined)rec[k]=opt(k);
if(!rec.title||!rec.url||!rec.abstract){console.error('need --title, --url and --abstract (or --from file.json)');process.exit(2)}
if(typeof rec.authors==='string')rec.authors=rec.authors.split(/\s*,\s*/).filter(Boolean);

const {atlasPapers,slugify}=await import('../lib/papers.ts');
const DISC=path.join(root,'data','discovered.json'),CLS=path.join(root,'data','classified.json');
const data=await readJson(DISC,{papers:[],rejected:{},backlog:{}});
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
if(data.papers.some(p=>norm(p.title)===norm(rec.title))||atlasPapers.some(p=>norm(p.title)===norm(rec.title))){console.error('already in the atlas:',rec.title);process.exit(1)}
const used=new Set([...data.papers.map(p=>p.slug),...atlasPapers.map(p=>p.slug)]);
let slug=slugify(rec.title)||'paper',i=1;const base=slug;while(used.has(slug))slug=`${base}-${++i}`;

const paper={title:rec.title,venue:rec.venue||'Manual entry',publishedAt:rec.date||'',year:(rec.date||'').slice(0,4),abstract:rec.abstract,url:rec.url};
console.log(`add-paper — "${rec.title}" · screen ${jevAvailable()?`Jev ${JEV_MODEL}`:'none (no Jev key)'} · brief ${LLM_MODEL} · graphic ${flag('no-graphics')?'off':IMAGE_MODEL}`);

// 1. Jev judgments (also stored in classified.json so the filters see them)
let screen={relevant:true,domain:'other',significance:3,reason:'Added by hand; not screened',screener:'manual'},jev=null;
if(jevAvailable()){try{jev=await judgePaper(paper);const d=jev.derived;screen={relevant:d.relevant,domain:d.domain,significance:d.significance,reason:d.reason,screener:'jev'};
  console.log(`  ✓ jev      ${d.relevant?'keep':'off-topic'} ★${d.significance} ${d.domain}${d.hardware?' · hw':''}${d.open?' · open':''}${d.foundation?' · fm':''}`)}catch(e){console.error('  ✗ jev',explainAuthError(e))}}

// 2. brief
const b=await writeBrief({title:paper.title,lab:rec.org||paper.venue,labKind:paper.venue,year:paper.year,url:paper.url,abstract:paper.abstract});delete b.usage;
console.log(`  ✓ brief    ${b.tldr.slice(0,90)}`);
// 3. graphic
if(!flag('no-graphics')){try{Object.assign(b,await renderGraphic(b.graphicPrompt,slug));console.log(`  ✓ graphic  ${slug}.png`)}catch(e){console.error('  ✗ graphic',e.message)}}

// 4. index
data.papers.push({id:`manual:${slug}`,key:`manual:${slug}`,arxiv:null,doi:null,slug,title:paper.title,abstract:paper.abstract,authors:rec.authors||[],publishedAt:paper.publishedAt,year:paper.year,
  url:paper.url,pdf:rec.pdf||null,source:'manual',sources:['manual'],venue:paper.venue,upvotes:0,citations:0,org:rec.org||null,queries:['manual'],screen,discoveredAt:new Date().toISOString(),ai:b});
await writeJson(DISC,data);
if(jev){const cls=await readJson(CLS,{model:JEV_MODEL,questionsHash:createHash('sha1').update(JSON.stringify(QUESTIONS)).digest('hex').slice(0,10),policy:POLICY,papers:{}});
  cls.papers[slug]={at:new Date().toISOString(),origin:'discovered',transport:jev.transport,raw:jev.raw,derived:jev.derived};await writeJson(CLS,cls)}
console.log(`\nIndexed as /papers/${slug} (D${String(data.papers.length).padStart(2,'0')})`);
