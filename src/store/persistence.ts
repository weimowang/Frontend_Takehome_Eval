import {parseCatalog,type Card} from '../schema/card';

export const STORAGE_KEY='merchant-card-showroom:v1';
export interface Snapshot {
  version:1;
  cards:Card[];
  selectedId:string;
  updatedAt:number;
}

/** Decode a complete snapshot before it can replace canonical application state. */
export function decodeSnapshot(raw:string):Snapshot {
  const value:unknown=JSON.parse(raw);
  if(typeof value!=='object'||value===null||Array.isArray(value))throw new Error('儲存資料格式錯誤');
  const input=value as Record<string,unknown>;
  if(input.version!==0&&input.version!==1)throw new Error('不支援的儲存版本');
  const cards=parseCatalog(input.version===0?input.products:input.cards);
  if(typeof input.selectedId!=='string'||(cards.length===0?input.selectedId!=='':!cards.some(card=>card.id===input.selectedId))) {
    throw new Error('儲存的選取商品不存在');
  }
  // v0 is a documented demonstration migration, not a historical deployed format.
  const updatedAt=input.version===0?0:input.updatedAt;
  if(typeof updatedAt!=='number'||!Number.isSafeInteger(updatedAt)||updatedAt<0)throw new Error('儲存時間格式錯誤');
  return {version:1,cards,selectedId:input.selectedId,updatedAt};
}
