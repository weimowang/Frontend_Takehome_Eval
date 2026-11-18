import './styles/tokens.css';
import './styles/preview.css';
import './styles/editor.css';
import {configureCatalog,parseCard,type MomoCard} from './index';
import {createStore} from './store/store';
import type {Snapshot} from './store/persistence';
import {createEditor} from './showroom/editor';
import raw from '../mock/cards.draft.json';

const store=createStore(raw.map(parseCard));
const preview=document.querySelector<MomoCard>('#preview')!;
const select=document.querySelector<HTMLSelectElement>('#product')!;
const feedback=document.querySelector<HTMLElement>('#feedback')!;
const saveState=document.querySelector<HTMLElement>('#save-state')!;
const filter=document.querySelector<HTMLSelectElement>('#filter')!;
const toggle=document.querySelector<HTMLButtonElement>('#view-toggle')!;
const editorHost=document.querySelector<HTMLElement>('#editor')!;
let editor:ReturnType<typeof createEditor>|undefined;
let selectedId='';
let single=false;
const cardElements=new Map<string,HTMLElement>();

function updateVisibility() {
  document.querySelector<HTMLElement>('#flash-section')!.hidden=single||filter.value==='ranking';
  document.querySelector<HTMLElement>('#ranking-section')!.hidden=single||filter.value==='flash-sale';
  toggle.textContent=single?'返回商品列表':'只看單卡';toggle.setAttribute('aria-pressed',String(single));
}
function render(state:Snapshot,source:'local'|'external'|'reset'='local') {
  configureCatalog(state.cards);
  const ids=new Set(state.cards.map(card=>card.id));
  for(const [id,el] of cardElements)if(!ids.has(id)){el.remove();cardElements.delete(id);}
  select.replaceChildren();
  for(const card of state.cards) {
    const option=document.createElement('option');option.value=card.id;option.textContent=card.title;select.append(option);
    let element=cardElements.get(card.id);
    if(!element){element=document.createElement('momo-card');element.setAttribute('product-id',card.id);cardElements.set(card.id,element);}
    const grid=document.querySelector(card.variant==='flash-sale'?'#flash-grid':'#ranking-grid')!;
    if(element.parentNode!==grid)grid.append(element);
  }
  const status=store.getStatus();saveState.textContent=status.message;saveState.dataset.state=status.kind;
  const card=state.cards.find(item=>item.id===state.selectedId);
  select.value=state.selectedId;
  preview.data=null;preview.setAttribute('product-id',state.selectedId);preview.removeAttribute('variant');
  document.querySelector<HTMLElement>('#empty-state')!.hidden=state.cards.length>0;
  if(card) {
    if(!editor)editor=createEditor(editorHost,card,next=>{store.update(next);});
    else if(selectedId!==state.selectedId||source==='reset'||(source==='external'&&status.kind!=='error'))editor.setCard(card);
  } else {editor?.destroy();editor=undefined;editorHost.textContent='尚無可編輯商品。';}
  selectedId=state.selectedId;
  if(source==='external')feedback.textContent=status.kind==='error'?status.message:'已同步其他分頁；調整面板已更新為最新資料。';
  if(source==='reset')feedback.textContent='已重設商品資料與調整面板。';
  updateVisibility();
}
function selectProduct(id:string) {
  if(!store.getState().cards.some(card=>card.id===id))return;
  if(id!==selectedId&&editor?.hasInvalidDraft()&&!window.confirm('目前有無效的輸入。要捨棄草稿並切換商品嗎？')){select.value=selectedId;return;}
  store.select(id);feedback.textContent='已選取商品，可在面板中調整。';
}
select.addEventListener('change',()=>selectProduct(select.value));
filter.addEventListener('change',updateVisibility);
toggle.addEventListener('click',()=>{single=!single;updateVisibility();if(single)document.querySelector('#inspector')!.scrollIntoView({block:'start'});});
document.querySelector('#reset')!.addEventListener('click',()=>store.reset());
function onAction(event:Event) {
  const detail=(event as CustomEvent<{id:string;action:string}>).detail;
  if(detail.action==='select')selectProduct(detail.id);
  else feedback.textContent=`示範互動：${detail.id}（${detail.action}），不會建立訂單或進行交易。`;
}
document.addEventListener('momo-card-action',onAction);
const unsubscribe=store.subscribe(render);render(store.getState());
if(import.meta.hot)import.meta.hot.dispose(()=>{unsubscribe();store.destroy();editor?.destroy();document.removeEventListener('momo-card-action',onAction);});
