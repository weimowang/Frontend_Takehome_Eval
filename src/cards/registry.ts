import {allowVariant,type Card} from '../schema/card';
export type Variant = {id:string;label:string;render:(card:Card)=>HTMLElement};
const registry=new Map<string,Variant>();
export function registerVariant(variant:Variant) {
  if(!variant.id.trim()||registry.has(variant.id))throw new Error('版型 id 不可為空或重複');
  registry.set(variant.id,variant);allowVariant(variant.id);
}
export function getVariant(id:string) {return registry.get(id);}
