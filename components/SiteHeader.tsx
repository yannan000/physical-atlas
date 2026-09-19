// Static header for server-rendered pages (paper page, lab page). The home page's
// client component renders its own copy with view-switching buttons.
export default function SiteHeader({active,powered}:{active?:'papers'|'index'|'labs'|'industry'|'live';powered:React.ReactNode}){
  const items:[string,string,string][]=[['papers','Papers','/'],['index','Index','/#index'],['labs','Labs','/#labs'],['industry','Industry','/#industry'],['live','Live feed','/#live']];
  return <header className="hdr">
    <a className="brand" href="/">PHYSICAL<em>ATLAS</em></a>
    <nav aria-label="Primary">{items.map(([k,l,h])=><a key={k} href={h} className={active===k?'on':''}>{l}</a>)}<a href="/#method">Method</a></nav>
    <div className="powered"><span className="model">Model</span>{powered}</div>
  </header>;
}
