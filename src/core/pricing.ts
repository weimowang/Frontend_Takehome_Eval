import type {Card} from '../schema/card';
export function formatPrice(value:number):string {
  if(!Number.isSafeInteger(value)||value<0)throw new Error('無效價格');
  return `$${new Intl.NumberFormat('en-US').format(value)}`;
}
export function hasOriginalPrice(card:Pick<Card,'originalPrice'>):boolean {return card.originalPrice!==undefined;}
export function savingsPercent(price:number,originalPrice?:number):number|undefined {
  if(originalPrice===undefined || !Number.isSafeInteger(price)||!Number.isSafeInteger(originalPrice)||price<0||originalPrice<=price)return undefined;
  return Math.round((originalPrice-price)/originalPrice*100);
}
