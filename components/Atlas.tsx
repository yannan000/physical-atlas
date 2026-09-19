'use client';
import {useEffect,useMemo,useState} from 'react';
import type {PaperView,LabView} from '../lib/data';
import type {IndustryContribution} from '../lib/curatedLabs';

type View='papers'|'index'|'labs'|'industry'|'live';
type Live={id:string;title:string;summary:string;authors:string[];publishedAt:string;upvotes:number;url:string;organization?:{name:string}|null};
type Note={tldr:string;soWhat:string;model?:string;cached?:boolean}|{error:string}|'loading';
type IndustryView=IndustryContribution&{links:{name:string;href:string;internal:boolean}[]};
const KINDS:[string,string][]=[['All','All'],['Research lab','Research lab'],['Physical AI company','Physical AI company'],['Open research infrastructure','Open infrastructure']];
const DOMAINS=['all','robots','drones','autonomy','manipulation','locomotion','embodied','simulation','other'];
const VIEWS:[View,string][]=[['papers','Papers'],['index','Index'],['labs','Labs'],['industry','Industry'],['live','Live feed']];
const pad=(n:number)=>String(n).padStart(2,'0');
const stars=(n:number)=>'★'.repeat(n)+'☆'.repeat(5-n);
const plural=(n:number,w:string)=>`${n} ${w}${n===1?'':'s'}`;

export default function Atlas({papers,discovered,labs,industry,models}:{papers:PaperView[];discovered:PaperView[];labs:LabView[];industry:IndustryView[];models:{llm:string;image:string}}){
  const [view,setView]=useState<View>('papers');
  const [q,setQ]=useState('');
  const [kind,setKind]=useState('All');
  const [domain,setDomain]=useState('all');
  const [minScore,setMinScore]=useState(1);
  const [yearF,setYearF]=useState('all');
  const [srcF,setSrcF]=useState('all');
  const [sort,setSort]=useState<'score'|'newest'|'upvotes'|'citations'>('score');
  const [limit,setLimit]=useState(48);

  useEffect(()=>{const h=location.hash.slice(1) as View;if(VIEWS.some(v=>v[0]===h))setView(h)},[]);
  const go=(v:View)=>{setView(v);history.replaceState(null,'',v==='papers'?location.pathname:`#${v}`);document.getElementById('atlas')?.scrollIntoView({block:'start'})};

  const withGraphics=papers.filter(p=>p.ai?.graphic);
  const briefs=papers.filter(p=>p.ai?.tldr).length+discovered.filter(p=>p.ai?.tldr).length;
  const graphics=withGraphics.length+discovered.filter(p=>p.ai?.graphic).length;
  const mosaic=useMemo(()=>{const step=Math.max(1,Math.floor(withGraphics.length/6));return Array.from({length:6},(_,i)=>withGraphics[i*step]).filter(Boolean)},[withGraphics]);

  const match=(p:PaperView,needle:string)=>!needle||[p.title,p.lab,p.year,p.summary,p.ai?.tldr,p.discovered?.venue,p.discovered?.org,...(p.discovered?.authors||[]),...(p.ai?.keywords||[])].join(' ').toLowerCase().includes(needle);
  const shown=useMemo(()=>{const n=q.trim().toLowerCase();return papers.filter(p=>(kind==='All'||p.labKind===kind)&&match(p,n))},[papers,q,kind]);
  const yearBucket=(y:string)=>{const n=parseInt(y,10);return !Number.isFinite(n)?'older':n>=2026?'2026':n===2025?'2025':n===2024?'2024':'older'};
  const isPublished=(p:PaperView)=>!!(p.discovered?.venue&&p.discovered.venue!=='arXiv');
  const shownIndex=useMemo(()=>{const n=q.trim().toLowerCase();
    const list=discovered.filter(p=>{const d=p.discovered!;return (domain==='all'||d.screen.domain===domain)&&d.screen.significance>=minScore&&(yearF==='all'||yearBucket(p.year)===yearF)&&(srcF==='all'||(srcF==='published')===isPublished(p))&&match(p,n)});
    const sig=(p:PaperView)=>(p.discovered?.upvotes||0)+(p.discovered?.citations||0);
    return list.sort((a,b)=>sort==='newest'?(b.discovered!.publishedAt>a.discovered!.publishedAt?1:-1):sort==='upvotes'?(b.discovered!.upvotes-a.discovered!.upvotes)||(sig(b)-sig(a)):sort==='citations'?((b.discovered!.citations||0)-(a.discovered!.citations||0))||(sig(b)-sig(a)):(b.discovered!.screen.significance-a.discovered!.screen.significance)||(sig(b)-sig(a)));
  },[discovered,q,domain,minScore,yearF,srcF,sort]);
  useEffect(()=>{setLimit(48)},[q,domain,minScore,yearF,srcF,sort]);
  const yearCounts=useMemo(()=>discovered.reduce<Record<string,number>>((a,p)=>{const k=yearBucket(p.year);a[k]=(a[k]||0)+1;return a},{}),[discovered]);
  const publishedCount=useMemo(()=>discovered.filter(isPublished).length,[discovered]);
  const domainCounts=useMemo(()=>discovered.reduce<Record<string,number>>((a,p)=>{const d=p.discovered?.screen.domain||'other';a[d]=(a[d]||0)+1;return a},{}),[discovered]);

  return <main>
    <header className="hdr">
      <a className="brand" href="/">PHYSICAL<em>ATLAS</em></a>
      <nav aria-label="Primary">{VIEWS.map(([v,l])=><button key={v} className={view===v?'on':''} aria-pressed={view===v} onClick={()=>go(v)}>{l}{v==='index'&&discovered.length?` · ${discovered.length}`:''}</button>)}<a href="#method">Method</a></nav>
      <div className="powered"><span className="model">Model</span>DeepSeek-V4-Flash · Seedream-4.0 · GMI Cloud</div>
    </header>

    <section className="hero">
      <div>
        <div className="eyebrow">An illustrated index of Physical AI research</div>
        <h1>The atlas of machines that <em>learn to move.</em></h1>
        <p className="lede">Field-shaping papers across robots, drones, autonomy, manipulation, embodied AI and simulation. Every paper carries a model-written brief and a graphic generated from that brief. A discovery pass keeps scanning for more.</p>
        <div className="stats">
          <div><b>{papers.length}</b><span>Curated papers</span></div>
          <div><b>{discovered.length}</b><span>Discovered</span></div>
          <div><b>{labs.length}</b><span>Labs</span></div>
          <div><b>{briefs}</b><span>Model briefs</span></div>
          <div><b>{graphics}</b><span>Graphics</span></div>
        </div>
      </div>
      <div className="mosaic">{mosaic.map(p=><a key={p.slug} href={`/papers/${p.slug}`} aria-label={p.title}><img src={p.ai!.graphic} alt=""/><small>{pad(p.number)}</small></a>)}</div>
    </section>

    <div id="atlas"/>
    {view==='papers'&&<section className="section">
      <div className="sechead"><span className="mono">01 / The papers</span><div><h2>Every paper, illustrated</h2><p>Each card shows a graphic rendered from the paper's own illustration brief and a one-line summary written by a GMI-hosted model. Open a paper for the full brief and the editor's notes.</p></div></div>
      <div className="tools">
        <label className="search"><span aria-hidden="true">⌕</span><input aria-label="Search papers" placeholder="Search titles, labs, keywords…" value={q} onChange={e=>setQ(e.target.value)}/><kbd>{shown.length}</kbd></label>
        <div className="chips" role="group" aria-label="Filter by organization type">{KINDS.map(([k,l])=><button key={k} className="chip" aria-pressed={kind===k} onClick={()=>setKind(k)}>{l}</button>)}</div>
      </div>
      {shown.length?<div className="grid">{shown.map(p=><Card key={p.slug} p={p}/>)}</div>:<div className="empty">No papers match “{q}”.</div>}
    </section>}

    {view==='index'&&<section className="section">
      <div className="sechead"><span className="mono">02 / Discovered index</span><div><h2>Found by the discovery pass</h2><p>Papers pulled from Hugging Face Papers, arXiv, Semantic Scholar and OpenAlex — preprints, journals and proceedings — then screened by the model for relevance and significance before being briefed and illustrated. Affiliations are as reported by the source and are not editorially verified.</p></div></div>
      <div className="tools">
        <label className="search"><span aria-hidden="true">⌕</span><input aria-label="Search the index" placeholder="Search titles, venues, authors, keywords…" value={q} onChange={e=>setQ(e.target.value)}/><kbd>{shownIndex.length}</kbd></label>
        <label className="chips sortwrap"><span className="mono">Sort</span><select className="chip" aria-label="Sort the index" value={sort} onChange={e=>setSort(e.target.value as any)}><option value="score">Significance</option><option value="newest">Newest</option><option value="upvotes">Most upvoted</option><option value="citations">Most cited</option></select></label>
      </div>
      <div className="filters">
        <div className="chips" role="group" aria-label="Filter by domain">{DOMAINS.filter(d=>d==='all'||domainCounts[d]).map(d=><button key={d} className="chip" aria-pressed={domain===d} onClick={()=>setDomain(d)}>{d}{d!=='all'?` · ${domainCounts[d]}`:''}</button>)}</div>
        <div className="chips" role="group" aria-label="Filter by model significance">{[[1,'Any score'],[3,'★★★ +'],[4,'★★★★ +'],[5,'★★★★★']].map(([n,l])=><button key={n} className="chip" aria-pressed={minScore===n} onClick={()=>setMinScore(n as number)}>{l}</button>)}</div>
        <div className="chips" role="group" aria-label="Filter by year">{[['all','All years'],['2026','2026'],['2025','2025'],['2024','2024'],['older','Older']].filter(([k])=>k==='all'||yearCounts[k]).map(([k,l])=><button key={k} className="chip" aria-pressed={yearF===k} onClick={()=>setYearF(k)}>{l}{k!=='all'?` · ${yearCounts[k]}`:''}</button>)}</div>
        <div className="chips" role="group" aria-label="Filter by source type">{[['all','Any source'],['preprint','Preprints'],['published','Journals & proceedings']].filter(([k])=>k!=='published'||publishedCount).map(([k,l])=><button key={k} className="chip" aria-pressed={srcF===k} onClick={()=>setSrcF(k)}>{l}{k==='published'?` · ${publishedCount}`:k==='preprint'?` · ${discovered.length-publishedCount}`:''}</button>)}</div>
      </div>
      {shownIndex.length?<><div className="grid">{shownIndex.slice(0,limit).map(p=><Card key={p.slug} p={p}/>)}</div>
        {shownIndex.length>limit&&<div className="more"><button className="btn" onClick={()=>setLimit(l=>l+48)}>Show {Math.min(48,shownIndex.length-limit)} more · {shownIndex.length-limit} remaining</button></div>}</>
        :<div className="empty">{discovered.length?`Nothing in the index matches these filters${q?` and “${q}”`:''}.`:<>The index is empty. Run <code>npm run discover</code> to scan for new papers.</>}</div>}
    </section>}

    {view==='labs'&&<section className="section">
      <div className="sechead"><span className="mono">03 / Curated map</span><div><h2>Leading Physical AI labs</h2><p>An editorial shortlist based on sustained primary research, current activity, field-shaping systems, domain coverage and accessible evidence. Not a universal ranking. Research labs, companies and open infrastructure are labelled separately.</p></div></div>
      <div className="labgrid">{labs.map(l=><LabCard key={l.slug} l={l}/>)}</div>
    </section>}

    {view==='industry'&&<section className="section">
      <div className="sechead"><span className="mono">04 / Industry impact</span><div><h2>What research gave industry</h2><p>Concrete capabilities this research shipped to the world: open-source models, commercial products, deployed systems and platform tooling. Each entry is grounded in papers in the atlas; a chip opens the paper it names.</p></div></div>
      <div className="indgrid">{industry.map((c,i)=><article className="ind" key={c.area}>
        <div className="top"><span>{pad(i+1)}</span><b>{c.kind}</b></div>
        <h3>{c.area}</h3><p>{c.contribution}</p>
        <div className="tags">{c.links.map(x=>x.href?<a key={x.name} href={x.href} target={x.internal?undefined:'_blank'} rel={x.internal?undefined:'noreferrer'}>{x.name}</a>:<span key={x.name}>{x.name}</span>)}</div>
      </article>)}</div>
    </section>}

    {view==='live'&&<LiveFeed/>}

    <section className="section method" id="method">
      <span className="mono">How it works</span>
      <h2>Evidence first. <em>Model second.</em> Brand never.</h2>
      <div className="steps">
        <div><b>01 · Curate</b><p>Labs are shortlisted on sustained output, current activity, field-shaping systems, breadth and verifiable primary sources. Every paper links to its official page. Marketing and funding claims are not evidence.</p></div>
        <div><b>02 · Discover</b><p><code>npm run discover</code> scans Hugging Face Papers, arXiv, Semantic Scholar and OpenAlex — including robotics journals and proceedings such as Science Robotics, T-RO, RA-L, IJRR, CoRL and RSS — dedupes against the atlas, and has <code>{models.llm}</code> screen each candidate for relevance and significance.</p></div>
        <div><b>03 · Brief &amp; illustrate</b><p>For every kept paper the same model writes a structured brief — tl;dr, what changed, plain-English “so what”, industry note, keywords and an illustration brief — and <code>{models.image}</code> renders that brief through the GMI Studio queue in one house style, saved as PNG. No text is allowed in the image. Anything a model wrote or drew carries an acid chip.</p></div>
        <div><b>04 · Keep live</b><p>The live feed pulls public Hugging Face Papers metadata and can brief any paper on demand with the same model. Re-running <code>npm run enrich</code> or <code>npm run discover</code> only fills gaps, so nothing is regenerated by accident.</p></div>
      </div>
    </section>

    <footer>
      <a className="brand" href="/">PHYSICAL<em>ATLAS</em></a>
      <span>Built from public research metadata. Paper rights remain with their authors and publishers. Blue labels are the editor's; acid chips mark what a model wrote or drew. The curated set is reviewed editorially, the discovered index is not.</span>
      <a href="https://gmicloud.ai" target="_blank" rel="noreferrer">Inference: GMI Cloud ↗</a>
    </footer>
  </main>;
}

function Card({p}:{p:PaperView}){
  const d=p.discovered;const num=d?`D${pad(p.number)}`:pad(p.number);
  return <a className={`card${d?' discovered':''}`} href={`/papers/${p.slug}`}>
    <div className="tile">
      {p.ai?.graphic?<img src={p.ai.graphic} alt="" loading="lazy"/>:<div className="ph" aria-hidden="true">φ</div>}
      <span className="num">{num}</span>
      {p.ai?.graphic?<span className="model gen">Seedream 4.0</span>:<span className="outline gen">Graphic pending</span>}
    </div>
    <div className="meta"><b className="ed">{d?(d.venue&&d.venue!=='arXiv'?d.venue:p.lab):p.lab}</b><span>{p.year}</span></div>
    <h3>{p.title}</h3>
    <p>{p.ai?.tldr||p.summary}</p>
    {d&&<div className="stars"><span title="model significance score" aria-label={`${d.screen.significance} of 5`}>{stars(d.screen.significance)}</span><span>{d.screen.domain}{d.upvotes?` · ▲ ${d.upvotes}`:''}{d.citations?` · ${d.citations} cit.`:''}</span></div>}
    {p.ai?.keywords?.length?<div className="kw">{p.ai.keywords.slice(0,3).map(k=><span key={k}>{k}</span>)}</div>:null}
    {d&&<div className="unverified">Affiliation as reported · not editorially verified</div>}
  </a>;
}

function LabCard({l}:{l:LabView}){
  const feat=l.featuredPapers,idx=l.indexEntries[0];
  return <article className="lab">
    <div className="top"><span>{pad(l.number)}</span><span className={`kind${l.kind==='Physical AI company'?' company':''}`}>{l.kind}</span></div>
    <h3><a href={`/labs/${l.slug}`}>{l.name}</a></h3>
    <p className="why">{l.why}</p>
    <div className="focus">{l.focus.map(f=><span key={f}>{f}</span>)}</div>
    <div className="papers">
      {feat.map(p=><div className="row" key={p.url}>
        <a className={`head${p.graphic?' thumbed':''}`} href={p.slug?`/papers/${p.slug}`:p.url} target={p.slug?undefined:'_blank'} rel={p.slug?undefined:'noreferrer'}>
          {p.graphic&&<span className="thumb"><img src={p.graphic} alt="" loading="lazy"/></span>}
          <h4>{p.title}</h4><span className="yr">{p.year} ↗</span>
        </a>
        <p className="sum clamp">{p.summary}</p>
        <div className="impact"><i/><div className="clamp"><span className="ed">Industry contribution</span>{p.impact}</div></div>
      </div>)}
      {!feat.length&&idx&&<>
        <div className="row"><div className="head"><h4>{idx.title}</h4><span className="fill">Source index</span></div><p className="sum clamp">{idx.summary}</p></div>
        <div className="row grow"><span className="nofeat">No featured paper yet</span><p className="sum">This lab is listed on the strength of its archive. A featured paper with its industry contribution is the next editorial task.</p></div>
      </>}
    </div>
    <div className="foot">
      <a href={`/labs/${l.slug}`}><span>{l.paperCount?`All ${plural(l.paperCount,'paper')}`:'Lab page'}</span><span>→</span></a>
      <a className="src" href={l.source} target="_blank" rel="noreferrer"><span>{l.sourceLabel}</span><span>↗</span></a>
    </div>
  </article>;
}

function LiveFeed(){
  const [q,setQ]=useState('robotics');const [rows,setRows]=useState<Live[]>([]);const [loading,setLoading]=useState(true);
  const [notes,setNotes]=useState<Record<string,Note>>({});
  useEffect(()=>{let live=true;setLoading(true);const t=setTimeout(()=>{fetch(`/api/papers?q=${encodeURIComponent(q||'robotics')}`).then(r=>r.json()).then(d=>{if(live)setRows(d.papers||[])}).catch(()=>live&&setRows([])).finally(()=>live&&setLoading(false))},250);return()=>{live=false;clearTimeout(t)}},[q]);
  const summarize=async(p:Live)=>{setNotes(n=>({...n,[p.id]:'loading'}));
    try{const r=await fetch('/api/summarize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,title:p.title,summary:p.summary})});const d=await r.json();
      if(!r.ok||!d.enabled)throw new Error(d.reason||d.error||'Model summaries are unavailable right now.');
      setNotes(n=>({...n,[p.id]:{tldr:d.tldr,soWhat:d.soWhat,model:d.model,cached:!!d.cached}}));
    }catch(e:any){setNotes(n=>({...n,[p.id]:{error:e.message||'Model summaries are unavailable right now.'}}))}};
  return <section className="section">
    <div className="sechead"><span className="mono">05 / Live feed</span><div><h2>{loading?'Scanning the field…':'Latest from Hugging Face Papers'}</h2><p>Public paper metadata, refreshed hourly. Ask the model for a brief on any paper. It runs on DeepSeek-V4-Flash through GMI Cloud and is cached for the session.</p></div></div>
    <div className="tools"><label className="search"><span aria-hidden="true">⌕</span><input aria-label="Search the live feed" placeholder="Search the live feed…" value={q} onChange={e=>setQ(e.target.value)}/><kbd>LIVE</kbd></label></div>
    <div className="feed">{rows.slice(0,16).map((p,i)=>{const n=notes[p.id];const done=n&&n!=='loading';return <article key={p.id}>
      <span className="rank">{pad(i+1)}</span>
      <div className="body">
        <h3><a href={p.url} target="_blank" rel="noreferrer">{p.title}</a></h3>
        <p>{p.summary}</p>
        <small>{p.authors?.slice(0,3).join(', ')}{p.organization?.name?` · ${p.organization.name}`:''}</small>
        <div aria-live="polite">
          {done&&'tldr' in n&&<div className="ai"><div className="hd"><span className="model">Model brief</span><small>{(n.model||'DeepSeek-V4-Flash').split('/').pop()}{n.cached?' · cached':''}</small></div><p>{n.tldr}</p><p className="so">{n.soWhat}</p></div>}
          {done&&'error' in n&&<div className="ai off"><div className="hd"><span className="outline">Model brief unavailable</span></div><p>{n.error}</p></div>}
        </div>
      </div>
      <div className="side"><b>{p.upvotes||'new'}</b><small>{p.publishedAt?.slice(0,10)}</small>
        {!done&&<button className="btn" disabled={n==='loading'} aria-busy={n==='loading'} onClick={()=>summarize(p)}>{n==='loading'?'Writing…':'Summarise with model'}</button>}</div>
    </article>})}{!loading&&!rows.length&&<div className="empty">The live feed is unavailable right now.</div>}</div>
  </section>;
}
