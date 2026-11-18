import tokens from '../styles/tokens.css?inline';
import styles from '../styles/card.css?inline';
import flashStyles from '../styles/flash-sale.css?inline';
import {parseCard,type Card} from '../schema/card';
import {getProduct,subscribeCatalog} from '../core/catalog';
import {getVariant} from '../cards/registry';
import {node} from './shared';
export class MomoCard extends HTMLElement {
  static observedAttributes=['product-id','variant'];
  #data:Card|null=null;
  #error:string|null=null;
  #unsubscribe?:()=>void;
  #queued=false;
  #content:HTMLDivElement;
  constructor() {
    super();const root=this.attachShadow({mode:'open'});const css=node('style');css.textContent=tokens+styles+flashStyles;this.#content=node('div');root.append(css,this.#content);
  }
  connectedCallback() {
    // Upgrade properties assigned before the element definition was loaded.
    if(Object.prototype.hasOwnProperty.call(this,'data')) {const value=this.data;delete (this as {data?:Card|null}).data;this.data=value;}
    this.#unsubscribe?.();this.#unsubscribe=subscribeCatalog(()=>this.#schedule());this.#schedule();
  }
  disconnectedCallback() {this.#unsubscribe?.();this.#unsubscribe=undefined;}
  attributeChangedCallback() {this.#schedule();}
  get data():Card|null {return this.#data?structuredClone(this.#data):null;}
  set data(input:Card|null) {
    try {this.#data=input===null?null:parseCard(input);this.#error=null;}
    catch(error) {this.#data=null;this.#error=(error as Error).message;}
    this.#schedule();
  }
  #schedule() {if(this.#queued)return;this.#queued=true;queueMicrotask(()=>{this.#queued=false;if(this.isConnected)this.#render();});}
  #render() {
    try {
      if(this.#error)throw new Error(this.#error);
      const card=this.#data??getProduct(this.getAttribute('product-id')??'');
      if(!card) {this.#state('尚未選擇商品或找不到商品');return;}
      const id=this.getAttribute('variant')??card.variant??'ranking';
      const variant=getVariant(id);if(!variant)throw new Error(`版型尚未提供：${id}`);
      const active=this.shadowRoot?.activeElement;const wasTitle=active?.closest('h2');
      this.#content.replaceChildren(variant.render({...card,variant:id}));
      if(wasTitle)this.#content.querySelector<HTMLElement>('h2 button,h2 a')?.focus();
    } catch(error) {this.#state(`無法顯示商品：${(error as Error).message}`,true);}
  }
  #state(message:string,error=false) {const state=node('p','state',message);state.setAttribute('role',error?'alert':'status');this.#content.replaceChildren(state);}
}
