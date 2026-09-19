#!/usr/bin/env node
// Physical Atlas enrichment — curated papers → GMI Cloud → briefs + graphics.
//
//   1. LLM pass  (api.gmi-serving.com): one structured brief per curated paper — tl;dr,
//      what changed, plain-English "so what", industry note, keywords, illustration brief.
//   2. Image pass (GMI Studio queue): one Seedream graphic per paper from that brief,
//      saved as PNG under public/graphics/.
//
// Results are cached in data/enriched.json; re-running only fills gaps.
//
//   npm run enrich                       # summaries + graphics for anything missing
//   npm run enrich -- --summaries        # LLM pass only
//   npm run enrich -- --graphics         # image pass only
//   npm run enrich -- --force            # regenerate everything
//   npm run enrich -- --limit 3          # first N papers only
//   npm run enrich -- --dry-run          # print the plan, spend nothing
//
// Auth: GMI_API_KEY in the environment, .env.local, or ~/.config/gmi/.env.
import path from 'node:path';
import {existsSync} from 'node:fs';
import {root,GRAPHICS_DIR,LLM_MODEL,IMAGE_MODEL,pool,pad,writeBrief,renderGraphic,readJson,writeJson} from './gmi.mjs';

const DATA=path.join(root,'data','enriched.json');
const CONCURRENCY=4;
const args=new Set(process.argv.slice(2));const flag=n=>args.has(`--${n}`);
const li=process.argv.indexOf('--limit');const LIMIT=li>-1?Number(process.argv[li+1]):Infinity;
const doSummaries=!flag('graphics')||flag('summaries'),doGraphics=!flag('summaries')||flag('graphics');
const FORCE=flag('force'),DRY=flag('dry-run');

const {atlasPapers}=await import('../lib/papers.ts');
const data=await readJson(DATA,{});
const save=()=>writeJson(DATA,data);

const papers=atlasPapers.slice(0,LIMIT);
const needSummary=papers.filter(p=>FORCE||!data[p.slug]?.tldr);
const needGraphic=papers.filter(p=>FORCE||!data[p.slug]?.graphic||!existsSync(path.join(GRAPHICS_DIR,`${p.slug}.png`)));
console.log(`Physical Atlas enrich — ${papers.length} papers · LLM ${LLM_MODEL} · image ${IMAGE_MODEL}`);
console.log(`  summaries to write: ${doSummaries?needSummary.length:0}   graphics to render: ${doGraphics?needGraphic.length:0}   (≈ $0.03 list per graphic before discount)`);
if(DRY){console.log('dry run — nothing submitted');process.exit(0)}

let tokens=0,fails=0;
if(doSummaries&&needSummary.length){
  await pool(needSummary,CONCURRENCY,async p=>{
    try{const b=await writeBrief(p);tokens+=b.usage?.total_tokens||0;delete b.usage;
      data[p.slug]={...(data[p.slug]||{}),slug:p.slug,...b};await save();
      console.log(`  ✓ summary  ${pad(p.number)} ${p.title}`);
    }catch(e){fails++;console.error(`  ✗ summary  ${p.title}: ${e.message}`)}
  });
}
if(doGraphics){
  const todo=needGraphic.filter(p=>data[p.slug]?.graphicPrompt);
  const skipped=needGraphic.length-todo.length;if(skipped)console.log(`  (${skipped} graphics skipped: no brief yet — run the summary pass first)`);
  await pool(todo,CONCURRENCY,async p=>{
    try{const g=await renderGraphic(data[p.slug].graphicPrompt,p.slug);data[p.slug]={...data[p.slug],...g};await save();
      console.log(`  ✓ graphic  ${pad(p.number)} ${p.slug}.png`);
    }catch(e){fails++;console.error(`  ✗ graphic  ${p.title}: ${e.message}`)}
  });
}
const withS=papers.filter(p=>data[p.slug]?.tldr).length,withG=papers.filter(p=>data[p.slug]?.graphic).length;
console.log(`\nDone. ${withS}/${papers.length} summaries · ${withG}/${papers.length} graphics · ${tokens} LLM tokens this run · ${fails} failures`);
process.exit(fails?1:0);
