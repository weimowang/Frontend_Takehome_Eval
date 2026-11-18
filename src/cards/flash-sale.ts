import type {Card} from '../schema/card';
import {emitAction, node, priceBlock, productImage, titleBlock} from '../components/shared';

/** The flash-sale renderer consumes the same validated card contract as ranking. */
export function renderFlashSale(card:Card):HTMLElement {
  const article=node('article','card flash-sale');
  article.setAttribute('aria-label',card.title);
  const media=productImage(card);
  if(card.videoUrl) {
    const play=node('button','play-button');
    play.type='button';
    play.setAttribute('aria-label',`播放 ${card.title} 影片`);
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
    icon.setAttribute('viewBox','0 0 24 24');
    icon.setAttribute('aria-hidden','true');
    const triangle=document.createElementNS('http://www.w3.org/2000/svg','path');
    triangle.setAttribute('d','M8 5v14l11-7z');
    triangle.setAttribute('fill','currentColor');
    icon.append(triangle);play.append(icon);
    play.addEventListener('click',()=>emitAction(play,card.id,'play'));
    media.append(play);
  }
  const body=node('div','body');
  if(card.tagline)body.append(node('p','tagline',card.tagline));
  body.append(titleBlock(card));
  const prices=priceBlock(card);
  const current=prices.querySelector('.price')!;
  const saleLine=node('div','sale-line');
  const label=node('span','sale-label','限搶價');
  saleLine.append(label,current);prices.prepend(saleLine);
  body.append(prices);
  const footer=node('div','flash-footer');
  if(card.stock!==undefined) {
    footer.append(node('span','stock',card.stock===0?'已售完':`最後${card.stock}組`));
  }
  const purchase=node('button','purchase',card.stock===0?'售完':'搶');
  purchase.type='button';purchase.disabled=card.stock===0;
  purchase.setAttribute('aria-label',card.stock===0?`${card.title} 已售完`:`搶購 ${card.title}`);
  purchase.addEventListener('click',()=>{if(!purchase.disabled)emitAction(purchase,card.id,'purchase');});
  footer.append(purchase);article.append(media,body,footer);return article;
}
