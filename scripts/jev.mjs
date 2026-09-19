// TypeSafe Jev judgments for Physical Atlas.
//
// Jev is a System One model: it returns typed answers with calibrated probabilities, not
// text. Code owns the workflow; Jev supplies the semantic judgments a screening editor
// would make in a second from a title and abstract. All seven questions below are asked
// together over the same state and answered independently in one request.
//
// Two transports, chosen by which key is present (direct wins if both are set):
//   TYPESAFE_API_KEY    → api.typesafe.ai directly via @typesafe-ai/sdk       (model jev-latest)
//   AI_GATEWAY_API_KEY  → Vercel AI Gateway via the `ai` SDK's evaluate()      (model typesafe-ai/jev)
// Keys are read from the environment, then from .env.local at the project root.
// Docs: https://docs.typesafe.ai/api · https://docs.typesafe.ai/primitives · https://docs.typesafe.ai/confidence
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
(function loadEnvLocal(){
  const f=path.join(root,'.env.local');if(!existsSync(f))return;
  for(const line of readFileSync(f,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n#]*)"?\s*$/);if(m&&!process.env[m[1]]&&m[2].trim())process.env[m[1]]=m[2].trim()}
})();

export const TRANSPORT=(process.env.TYPESAFE_API_KEY||'').trim()?'direct':(process.env.AI_GATEWAY_API_KEY||'').trim()?'gateway':null;
export const JEV_MODEL=TRANSPORT==='gateway'?(process.env.ATLAS_JEV_GATEWAY_MODEL||'typesafe-ai/jev'):(process.env.TYPESAFE_DEFAULT_MODEL||'jev-latest');
export const jevAvailable=()=>TRANSPORT!==null;
export const jevHint='Set TYPESAFE_API_KEY (https://console.typesafe.ai/keys) or AI_GATEWAY_API_KEY (Vercel AI Gateway) in the environment or .env.local.';

// ---------- the judgments ----------
// Instructions carry the judgment; criteria define the answers. Question ids are for code only.
export const DOMAINS={
  robots:'Robot learning or control for manipulators, mobile robots or humanoids that does not fit a narrower option below; generalist robot policies and robot foundation models',
  manipulation:'Grasping, dexterous hands, contact-rich or bimanual manipulation, assembly, tool use',
  locomotion:'Legged, wheeled-legged or humanoid walking, balance, agile whole-body motion',
  drones:'Drones, quadrotors, UAVs and aerial robots: flight control, aerial navigation, swarms, aerial perception',
  autonomy:'Autonomous driving and ground-vehicle autonomy: driving planning, off-road navigation, vehicle world models',
  embodied:'Embodied agents and navigation: vision-language navigation, embodied question answering, agents acting in 3D scenes or homes',
  simulation:'Simulators, world models, synthetic data and sim-to-real infrastructure built to train or evaluate physical systems',
  other:'Physical AI work that fits none of the above, or not Physical AI at all',
};

export const SIGNIFICANCE_LEVELS=[
  'Incremental: a small modification of a known method, a narrow experiment, or an engineering report with limited novelty',
  'Solid: a clear new method or system with meaningful evaluation, mainly of interest to specialists in one sub-area',
  'Notable: a strong, well-evaluated contribution such as a new capability, dataset, model or system that others in the field would cite and build on',
  'Major: substantially advances the state of the art or opens a new direction; for example a large open dataset or model, or a convincing real-world deployment',
  'Field-shaping: a landmark result such as a new class of capability, a widely adopted open model or dataset, or deployment at scale that changes what industry can do',
];

// Transport-neutral definitions. `yesno` becomes TypeSafe `noul` or gateway `boolean`.
export const QUESTIONS={
  relevant:{kind:'yesno',instructions:{
    text:'Is this paper primary research on Physical AI: systems that perceive and act in the physical world, or models, data and simulation built specifically for such systems?',
    includes:'robots, drones and UAVs, autonomous vehicles, manipulation, legged locomotion, embodied agents, and world models or simulators used to train or evaluate them',
    excludes:'pure computer vision or NLP with no acting system, non-embodied reinforcement-learning benchmarks, medical imaging, generic video generation with no robotic use',
  },criteria:{true:'Physical AI research as defined',false:'Outside Physical AI'}},
  domain:{kind:'choice',instructions:"Which single Physical AI domain best describes the paper's main contribution?",criteria:DOMAINS},
  significance:{kind:'score',instructions:'How significant is this paper for the Physical AI field and for industry, judged from its title, venue and abstract?',criteria:SIGNIFICANCE_LEVELS},
  hardware:{kind:'yesno',instructions:'Does the paper report experiments on physical hardware, meaning a real robot, drone, vehicle or device, and not only in simulation or on offline datasets?',criteria:{true:'Real-world hardware results are reported',false:'Simulation-only, dataset-only, or no experiments'}},
  open:{kind:'yesno',instructions:'Does the paper state that it releases code, model weights, a dataset, a simulator or a benchmark for others to use?',criteria:{true:'An open artifact is released or announced',false:'No release mentioned'}},
  survey:{kind:'yesno',instructions:'Is this a survey, tutorial, position paper or benchmark-only paper that introduces no new method, system, model or dataset of its own?',criteria:{true:'Survey, tutorial, position or pure benchmark paper',false:'Introduces its own method, system, model or dataset'}},
  foundation:{kind:'yesno',instructions:'Does the method build on a large pretrained model, such as a vision-language model, an LLM, a vision-language-action model, or a video or world foundation model, as a core component?',criteria:{true:'A large pretrained model is central to the method',false:'No large pretrained model, or only a peripheral use'}},
};

/** The state Jev sees: named fields, source text only, nothing inferred. */
export function paperState(p){
  return {title:p.title,venue:p.venue||'arXiv preprint',published:p.publishedAt||p.year||'unknown',abstract:String(p.abstract||p.summary||'').slice(0,4000)};
}

// ---------- transports ----------
const toTypeSafe=q=>Object.fromEntries(Object.entries(q).map(([k,v])=>[k,{type:v.kind==='yesno'?'noul':v.kind,instructions:v.instructions,criteria:v.criteria}]));
const toGateway=q=>Object.fromEntries(Object.entries(q).map(([k,v])=>[k,{type:v.kind==='yesno'?'boolean':v.kind,instructions:v.instructions,criteria:v.criteria}]));

/** Normalised-entropy confidence (1 = all mass on one option). Used when a transport omits `confidence`. */
export function confidenceFrom(probabilities){
  const ps=Object.values(probabilities||{}).filter(p=>p>0);if(ps.length<2)return ps.length?1:null;
  const H=-ps.reduce((s,p)=>s+p*Math.log(p),0);return Math.max(0,Math.min(1,1-H/Math.log(ps.length)));
}

let _direct,_evaluate;
async function askDirect(state){
  if(!_direct){const {TypeSafeClient}=await import('@typesafe-ai/sdk');_direct=new TypeSafeClient({defaultModel:JEV_MODEL,retry:{maxRetries:5}})}
  const r=await _direct.systemOne({state,questions:toTypeSafe(QUESTIONS)});
  const a=r.answers;
  return {answers:{
      relevant:{noul:a.relevant.noul},hardware:{noul:a.hardware.noul},open:{noul:a.open.noul},survey:{noul:a.survey.noul},foundation:{noul:a.foundation.noul},
      domain:{choice:a.domain.choice,probabilities:a.domain.probabilities,confidence:a.domain.confidence},
      significance:{score:a.significance.score,probabilities:a.significance.probabilities,confidence:a.significance.confidence},
    },usage:{input:r.usage?.input_tokens||0,output:r.usage?.output_tokens||0},model:r.model||JEV_MODEL};
}
async function askGateway(state){
  if(!_evaluate){({experimental_evaluate:_evaluate}=await import('ai'))}
  const r=await _evaluate({model:JEV_MODEL,state,questions:toGateway(QUESTIONS),maxRetries:4});
  const a=r.answers;const yes=k=>({noul:a[k].probability});
  const dom=a.domain,sc=a.significance;
  return {answers:{
      relevant:yes('relevant'),hardware:yes('hardware'),open:yes('open'),survey:yes('survey'),foundation:yes('foundation'),
      domain:{choice:dom.choice,probabilities:dom.probabilities||{[dom.choice]:1},confidence:dom.confidence??confidenceFrom(dom.probabilities)},
      significance:{score:sc.score,probabilities:sc.probabilities||{},confidence:sc.confidence??confidenceFrom(sc.probabilities)},
    },usage:{input:r.usage?.inputTokens||0,output:r.usage?.outputTokens||0},model:r.response?.modelId||JEV_MODEL};
}

// ---------- policy (code-owned thresholds; change here without re-running inference) ----------
export const POLICY={
  relevantMin:0.5,      // probability the paper is Physical AI
  surveyMax:0.7,        // above this the paper is treated as a survey and kept out of the index
  domainSecondary:0.25, // Choice probability at which a second domain becomes a facet tag
  domainLowConfidence:0.4,
  facetMin:0.5,         // hardware / open / foundation booleans
};

/** Turn answers into the fields the site and scripts use. Raw answers are kept alongside. */
export function derive(a,policy=POLICY){
  const level=Math.max(1,Math.min(5,Math.round(a.significance.score)+1));
  const domains=Object.entries(a.domain.probabilities).filter(([k,p])=>k!=='other'&&(k===a.domain.choice||p>=policy.domainSecondary)).sort((x,y)=>y[1]-x[1]).map(([k])=>k);
  const isSurvey=a.survey.noul>=policy.surveyMax;
  const conf=a.domain.confidence;
  return {
    relevant:a.relevant.noul>=policy.relevantMin&&!isSurvey,
    domain:a.domain.choice,domains,
    domainConfidence:conf==null?null:Number(conf.toFixed(3)),
    uncertainDomain:conf!=null&&conf<policy.domainLowConfidence,
    significance:level,significanceScore:Number(a.significance.score.toFixed(2)),
    hardware:a.hardware.noul>=policy.facetMin,open:a.open.noul>=policy.facetMin,survey:isSurvey,foundation:a.foundation.noul>=policy.facetMin,
    reason:`Jev: Physical AI ${pct(a.relevant.noul)} · ${a.domain.choice} ${pct(a.domain.probabilities[a.domain.choice]??1)} · significance ${(a.significance.score+1).toFixed(1)}/5${a.hardware.noul>=policy.facetMin?' · real hardware':''}${a.open.noul>=policy.facetMin?' · open artifacts':''}${a.foundation.noul>=policy.facetMin?' · foundation-model based':''}${isSurvey?' · survey':''}`,
  };
}
const pct=x=>`${Math.round(x*100)}%`;
const r3=x=>x==null?null:Math.round(x*1000)/1000;
const r3map=o=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k,r3(v)]));

/** Compact record worth persisting (probabilities kept so thresholds can move later). */
export function compact(a){
  return {relevant:r3(a.relevant.noul),
    domain:{choice:a.domain.choice,confidence:r3(a.domain.confidence),probabilities:r3map(a.domain.probabilities)},
    significance:{score:r3(a.significance.score),confidence:r3(a.significance.confidence),probabilities:r3map(a.significance.probabilities)},
    hardware:r3(a.hardware.noul),open:r3(a.open.noul),survey:r3(a.survey.noul),foundation:r3(a.foundation.noul)};
}

/** One Jev request for one paper: seven judgments over the same state. */
export async function judgePaper(p){
  if(!TRANSPORT)throw new Error(`No Jev key. ${jevHint}`);
  const res=TRANSPORT==='direct'?await askDirect(paperState(p)):await askGateway(paperState(p));
  return {raw:compact(res.answers),derived:derive(res.answers),usage:res.usage,model:res.model,transport:TRANSPORT};
}

/** Human-readable failure, including the two account-side blockers we have seen. */
export function explainAuthError(e){
  const msg=e?.message||String(e);
  if(e?.status===401||e?.statusCode===401||/401|invalid api key|AuthenticationError/i.test(msg))return 'Jev rejected the API key (401). Check TYPESAFE_API_KEY / AI_GATEWAY_API_KEY.';
  if(/positive credit balance|top-up|top_up/i.test(msg))return 'Vercel AI Gateway refused the request: the account needs a positive credit balance (Vercel → AI Gateway → Top up). The smallest top-up is enough for the whole atlas.';
  if(/customer_verification_required|credit card/i.test(msg))return 'Vercel AI Gateway refused the request: the Vercel account needs a credit card on file (Vercel → AI → Add credit card). No charge for the free credits.';
  return msg;
}
export const isFatal=e=>[401,402,403].includes(e?.status??e?.statusCode)||/customer_verification_required|positive credit balance/i.test(e?.message||'');
