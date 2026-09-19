// Server-only data assembly: curated papers + discovered papers + model enrichment + Jev classification.
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {curatedLabs,industryContributions,type CuratedLab,type CuratedPaper} from './curatedLabs';
import {atlasPapers,slugify,type AtlasPaper,type Enrichment} from './papers';

export type Screen={relevant:boolean;domain:string;significance:number;reason:string;screener?:'jev'|'deepseek'};
export type Discovered={
  id:string;key?:string;arxiv?:string|null;doi?:string|null;slug:string;title:string;abstract:string;authors:string[];publishedAt:string;year:string;url:string;pdf:string|null;
  source:string;sources?:string[];venue?:string|null;upvotes:number;citations?:number;org:string|null;queries:string[];screen:Screen;discoveredAt:string;ai?:Enrichment;
};

/** Typed judgments from TypeSafe Jev (scripts/classify.mjs). `raw` keeps probabilities; `derived` applies the code-owned policy. */
export type Classified={
  at:string;origin:'curated'|'discovered';
  raw:{relevant:number;domain:{choice:string;confidence:number;probabilities:Record<string,number>};significance:{score:number;confidence:number;probabilities:Record<string,number>};hardware:number;open:number;survey:number;foundation:number};
  derived:{relevant:boolean;domain:string;domains:string[];domainConfidence:number;uncertainDomain:boolean;significance:number;significanceScore:number;hardware:boolean;open:boolean;survey:boolean;foundation:boolean;reason:string};
};
export type PaperView=Omit<AtlasPaper,'labKind'|'impact'>&{
  labKind:string;impact?:string;origin:'curated'|'discovered';ai:Enrichment|null;discovered?:Discovered;cls:Classified|null;
  /** Effective domain: Jev when classified, else the discovery screener, else none. */
  domain:string|null;domains:string[];
};
export type LabPaperView=CuratedPaper&{slug?:string;graphic?:string};
export type LabView=Omit<CuratedLab,'papers'>&{
  slug:string;number:number;papers:LabPaperView[];featuredPapers:LabPaperView[];paperCount:number;indexEntries:LabPaperView[];years:string;
};

function json<T>(rel:string,fallback:T):T{
  const f=path.join(process.cwd(),'data',rel);
  if(!existsSync(f))return fallback;
  try{return JSON.parse(readFileSync(f,'utf8'))}catch{return fallback}
}
export const loadEnrichment=()=>json<Record<string,Enrichment>>('enriched.json',{});
export const loadDiscovered=()=>json<{papers:Discovered[]}>('discovered.json',{papers:[]}).papers;
export const loadClassified=()=>json<{model?:string;papers:Record<string,Classified>}>('classified.json',{papers:{}});

export function getPapers():PaperView[]{
  const e=loadEnrichment(),c=loadClassified().papers;
  return atlasPapers.map(p=>{const cls=c[p.slug]||null;return {...p,origin:'curated' as const,ai:e[p.slug]||null,cls,domain:cls?.derived.domain||null,domains:cls?.derived.domains||[]}});
}

export function getDiscovered():PaperView[]{
  const c=loadClassified().papers;
  // D-numbers follow insertion order in data/discovered.json so they stay stable as the index grows.
  return loadDiscovered().map((d,i)=>{const cls=c[d.slug]||null;return {
    slug:d.slug,number:i+1,title:d.title,url:d.url,year:d.year,summary:d.abstract,origin:'discovered' as const,
    lab:d.org||(d.source==='arxiv'?'arXiv':'Hugging Face Papers'),labKind:'Discovered',labFocus:[cls?.derived.domain||d.screen.domain],ai:d.ai||null,discovered:d,cls,
    domain:cls?.derived.domain||d.screen.domain,domains:cls?.derived.domains||[d.screen.domain],
  }});
}

export const getAllPapers=()=>[...getPapers(),...getDiscovered()];
export const findPaper=(slug:string)=>getAllPapers().find(p=>p.slug===slug);

const yearKey=(y:string)=>{const n=parseInt(y,10);return Number.isFinite(n)?n:-1};
const byYearDesc=(a:{year:string},b:{year:string})=>yearKey(b.year)-yearKey(a.year);

export function getLabs(papers:PaperView[]=getPapers()):LabView[]{
  const byTitle=new Map(papers.map(p=>[p.title,p]));
  return curatedLabs.map((l,i)=>{
    const all:LabPaperView[]=l.papers.map(p=>{const m=byTitle.get(p.title);return {...p,slug:m?.slug,graphic:m?.ai?.graphic}});
    const real=all.filter(p=>p.impact).sort(byYearDesc);
    const ys=real.map(p=>yearKey(p.year)).filter(n=>n>0);
    const years=ys.length?(Math.min(...ys)===Math.max(...ys)?String(ys[0]):`${Math.min(...ys)}–${Math.max(...ys)}`):'';
    return {...l,slug:slugify(l.name),number:i+1,papers:all,featuredPapers:real.slice(0,2),paperCount:real.length,indexEntries:all.filter(p=>!p.impact),years};
  });
}
export const findLab=(slug:string)=>getLabs().find(l=>l.slug===slug);

export const getIndustry=()=>industryContributions;

/** Resolve an industry chip label to the paper it names (internal link), else the lab's source, else nothing. */
export function resolveChip(label:string,labs:LabView[]=getLabs()):{href:string;internal:boolean}|null{
  const clean=label.replace(/\(.*?\)/g,'').trim();
  const norm=(s:string)=>s.toLowerCase().replace(/[^a-z0-9π]+/g,' ').trim();
  const words=clean.split(/\s+/).filter(Boolean);
  const distinctive=(w:string)=>/[0-9]|[^\x00-\x7f]/.test(w)||/^[A-Z]/.test(w);
  for(let i=0;i<words.length;i++){
    const rest=words.slice(i);
    if(i>0&&rest.length===1&&!distinctive(rest[0]))break;
    const needle=norm(rest.join(' '));if(needle.length<2)break;
    const hit=atlasPapers.find(p=>norm(p.title).includes(needle));
    if(hit)return {href:`/papers/${hit.slug}`,internal:true};
  }
  const paren=label.match(/\((.*?)\)/)?.[1];
  const labWords=(l:LabView)=>norm(l.name).split(' ');
  const lab=labs.find(l=>paren&&norm(paren)===norm(l.name))||labs.find(l=>words.some(w=>w.length>=4&&labWords(l).includes(norm(w))));
  return lab?{href:`/labs/${lab.slug}`,internal:true}:null;
}

export const models={
  llm:process.env.ATLAS_LLM_MODEL||'deepseek-ai/DeepSeek-V4-Flash',
  image:process.env.ATLAS_IMAGE_MODEL||'seedream-4-0-250828',
  jev:loadClassified().model||null,
};
export const modelShort={llm:'DeepSeek-V4-Flash',image:'Seedream 4.0',jev:'Jev'};
