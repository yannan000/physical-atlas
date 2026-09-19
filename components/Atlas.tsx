'use client';
import {useEffect,useMemo,useState} from 'react';
import type {PaperView,LabView} from '../lib/data';
import type {IndustryContribution} from '../lib/curatedLabs';

type View='papers'|'index'|'labs'|'industry'|'live';
type Live={id:string;title:string;summary:string;authors:string[];publishedAt:string;upvotes:number;url:string;organization?:{name:string}|null};
type Note={tldr:string;soWhat:string;model?:string;cached?:boolean}|{error:string}|'loading';
type IndustryView=IndustryContribution&{links:{name:string;href:string;internal:boolean}[]};
type Facet='hardware'|'open'|'foundation';
type Sort='score'|'newest'|'upvotes'|'citations'|'confidence';
const KINDS:[string,string][]=[['All','All'],['Research lab','Research lab'],['Physical AI company','Physical AI company'],['Open research infrastructure','Open infrastructure']];
const DOMAINS=['all','robots','manipulation','locomotion','drones','autonomy','embodied','simulation','other'];
const FACETS:[Facet,string,string][]=[['hardware','Real hardware','Results on a real robot, drone, vehicle or device'],['open','Open code / data','Releases code, weights, a dataset, simulator or benchmark'],['foundation','Foundation-model based','Builds on a VLM, LLM, VLA or world foundation model']];
const VIEWS:[View,string][]=[['papers','Papers'],['index','Index'],['labs','Labs'],['industry','Industry'],['live','Live feed']];
const pad=(n:number)=>String(n).padStart(2,'0');
const stars=(n:number)=>'★'.repeat(n)+'☆'.repeat(5-n);
const plural=(n:number,w:string)=>`${n} ${w}${n===1?'':'s'}`;
const yearBucket=(y:string)=>{const n=parseInt(y,10);return !Number.isFinite(n)?'older':n>=2026?'2026':n===2025?'2025':n===2024?'2024':'older'};
const isPublished=(p:PaperView)=>!!(p.discovered?.venue&&p.discovered.venue!=='arXiv');
const sig=(p:PaperView)=>p.cls?.derived.significance??p.discovered?.screen.significance??0;
const signal=(p:PaperView)=>(p.discovered?.upvotes||0)+(p.discovered?.citations||0);

export default function Atlas({papers,discovered,labs,industry,models}:{papers:PaperView[];discovered:PaperView[];labs:LabView[];industry:IndustryView[];models:{llm:string;image:string;jev:string|null}}){
  const [view,setView]=useState<View>('papers');
  const [q,setQ]=useState('');
  const [kind,setKind]=useState('All');
  const [domain,setDomain]=useState('all');
  const [minScore,setMinScore]=useState(1);
  const [yearF,setYearF]=useState('all');
  const [srcF,setSrcF]=useState('all');
  const [facets,setFacets]=useState<Facet[]>([]);
  const [hideSurveys,setHideSurveys]=useState(true);
  const [showOffTopic,setShowOffTopic]=useState(false);
  const [sort,setSort]=useState<Sort>('score');
  const [limit,setLimit]=useState(48);
  const toggleFacet=(f:Facet)=>setFacets(fs=>fs.includes(f)?fs.filter(x=>x!==f):[...fs,f]);

  useEffect(()=>{const h=location.hash.slice(1) as View;if(VIEWS.some(v=>v[0]===h))setView(h)},[]);
  const go=(v:View)=>{setView(v);history.replaceState(null,'',v==='papers'?location.pathname:`#${v}`);document.getElementById('atlas')?.scrollIntoView({block:'start'})};

  const classified=useMemo(()=>[...papers,...discovered].filter(p=>p.cls).length,[papers,discovered]);
  const jevOn=classified>0;
  const withGraphics=papers.filter(p=>p.ai?.graphic);
  const briefs=papers.filter(p=>p.ai?.tldr).length+discovered.filter(p=>p.ai?.tldr).length;
  const graphics=withGraphics.length+discovered.filter(p=>p.ai?.graphic).length;
  const mosaic=useMemo(()=>{const step=Math.max(1,Math.floor(withGraphics.length/6));return Array.from({length:6},(_,i)=>withGraphics[i*step]).filter(Boolean)},[withGraphics]);

  const match=(p:PaperView,needle:string)=>!needle||[p.title,p.lab,p.year,p.summary,p.ai?.tldr,p.discovered?.venue,p.discovered?.org,...(p.discovered?.authors||[]),...(p.ai?.keywords||[]),...p.domains].join(' ').toLowerCase().includes(needle);
  const passFacets=(p:PaperView,hide=true)=>{const d=p.cls?.derived;if(!facets.length&&!(hide&&hideSurveys&&jevOn))return true;if(!d)return !facets.length;return facets.every(f=>d[f])&&!(hide&&hideSurveys&&d.survey)};
  const onTopic=(p:PaperView)=>showOffTopic||!p.cls||p.cls.derived.relevant||p.cls.derived.survey;
  const passDomain=(p:PaperView)=>domain==='all'||p.domain===domain||p.domains.includes(domain);
  const order=(list:PaperView[])=>list.sort((a,b)=>sort==='newest'?((b.discovered?.publishedAt||b.year)>(a.discovered?.publishedAt||a.year)?1:-1):sort==='upvotes'?((b.discovered?.upvotes||0)-(a.discovered?.upvotes||0))||(signal(b)-signal(a)):sort==='citations'?((b.discovered?.citations||0)-(a.discovered?.citations||0))||(signal(b)-signal(a)):sort==='confidence'?((b.cls?.derived.domainConfidence||0)-(a.cls?.derived.domainConfidence||0)):(sig(b)-sig(a))||(signal(b)-signal(a)));

  const shown=useMemo(()=>{const n=q.trim().toLowerCase();const list=papers.filter(p=>(kind==='All'||p.labKind===kind)&&passDomain(p)&&passFacets(p,false)&&match(p,n));return jevOn&&(domain!=='all'||facets.length)?order(list):list},[papers,q,kind,domain,facets,hideSurveys,jevOn,sort]);
  const shownIndex=useMemo(()=>{const n=q.trim().toLowerCase();
    return order(discovered.filter(p=>onTopic(p)&&passDomain(p)&&sig(p)>=minScore&&(yearF==='all'||yearBucket(p.year)===yearF)&&(srcF==='all'||(srcF==='published')===isPublished(p))&&passFacets(p)&&match(p,n)));
  },[discovered,q,domain,minScore,yearF,srcF,facets,hideSurveys,showOffTopic,sort,jevOn]);
  const offTopicCount=useMemo(()=>discovered.filter(p=>p.cls&&!p.cls.derived.relevant&&!p.cls.derived.survey).length,[discovered]);
  useEffect(()=>{setLimit(48)},[q,domain,minScore,yearF,srcF,facets,hideSurveys,showOffTopic,sort,view]);
  const counts=(list:PaperView[])=>list.reduce<Record<string,number>>((a,p)=>{for(const d of new Set([p.domain,...p.domains].filter(Boolean) as string[]))a[d]=(a[d]||0)+1;return a},{});
  const domainCountsIndex=useMemo(()=>counts(discovered),[discovered]);
  const domainCountsPapers=useMemo(()=>counts(papers),[papers]);
  const facetCounts=useMemo(()=>{const all=[...papers,...discovered];return {hardware:all.filter(p=>p.cls?.derived.hardware).length,open:all.filter(p=>p.cls?.derived.open).length,foundation:all.filter(p=>p.cls?.derived.foundation).length,survey:all.filter(p=>p.cls?.derived.survey).length}},[papers,discovered]);
  const yearCounts=useMemo(()=>discovered.reduce<Record<string,number>>((a,p)=>{const k=yearBucket(p.year);a[k]=(a[k]||0)+1;return a},{}),[discovered]);
  const publishedCount=useMemo(()=>discovered.filter(isPublished).length,[discovered]);

  const FacetRow=({index}:{index?:boolean})=>jevOn?<div className="chips" role="group" aria-label="Filter by Jev judgments"><span className="chip label"><span className="model">Jev</span></span>{FACETS.map(([f,l,t])=><button key={f} className="chip" title={t} aria-pressed={facets.includes(f)} onClick={()=>toggleFacet(f)}>{l} · {facetCounts[f]}</button>)}{index&&<button className="chip" title="Surveys, tutorials and benchmark-only papers" aria-pressed={hideSurveys} onClick={()=>setHideSurveys(s=>!s)}>{hideSurveys?'Surveys hidden':'Surveys shown'}{facetCounts.survey?` · ${facetCounts.survey}`:''}</button>}{index&&offTopicCount>0&&<button className="chip" title="Discovered papers Jev judged to be outside Physical AI" aria-pressed={showOffTopic} onClick={()=>setShowOffTopic(s=>!s)}>{showOffTopic?'Off-topic shown':'Off-topic hidden'} · {offTopicCount}</button>}</div>:null;
  const DomainRow=({c}:{c:Record<string,number>})=><div className="chips" role="group" aria-label="Filter by domain">{DOMAINS.filter(d=>d==='all'||c[d]).map(d=><button key={d} className="chip" aria-pressed={domain===d} onClick={()=>setDomain(d)}>{d}{d!=='all'?` · ${c[d]}`:''}</button>)}</div>;
  const SortBox=()=><label className="chips sortwrap"><span className="mono">Sort</span><select className="chip" aria-label="Sort" value={sort} onChange={e=>setSort(e.target.value as Sort)}><option value="score">Significance</option><option value="newest">Newest</option><option value="upvotes">Most upvoted</option><option value="citations">Most cited</option>{jevOn&&<option value="confidence">Clearest domain</option>}</select></label>;

  return <main>
    <header className="hdr">
      <a className="brand" href="/">PHYSICAL<em>ATLAS</em></a>
      <nav aria-label="Primary">{VIEWS.map(([v,l])=><button key={v} className={view===v?'on':''} aria-pressed={view===v} onClick={()=>go(v)}>{l}{v==='index'&&discovered.length?` · ${discovered.length}`:''}</button>)}<a href="#method">Method</a></nav>
      <div className="powered"><span className="model">Model</span>DeepSeek-V4-Flash · Seedream-4.0{jevOn?' · TypeSafe Jev':''} · GMI Cloud</div>
    </header>

    <section className="hero">
      <div>
        <div className="eyebrow">An illustrated index of Physical AI research</div>
        <h1>The atlas of machines that <em>learn to move.</em></h1>
        <p className="lede">Field-shaping papers across robots, drones, autonomy, manipulation, embodied AI and simulation. Every paper carries a model-written brief and a graphic generated from that brief.{jevOn?' Every paper is classified by typed judgments you can filter on.':' A discovery pass keeps scanning for more.'}</p>
        <div className="stats">
          <div><b>{papers.length}</b><span>Curated papers</span></div>
          <div><b>{discovered.length}</b><span>Discovered</span></div>
          <div><b>{labs.length}</b><span>Labs</span></div>
          <div><b>{briefs}</b><span>Model briefs</span></div>
          <div><b>{jevOn?classified:graphics}</b><span>{jevOn?'Jev-classified':'Graphics'}</span></div>
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
      {jevOn&&<div className="filters"><DomainRow c={domainCountsPapers}/><FacetRow/></div>}
      {shown.length?<div className="grid">{shown.map(p=><Card key={p.slug} p={p}/>)}</div>:<div className="empty">No papers match these filters{q?` and “${q}”`:''}.</div>}
    </section>}

    {view==='index'&&<section className="section">
      <div className="sechead"><span className="mono">02 / Discovered index</span><div><h2>Found by the discovery pass</h2><p>Papers pulled from Hugging Face Papers, arXiv, Semantic Scholar and OpenAlex — preprints, journals and proceedings — screened for relevance and significance, then briefed and illustrated.{jevOn?' Domain, significance and the facet filters are typed judgments from TypeSafe Jev with calibrated probabilities; thresholds live in code.':''} Affiliations are as reported by the source and are not editorially verified.</p></div></div>
      <div className="tools">
        <label className="search"><span aria-hidden="true">⌕</span><input aria-label="Search the index" placeholder="Search titles, venues, authors, keywords…" value={q} onChange={e=>setQ(e.target.value)}/><kbd>{shownIndex.length}</kbd></label>
        <SortBox/>
      </div>
      <div className="filters">
        <DomainRow c={domainCountsIndex}/>
        <div className="chips" role="group" aria-label="Filter by significance">{[[1,'Any score'],[3,'★★★ +'],[4,'★★★★ +'],[5,'★★★★★']].map(([n,l])=><button key={n} className="chip" aria-pressed={minScore===n} onClick={()=>setMinScore(n as number)}>{l}</button>)}</div>
        <div className="chips" role="group" aria-label="Filter by year">{[['all','All years'],['2026','2026'],['2025','2025'],['2024','2024'],['older','Older']].filter(([k])=>k==='all'||yearCounts[k]).map(([k,l])=><button key={k} className="chip" aria-pressed={yearF===k} onClick={()=>setYearF(k)}>{l}{k!=='all'?` · ${yearCounts[k]}`:''}</button>)}</div>
        <div className="chips" role="group" aria-label="Filter by source type">{[['all','Any source'],['preprint','Preprints'],['published','Journals & proceedings']].filter(([k])=>k!=='published'||publishedCount).map(([k,l])=><button key={k} className="chip" aria-pressed={srcF===k} onClick={()=>setSrcF(k)}>{l}{k==='published'?` · ${publishedCount}`:k==='preprint'?` · ${discovered.length-publishedCount}`:''}</button>)}</div>
        <FacetRow index/>
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
        <div><b>02 · Discover &amp; classify</b><p><code>npm run discover</code> scans Hugging Face Papers, arXiv, Semantic Scholar and OpenAlex, dedupes against the atlas, and screens each candidate. {jevOn?<>Screening and classification are typed judgments from TypeSafe <code>{models.jev}</code>: relevance, domain, significance, real hardware, open artifacts, survey and foundation-model use come back as calibrated probabilities. The thresholds that turn them into filters live in code, so they can change without re-running the model.</>:<>Screening uses <code>{models.llm}</code>; set <code>TYPESAFE_API_KEY</code> and run <code>npm run classify</code> to switch to typed Jev judgments.</>}</p></div>
        <div><b>03 · Brief &amp; illustrate</b><p>For every kept paper <code>{models.llm}</code> writes a structured brief — tl;dr, what changed, plain-English “so what”, industry note, keywords and an illustration brief — and <code>{models.image}</code> renders that brief through the GMI Studio queue in one house style. No text is allowed in the image. Anything a model wrote, drew or judged carries an acid chip.</p></div>
        <div><b>04 · Keep live</b><p>The live feed pulls public Hugging Face Papers metadata and can brief any paper on demand. Re-running <code>npm run enrich</code>, <code>npm run discover</code> or <code>npm run classify</code> only fills gaps, so nothing is regenerated by accident.</p></div>
      </div>
    </section>

    <footer>
      <a className="brand" href="/">PHYSICAL<em>ATLAS</em></a>
      <span>Built from public research metadata. Paper rights remain with their authors and publishers. Blue labels are the editor's; acid chips mark what a model wrote, drew or judged. The curated set is reviewed editorially, the discovered index is not.</span>
      <a href="https://gmicloud.ai" target="_blank" rel="noreferrer">Inference: GMI Cloud{jevOn?' · TypeSafe':''} ↗</a>
    </footer>
  </main>;
}

function Card({p}:{p:PaperView}){
  const d=p.discovered,c=p.cls?.derived;const num=d?`D${pad(p.number)}`:pad(p.number);
  const level=c?.significance??d?.screen.significance;
  const facets=c?[c.hardware&&'hw',c.open&&'open',c.foundation&&'fm',c.survey&&'survey'].filter(Boolean) as string[]:[];
  return <a className={`card${d?' discovered':''}`} href={`/papers/${p.slug}`}>
    <div className="tile">
      {p.ai?.graphic?<img src={p.ai.graphic} alt="" loading="lazy"/>:<div className="ph" aria-hidden="true">φ</div>}
      <span className="num">{num}</span>
      {p.ai?.graphic?<span className="model gen">Seedream 4.0</span>:<span className="outline gen">Graphic pending</span>}
    </div>
    <div className="meta"><b className="ed">{d?(d.venue&&d.venue!=='arXiv'?d.venue:p.lab):p.lab}</b><span>{p.year}</span></div>
    <h3>{p.title}</h3>
    <p>{p.ai?.tldr||p.summary}</p>
    {(level!==undefined)&&<div className="stars"><span title={c?'Jev significance':'model significance score'} aria-label={`${level} of 5`}>{stars(level)}</span><span>{p.domain||''}{facets.length?` · ${facets.join(' · ')}`:''}{d?.upvotes?` · ▲ ${d.upvotes}`:''}{d?.citations?` · ${d.citations} cit.`:''}</span></div>}
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
