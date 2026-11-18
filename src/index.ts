import {MomoCard} from './components/momo-card';
import {registerVariant,getVariant} from './cards/registry';
import {renderRanking} from './cards/ranking';
import {renderFlashSale} from './cards/flash-sale';
import {parseCard,type Card} from './schema/card';
if(!getVariant('ranking'))registerVariant({id:'ranking',label:'今日暢銷卡',render:renderRanking});
if(!getVariant('flash-sale'))registerVariant({id:'flash-sale',label:'限時搶購卡',render:renderFlashSale});
if(!customElements.get('momo-card'))customElements.define('momo-card',MomoCard);
export {MomoCard,registerVariant};
export {configureCatalog} from './core/catalog';
export {fields,parseCard} from './schema/card';
export type {Card};
export function mount(container:HTMLElement,options:{data:Card;variant?:string}) {
  const card=parseCard(options.data);const element=document.createElement('momo-card') as MomoCard;element.data=card;
  if(options.variant!==undefined)element.setAttribute('variant',options.variant);container.append(element);
  let destroyed=false;
  return {element,update(next:Card){if(destroyed)throw new Error('元件已銷毀');element.data=parseCard(next);},destroy(){if(destroyed)return;destroyed=true;element.remove();}};
}
