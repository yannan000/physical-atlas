import {experimental_evaluate as evaluate} from 'ai';
import {NextRequest,NextResponse} from 'next/server';
const choices=['robots','drones','autonomy','manipulation','embodied','simulation'];
export async function POST(req:NextRequest){
 if(!process.env.AI_GATEWAY_API_KEY)return NextResponse.json({enabled:false,reason:'Set AI_GATEWAY_API_KEY to enable Jev classification.'},{status:503});
 const {title,summary}=await req.json();
 const result=await evaluate({model:'typesafe-ai/jev',state:{title,summary},questions:{domain:{type:'choice',options:choices,instructions:'Choose the single best Physical AI research domain.'},practical:{type:'boolean',instructions:'Does this paper report or benchmark behavior in a physical system or realistic simulator?'}} as any,providerOptions:{gateway:{zeroDataRetention:true}}});
 return NextResponse.json({enabled:true,answers:result.answers});
}
