import type {Card} from '../schema/card';
import {formatPrice,hasOriginalPrice} from '../core/pricing';
export function node<K extends keyof HTMLElementTagNameMap>(tag:K,className='',text?:string):HTMLElementTagNameMap[K] {
  const el=document.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el;
}
export function emitAction(target:HTMLElement,id:string,action:'select'|'purchase'|'play') {
  target.dispatchEvent(new CustomEvent('momo-card-action',{bubbles:true,composed:true,detail:{id,action}}));
}
export function productImage(card:Card) {
  const media=node('div','media');const img=node('img');img.alt=card.image.alt;img.src=card.image.src;img.loading='lazy';
  img.addEventListener('error',()=>{const fallback=node('div','image-fallback','商品圖片待提供');fallback.setAttribute('role','img');fallback.setAttribute('aria-label',card.image.alt+'（圖片暫無法載入）');img.replaceWith(fallback);},{once:true});
  media.append(img);return media;
}
export function priceBlock(card:Card) {
  const prices=node('div','prices');const current=node('strong','price',formatPrice(card.price));current.setAttribute('aria-label',`售價 ${formatPrice(card.price)}`);prices.append(current);
  if(hasOriginalPrice(card)) {const original=node('del','original-price',formatPrice(card.originalPrice!));original.setAttribute('aria-label',`原價 ${formatPrice(card.originalPrice!)}`);prices.append(original);}
  return prices;
}
export function titleBlock(card:Card) {
  const title=node('h2','title');
  for(const badge of card.badges??[])title.append(node('span',`badge ${badge.kind}`,badge.label));
  const action=card.productUrl?node('a'):node('button');
  if(action instanceof HTMLAnchorElement)action.href=card.productUrl!;
  else action.type='button';
  action.textContent=card.title;action.title=card.title;action.addEventListener('click',()=>emitAction(action,card.id,'select'));
  title.append(action);return title;
}
