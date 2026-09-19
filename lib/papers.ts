import {curatedLabs,type CuratedLab,type CuratedPaper} from './curatedLabs.ts';

// One flat, addressable record per curated paper. Source-index links (lab
// publication archives, not single papers) are kept out of this list; they
// remain on the lab card as `source` links.
export type AtlasPaper=CuratedPaper&{
  slug:string; number:number; lab:string; labKind:CuratedLab['kind']; labFocus:string[];
};

export function slugify(s:string){
  const greek:Record<string,string>={α:'alpha',β:'beta',γ:'gamma',δ:'delta',ε:'epsilon',θ:'theta',λ:'lambda',μ:'mu',π:'pi',σ:'sigma',τ:'tau',φ:'phi',ψ:'psi',ω:'omega'};
  const base=s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'')
    .replace(/[α-ω]/g,c=>greek[c]||c).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  if(base.length<=60)return base;
  const cut=base.slice(0,60);const i=cut.lastIndexOf('-');
  return (i>30?cut.slice(0,i):cut).replace(/-+$/,'');
}

const seen=new Map<string,number>();
export const atlasPapers:AtlasPaper[]=curatedLabs.flatMap(lab=>lab.papers.filter(p=>p.impact).map(p=>{
  let slug=slugify(p.title);const n=seen.get(slug)||0;seen.set(slug,n+1);if(n)slug=`${slug}-${n+1}`;
  return {...p,slug,number:0,lab:lab.name,labKind:lab.kind,labFocus:lab.focus};
})).map((p,i)=>({...p,number:i+1}));

export const paperBySlug=(slug:string)=>atlasPapers.find(p=>p.slug===slug);

// Model-written enrichment, produced by `npm run enrich` (scripts/enrich.mjs)
// through the GMI Cloud API and stored in data/enriched.json.
export type Enrichment={
  slug:string; model:string; generatedAt:string;
  tldr:string; whatChanged:string; soWhat:string; industry:string; keywords:string[];
  graphicPrompt:string; graphic?:string; graphicModel?:string; graphicRequestId?:string;
};
