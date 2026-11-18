import {parseCard,parseCatalog,type Card} from '../schema/card';
import {decodeSnapshot,STORAGE_KEY,type Snapshot} from './persistence';

export type StoreSource='local'|'external'|'reset';
export interface StoreStatus {kind:'saved'|'memory'|'error';message:string}
export interface Store {
  getState():Snapshot;
  getStatus():StoreStatus;
  subscribe(fn:(state:Snapshot,source:StoreSource)=>void):()=>void;
  update(card:Card):void;
  select(id:string):void;
  reset():void;
  destroy():void;
}
export interface StoreOptions {storage?:Storage;eventTarget?:Window}

export function createStore(defaults:Card[],options:StoreOptions={}):Store {
  const initialCards=parseCatalog(defaults);
  const defaultSelection=initialCards.find(card=>card.id==='rank-bose')?.id??initialCards[0]?.id??'';
  const initial=():Snapshot=>({version:1,cards:structuredClone(initialCards),selectedId:defaultSelection,updatedAt:Date.now()});
  let state=initial();
  let status:StoreStatus={kind:'memory',message:'瀏覽器儲存不可用，目前僅保留於記憶體。'};
  let storage:Storage|undefined;
  const target=options.eventTarget??(typeof window!=='undefined'?window:undefined);
  try {
    storage=options.storage??(typeof window!=='undefined'?window.localStorage:undefined);
    if(storage) {
      const raw=storage.getItem(STORAGE_KEY);
      if(raw!==null)state=decodeSnapshot(raw);
      status={kind:'saved',message:raw===null?'使用預設商品，修改後將儲存於此瀏覽器。':'已還原此瀏覽器儲存的商品。'};
    }
  } catch(error) {
    status={kind:'error',message:`儲存資料錯誤，無法還原，使用預設商品；原資料未覆寫。${message(error)}`};
  }
  const listeners=new Set<(state:Snapshot,source:StoreSource)=>void>();
  let destroyed=false;
  function assertActive() {if(destroyed)throw new Error('Store 已銷毀');}
  function notify(source:StoreSource) {for(const listener of listeners)listener(structuredClone(state),source);}
  function persist() {
    if(!storage) {status={kind:'memory',message:'修改尚未儲存，目前僅保留於記憶體。'};return;}
    try {
      storage.setItem(STORAGE_KEY,JSON.stringify(state));
      status={kind:'saved',message:'已儲存於此瀏覽器。'};
    } catch(error) {
      status={kind:'error',message:`修改尚未儲存，記憶體中的操作仍可繼續。${message(error)}`};
    }
  }
  function onStorage(event:StorageEvent) {
    if(destroyed||(event.key!==STORAGE_KEY&&event.key!==null))return;
    if(event.storageArea!==null&&event.storageArea!==storage)return;
    if(event.newValue===null) {
      state=initial();
      status={kind:storage?'saved':'memory',message:'其他分頁已重設商品，已還原預設資料。'};
      notify('external');return;
    }
    try {
      const next=decodeSnapshot(event.newValue);
      state=next;
      status={kind:'saved',message:'已套用其他分頁的最新商品資料。'};
    } catch(error) {
      status={kind:'error',message:`忽略其他分頁的不合法資料，保留目前商品。${message(error)}`};
    }
    // Reading an external snapshot never writes it back, avoiding event loops.
    notify('external');
  }
  target?.addEventListener('storage',onStorage);
  return {
    getState(){return structuredClone(state);},
    getStatus(){return {...status};},
    subscribe(listener){assertActive();listeners.add(listener);return ()=>{listeners.delete(listener);};},
    update(input){
      assertActive();const card=parseCard(input);
      if(!state.cards.some(item=>item.id===card.id))throw new Error('欲更新的商品不存在');
      state={...state,cards:state.cards.map(item=>item.id===card.id?card:item),updatedAt:Date.now()};
      persist();notify('local');
    },
    select(id){
      assertActive();if(!state.cards.some(card=>card.id===id))throw new Error('選取的商品不存在');
      if(state.selectedId===id)return;
      state={...state,selectedId:id,updatedAt:Date.now()};persist();notify('local');
    },
    reset(){
      assertActive();state=initial();
      if(storage) {
        try {storage.removeItem(STORAGE_KEY);status={kind:'saved',message:'已重設為預設商品。'};}
        catch(error) {status={kind:'error',message:`畫面已重設，但瀏覽器儲存尚未清除。${message(error)}`};}
      } else status={kind:'memory',message:'已重設記憶體中的商品；瀏覽器儲存不可用。'};
      notify('reset');
    },
    destroy(){if(destroyed)return;destroyed=true;target?.removeEventListener('storage',onStorage);listeners.clear();},
  };
}
function message(error:unknown):string {return error instanceof Error?error.message:String(error);}
