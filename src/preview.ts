import './styles/tokens.css';
import './styles/preview.css';
import {configureCatalog,parseCard,type MomoCard} from './index';
import raw from '../mock/cards.draft.json';
const cards=raw.map(parseCard);configureCatalog(cards);
const preview=document.querySelector<MomoCard>('#preview')!;
const select=document.querySelector<HTMLSelectElement>('#product')!;
const variant=document.querySelector<HTMLSelectElement>('#variant')!;
const price=document.querySelector<HTMLInputElement>('#price')!;
const feedback=document.querySelector<HTMLElement>('#feedback')!;
for(const card of cards) {
  const option=document.createElement('option');option.value=card.id;option.textContent=card.title;select.append(option);
  const element=document.createElement('momo-card');element.setAttribute('product-id',card.id);
  document.querySelector(card.variant==='flash-sale'?'#flash-grid':'#ranking-grid')!.append(element);
}
select.value='rank-bose';
function selectProduct(id:string) {
  const card=cards.find(c=>c.id===id);if(!card)return;
  select.value=id;preview.data=null;preview.setAttribute('product-id',id);price.value=String(card.price);
  feedback.textContent=`正在預覽 ${card.title}`;
}
select.addEventListener('change',()=>selectProduct(select.value));
variant.addEventListener('change',()=>{if(variant.value)preview.setAttribute('variant',variant.value);else preview.removeAttribute('variant');});
document.querySelector('#update')!.addEventListener('click',()=>{try {const card=cards.find(c=>c.id===select.value)!;if(price.value==='')throw new Error('請輸入售價');preview.data=parseCard({...card,price:Number(price.value)});feedback.textContent='預覽已更新；此階段尚未保存。';}catch(error){feedback.textContent=(error as Error).message;}});
document.addEventListener('momo-card-action',(event)=>{
  const detail=(event as CustomEvent<{id:string;action:string}>).detail;
  if(detail.action==='select')selectProduct(detail.id);
  else feedback.textContent=`示範互動：${detail.id}（${detail.action}），不會建立訂單或進行交易。`;
});
