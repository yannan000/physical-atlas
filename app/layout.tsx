import type {Metadata} from 'next';
import './styles.css';

export const metadata:Metadata={
  title:{default:'Physical Atlas',template:'%s · Physical Atlas'},
  description:'An illustrated index of Physical AI research — robots, drones, autonomy, manipulation, embodied AI and simulation — with model-written summaries and a generated graphic for every paper.',
};

export default function Layout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}
