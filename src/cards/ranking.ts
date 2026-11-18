import type {Card} from '../schema/card';
import {node,productImage,priceBlock,titleBlock} from '../components/shared';
export function renderRanking(card:Card) {
  const article=node('article','card ranking');article.setAttribute('aria-label',card.title);
  const body=node('div','body');if(card.tagline)body.append(node('p','tagline',card.tagline));
  body.append(titleBlock(card),priceBlock(card));article.append(productImage(card),body);return article;
}
