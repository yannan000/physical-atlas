#!/usr/bin/env node
// Physical Atlas classification — run TypeSafe Jev over every paper in the atlas and store
// typed judgments the site uses for filters: relevance, domain (with probabilities),
// significance, real-hardware, open-artifacts, survey and foundation-model facets.
//
//   npm run classify                    # every curated + discovered paper missing a judgment
//   npm run classify -- --force         # re-judge everything (e.g. after changing the questions)
//   npm run classify -- --discovered    # only the discovered index (or --curated)
//   npm run classify -- --limit 20
//   npm run classify -- --dry-run       # print what would run, call nothing
//   npm run classify -- --rethreshold   # no API calls: re-derive booleans from stored probabilities with the current POLICY
//
// Output: data/classified.json  { model, questionsHash, papers: { <slug>: { at, raw, derived } } }
// Auth: TYPESAFE_API_KEY. Cost is reported from the usage the API returns.
import path from 'node:path';
import {createHash} from 'node:crypto';
import {root,pool,readJson,writeJson} from './gmi.mjs';
import {jevAvailable,judgePaper,derive,QUESTIONS,POLICY,JEV_MODEL,TRANSPORT,jevHint,explainAuthError,isFatal} from './jev.mjs';

const DATA=path.join(root,'data','classified.json');
const argv=process.argv.slice(2);const flag=n=>argv.includes(`--${n}`);
const li=argv.indexOf('--limit');const LIMIT=li>-1?Number(argv[li+1]):Infinity;
const FORCE=flag('force'),DRY=flag('dry-run'),RETHRESH=flag('rethreshold');
const ONLY=flag('discovered')?'discovered':flag('curated')?'curated':null;
const ci=argv.indexOf('--concurrency');const CONC=Math.max(1,Number(ci>-1?argv[ci+1]:8)||8);

const questionsHash=createHash('sha1').update(JSON.stringify(QUESTIONS)).digest('hex').slice(0,10);
const {atlasPapers}=await import('../lib/papers.ts');
const discovered=(await readJson(path.join(root,'data','discovered.json'),{papers:[]})).papers;
const data=await readJson(DATA,{model:JEV_MODEL,questionsHash,policy:POLICY,papers:{}});

if(RETHRESH){
  // Re-derive from stored probabilities. Rebuild the answer shape derive() expects.
  let n=0;
  for(const [slug,rec] of Object.entries(data.papers)){const r=rec.raw;if(!r)continue;
    const answers={relevant:{noul:r.relevant},domain:{choice:r.domain.choice,confidence:r.domain.confidence,probabilities:r.domain.probabilities},
      significance:{score:r.significance.score,confidence:r.significance.confidence,probabilities:r.significance.probabilities},
      hardware:{noul:r.hardware},open:{noul:r.open},survey:{noul:r.survey},foundation:{noul:r.foundation}};
    rec.derived=derive(answers);n++}
  data.policy=POLICY;await writeJson(DATA,data);
  console.log(`re-derived ${n} papers with the current POLICY, no API calls`);process.exit(0);
}

const items=[
  ...(ONLY==='discovered'?[]:atlasPapers.map(p=>({slug:p.slug,origin:'curated',title:p.title,venue:p.lab,year:p.year,abstract:`${p.summary} ${p.impact||''}`.trim()}))),
  ...(ONLY==='curated'?[]:discovered.map(d=>({slug:d.slug,origin:'discovered',title:d.title,venue:d.venue,publishedAt:d.publishedAt,year:d.year,abstract:d.abstract}))),
];
const stale=data.questionsHash!==questionsHash;
const todo=items.filter(p=>FORCE||stale||!data.papers[p.slug]).slice(0,LIMIT);
console.log(`Physical Atlas classify — ${items.length} papers · Jev ${JEV_MODEL}${TRANSPORT?` via ${TRANSPORT==='direct'?'api.typesafe.ai':'Vercel AI Gateway'}`:''} · ${todo.length} to judge${stale?' (questions changed since last run: re-judging all)':''}`);
if(DRY){todo.slice(0,10).forEach(p=>console.log(`  · ${p.origin.padEnd(10)} ${p.title.slice(0,80)}`));if(todo.length>10)console.log(`  … ${todo.length-10} more`);console.log('dry run — no API calls');process.exit(0)}
if(!todo.length){console.log('nothing to do');process.exit(0)}
if(!jevAvailable()){console.error(`\nNo Jev key found. ${jevHint}\nNothing was judged.`);process.exit(2)}

let inTok=0,outTok=0,fails=0,done=0;
const save=()=>writeJson(DATA,{...data,model:JEV_MODEL,questionsHash,policy:POLICY});
await pool(todo,CONC,async p=>{
  try{const j=await judgePaper(p);inTok+=j.usage?.input||0;outTok+=j.usage?.output||0;
    data.papers[p.slug]={at:new Date().toISOString(),origin:p.origin,transport:j.transport,raw:j.raw,derived:j.derived};
    if(++done%25===0)await save();
    const d=j.derived;console.log(`  ✓ ${d.relevant?'keep':'DROP'} ★${d.significance} ${d.domain.padEnd(12)} ${d.hardware?'hw ':'   '}${d.open?'open ':'     '}${d.foundation?'fm ':'   '}${p.title.slice(0,60)}`);
  }catch(e){fails++;console.error(`  ✗ ${p.title.slice(0,60)}: ${explainAuthError(e)}`);if(isFatal(e)){if(done)await save();console.error('\nStopping: this error will repeat for every paper until the account issue is fixed.');process.exit(2)}}
});
await save();
const all=Object.values(data.papers);const drop=all.filter(r=>!r.derived.relevant).length;
console.log(`\nDone. ${all.length} papers classified · ${drop} judged not relevant or survey · ${inTok} in / ${outTok} out tokens · ${fails} failures`);
process.exit(fails?1:0);
