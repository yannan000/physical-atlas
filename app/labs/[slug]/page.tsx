import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import {getLabs} from '../../../lib/data';

export const dynamic='force-dynamic';
export function generateStaticParams(){return getLabs().map(l=>({slug:l.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;const l=getLabs().find(x=>x.slug===slug);
  return l?{title:l.name,description:l.why}:{};
}
const pad=(n:number)=>String(n).padStart(2,'0');
const plural=(n:number,w:string)=>`${n} ${w}${n===1?'':'s'}`;
const yearKey=(y:string)=>{const n=parseInt(y,10);return Number.isFinite(n)?n:-1};

export default async function LabPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const labs=getLabs();const l=labs.find(x=>x.slug===slug);
  if(!l)notFound();
  const rows=l.papers.filter(p=>p.impact).sort((a,b)=>yearKey(b.year)-yearKey(a.year));
  const idx=l.indexEntries;
  return <main>
    <SiteHeader active="labs" powered={<>Briefs · DeepSeek-V4-Flash · Graphics · Seedream-4.0</>}/>

    <section className="labhero">
      <div className="side">
        <a className="crumb" href="/#labs">← Labs / {pad(l.number)}</a>
        <div className="facts"><span className={`kind${l.kind==='Physical AI company'?' company':''}`}>{l.kind}</span><span className="n">{plural(l.paperCount,'paper')}{l.years?` · ${l.years}`:''}{idx.length?` · ${plural(idx.length,'source index')}`:''}</span></div>
        <div className="focus">{l.focus.map(f=><span key={f}>{f}</span>)}</div>
        <a className="src" href={l.source} target="_blank" rel="noreferrer"><span>{l.sourceLabel}</span><span>↗</span></a>
      </div>
      <div>
        <h1>{l.name}</h1>
        <p className="lede">{l.why}</p>
      </div>
    </section>

    <section className="ledger" aria-label={`${l.name} papers`}>
      <div className="cols"><span>No.</span><span>Paper · what it does and shows</span><span>Industry contribution</span></div>
      {rows.map((p,i)=><div className="row" key={p.url}>
        <span className="no">{pad(i+1)}</span>
        <div className={p.graphic?'thumbrow':undefined}>
          {p.graphic&&<a className="thumb" href={p.slug?`/papers/${p.slug}`:p.url} aria-hidden="true" tabIndex={-1}><img src={p.graphic} alt=""/></a>}
          <div className="paper">
            <a href={p.slug?`/papers/${p.slug}`:p.url} target={p.slug?undefined:'_blank'} rel={p.slug?undefined:'noreferrer'}><span>{p.title}</span><span className="yr">{p.year} ↗</span></a>
            <div className="sum">{p.summary}</div>
          </div>
        </div>
        <div className="contrib"><i/><div>{p.impact}</div></div>
      </div>)}
      {idx.map((p,i)=><div className="row" key={p.url}>
        <span className="no">{rows.length?'—':pad(i+1)}</span>
        <div className="paper">
          <a href={p.url} target="_blank" rel="noreferrer"><span>{p.title}</span><span className="fill">Source index</span></a>
          <div className="sum">{p.summary}</div>
        </div>
        <div className="contrib none"><i/><div>Not a single paper, so no industry contribution is recorded. {rows.length?'':'A featured paper with its contribution is the next editorial task.'}</div></div>
      </div>)}
      {!rows.length&&!idx.length&&<div className="empty">No papers recorded for this lab yet.</div>}
    </section>

    <footer>
      <a className="brand" href="/">PHYSICAL<em>ATLAS</em></a>
      <span>Every paper links to its official page. Blue labels are the editor's; acid chips mark what a model wrote or drew.</span>
      <a href="/#labs">All labs →</a>
    </footer>
  </main>;
}
