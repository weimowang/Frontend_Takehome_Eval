import {parseCatalog,type Card} from '../schema/card';
let catalog=new Map<string,Card>();
const listeners=new Set<()=>void>();
export function configureCatalog(input:unknown) {const cards=parseCatalog(input);catalog=new Map(cards.map(c=>[c.id,c]));listeners.forEach(fn=>fn());}
export function getProduct(id:string):Card|undefined {const card=catalog.get(id);return card?structuredClone(card):undefined;}
export function subscribeCatalog(listener:()=>void) {listeners.add(listener);return ()=>{listeners.delete(listener);};}
