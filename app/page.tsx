import Atlas from '../components/Atlas';
import {getPapers,getDiscovered,getLabs,getIndustry,resolveChip,models} from '../lib/data';

export const dynamic='force-dynamic';

export default function Home(){
  const papers=getPapers();
  const labs=getLabs(papers);
  const industry=getIndustry().map(c=>({...c,links:c.papers.map(name=>({name,...(resolveChip(name,labs)||{href:'',internal:false})}))}));
  return <Atlas papers={papers} discovered={getDiscovered()} labs={labs} industry={industry} models={models}/>;
}
