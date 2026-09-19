import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import {getAllPapers,getPapers,getDiscovered,getLabs} from '../../../lib/data';

export const dynamic='force-dynamic';
export function generateStaticParams(){return getAllPapers().map(p=>({slug:p.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;const p=getAllPapers().find(x=>x.slug===slug);
  return p?{title:p.title,description:p.ai?.tldr||p.summary,openGraph:p.ai?.graphic?{images:[p.ai.graphic]}:undefined}:{};
}
const pad=(n:number)=>String(n).padStart(2,'0');
const stars=(n:number)=>'★'.repeat(n)+'☆'.repeat(5-n);

export default async function PaperPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const curated=getPapers(),discovered=getDiscovered();
  let list=curated,i=list.findIndex(x=>x.slug===slug);
  if(i<0){list=discovered;i=list.findIndex(x=>x.slug===slug)}
  if(i<0)notFound();
  const p=list[i],prev=list[i-1],next=list[i+1],ai=p.ai,d=p.discovered;
  const lab=getLabs(curated).find(x=>x.name===p.lab);
  const label=(n:number)=>d?`D${pad(n)}`:pad(n);
  const Thumb=({x}:{x:typeof p})=><span className="thumb">{x.ai?.graphic?<img src={x.ai.graphic} alt=""/>:'φ'}</span>;
  return <main>
    <SiteHeader active={d?'index':'papers'} powered={<>Brief · {(ai?.model||'DeepSeek-V4-Flash').split('/').pop()}{ai?.graphicModel&&<> · Graphic · Seedream-4.0</>}</>}/>

    <article className="detail">
      <div className="art">
        <figure>
          {ai?.graphic?<img src={ai.graphic} alt={`Generated illustration for ${p.title}`}/>:<div className="ph" aria-hidden="true">φ</div>}
          <figcaption><span>{d?'Discovered':'Paper'} {label(p.number)} of {list.length}</span>{ai?.graphicModel?<span className="model">Seedream 4.0 · GMI Studio</span>:<span className="outline">Graphic pending</span>}</figcaption>
        </figure>
        {ai?.graphicPrompt&&<details><summary>Illustration brief the model wrote</summary><p>{ai.graphicPrompt}</p></details>}
        {ai&&<div className="prov"><b>Provenance.</b> Brief written by {ai.model} via GMI Cloud on {new Date(ai.generatedAt).toISOString().slice(0,10)} from the paper's title, primary link and {d?'abstract; screened automatically, not editorially reviewed':"the editor's notes; reviewed editorially"}.{ai.graphicRequestId&&<> Graphic rendered by {ai.graphicModel} through the GMI Studio request queue (request {ai.graphicRequestId.slice(0,8)}…), converted to PNG locally.</>} Summaries can be wrong; the linked paper is the source of truth.</div>}
      </div>

      <div>
        <div className="crumbs"><a href="/">Atlas</a><span>/</span>{d?<><a href="/#index">Index</a><span>/</span><b>{d.venue&&d.venue!=='arXiv'?d.venue:p.lab}</b><span>·</span><span>{d.screen.domain}</span><span>·</span><span>{d.publishedAt||p.year}</span></>:<>{lab?<a href={`/labs/${lab.slug}`}><b>{p.lab}</b></a>:<b>{p.lab}</b>}<span>·</span><span>{p.labKind}</span><span>·</span><span>{p.year}</span></>}</div>
        <h1>{p.title}</h1>
        <div className="tldr">{ai?<span className="model">Model tl;dr</span>:<span className="ed">Editor</span>}<p>{ai?.tldr||p.summary}</p></div>
        {ai?.keywords?.length?<div className="kws">{ai.keywords.map(k=><span key={k}>{k}</span>)}</div>:null}

        {ai?<>
          <section className="block first"><div className="hd"><h2>What changed</h2><span className="model sm">Model</span></div><p>{ai.whatChanged}</p></section>
          <section className="block"><div className="hd"><h2>So what, in plain English</h2><span className="model sm">Model</span></div><p>{ai.soWhat}</p></section>
          <section className="block"><div className="hd"><h2>Contribution to industry</h2><span className="model sm">Model</span></div><p>{ai.industry}</p></section>
        </>:<section className="block first"><div className="hd"><h2>Model brief pending</h2></div><p className="muted">Run <code>npm run enrich</code> to generate this paper's brief and graphic through GMI Cloud.</p></section>}

        {d?<>
          <section className="block editor"><div className="hd"><h2>Why it is in the index</h2></div><p><b title="model significance score" aria-label={`${d.screen.significance} of 5`}>{stars(d.screen.significance)}</b> &nbsp;{d.screen.reason}</p><p>Found via {d.sources?.join(' + ')||d.source} for “{d.queries?.join('”, “')}”.{d.upvotes?` ${d.upvotes} Hugging Face upvotes.`:''}{d.citations?` ${d.citations} citations at discovery.`:''} Affiliation as reported · not editorially verified.</p></section>
          <section className="block editor"><div className="hd"><h2>Abstract</h2></div><p>{d.abstract}</p>{d.authors?.length?<p><b>Authors.</b> {d.authors.join(', ')}{d.authors.length>=8?' et al.':''}</p>:null}</section>
        </>:<section className="block editor"><div className="hd"><h2>Editor's notes</h2></div><p><b>Summary.</b> {p.summary}</p><div className="impact"><i/><p><b>Industry.</b> {p.impact}</p></div></section>}

        <div className="btns">
          <a className="primary" href={p.url} target="_blank" rel="noreferrer">Read the paper ↗</a>
          {d?.pdf&&<a href={d.pdf} target="_blank" rel="noreferrer">PDF ↗</a>}
          {lab&&<a href={lab.source} target="_blank" rel="noreferrer">{lab.sourceLabel} ↗</a>}
          {lab&&<a href={`/labs/${lab.slug}`}>All {lab.paperCount} {lab.name} papers →</a>}
        </div>
      </div>
    </article>

    <nav className="pn" aria-label="Previous and next paper">
      {prev?<a href={`/papers/${prev.slug}`}><Thumb x={prev}/><div><small>← Previous · {label(prev.number)}</small><span>{prev.title}</span></div></a>:<span/>}
      {next?<a className="next" href={`/papers/${next.slug}`}><div><small>Next · {label(next.number)} →</small><span>{next.title}</span></div><Thumb x={next}/></a>:<span/>}
    </nav>
  </main>;
}
