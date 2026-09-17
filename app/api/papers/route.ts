import {NextRequest,NextResponse} from 'next/server';
const terms:Record<string,string>={all:'robotics',robots:'robot learning',drones:'autonomous drone',autonomy:'autonomous navigation',manipulation:'robot manipulation',embodied:'embodied ai',simulation:'robot simulation'};
export async function GET(req:NextRequest){
 const domain=req.nextUrl.searchParams.get('domain')||'all'; const q=req.nextUrl.searchParams.get('q')||terms[domain]||'robotics';
 try{const r=await fetch(`https://huggingface.co/api/papers/search?q=${encodeURIComponent(q)}`,{next:{revalidate:3600}});if(!r.ok)throw new Error('upstream');const rows=await r.json();const papers=rows.slice(0,24).map((x:any)=>{const p=x.paper||x;return{id:p.id,title:p.title,summary:p.summary,authors:(p.authors||[]).map((a:any)=>a.name).slice(0,5),publishedAt:p.publishedAt,upvotes:x.paper?.upvotes||x.upvotes||0,url:`https://huggingface.co/papers/${p.id}`,pdf:`https://arxiv.org/pdf/${p.id}`,organization:(p.organization||x.organization)?{name:(p.organization||x.organization).fullname||(p.organization||x.organization).name,avatar:(p.organization||x.organization).avatar}:null}});return NextResponse.json({papers,source:'Hugging Face Papers'});
 }catch{return NextResponse.json({papers:[],source:'unavailable'},{status:502})}
}
