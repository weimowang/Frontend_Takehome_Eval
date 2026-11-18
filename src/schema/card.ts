export const fields = {
  schemaVersion: { kind: 'version', required: true },
  id: { kind: 'text', required: true, max: 100 },
  variant: { kind: 'variant', required: false },
  title: { kind: 'text', required: true, max: 200 },
  image: { kind: 'image', required: true },
  price: { kind: 'money', required: true },
  originalPrice: { kind: 'money', required: false },
  tagline: { kind: 'text', required: false, max: 120 },
  stock: { kind: 'integer', required: false },
  badges: { kind: 'badges', required: false },
  productUrl: { kind: 'url', required: false },
  videoUrl: { kind: 'url', required: false },
} as const;
type KindMap = {version:1; text:string; variant:string; image:{src:string;alt:string};money:number;integer:number;badges:{kind:'preorder'|'promotion';label:string}[];url:string};
type Fields = typeof fields;
type RequiredKeys = {[K in keyof Fields]:Fields[K]['required'] extends true ? K : never}[keyof Fields];
type OptionalKeys = Exclude<keyof Fields,RequiredKeys>;
export type Card = {[K in RequiredKeys]:KindMap[Fields[K]['kind']]} & {[K in OptionalKeys]?:KindMap[Fields[K]['kind']]};
const variants = new Set(['ranking','flash-sale']);
export function allowVariant(id:string) { variants.add(id); }
function record(value:unknown):value is Record<string,unknown> {return typeof value==='object' && value!==null && !Array.isArray(value);}
function textValue(value:unknown,name:string,max:number):string {
  if(typeof value!=='string'||!value.trim()||value.trim().length>max) throw new Error(`${name}：請輸入 1–${max} 個字元`);
  return value.trim();
}
export function safeUrl(value:unknown,name='URL'):string {
  const raw=textValue(value,name,2048);
  if(/[\u0000-\u0020\u007f]/.test(raw)) throw new Error(`${name}：網址不可含空白或控制字元`);
  const url=new URL(raw,'https://local.example/');
  if(!['http:','https:'].includes(url.protocol)) throw new Error(`${name}：僅支援 HTTP(S) 或相對網址`);
  return raw;
}
export function parseCard(input:unknown):Card {
  if(!record(input)) throw new Error('商品資料必須是物件');
  const out:Record<string,unknown>={};
  for(const [name,definition] of Object.entries(fields)) {
    let value=input[name];
    if(value===undefined || (typeof value==='string'&&!value.trim())) {
      if(definition.required) throw new Error(`${name}：必要欄位`);
      if(name==='variant')out[name]='ranking';
      if(name==='badges')out[name]=[];
      continue;
    }
    switch(definition.kind) {
      case 'version': if(value!==1)throw new Error('schemaVersion：不支援的版本');out[name]=1;break;
      case 'text':out[name]=textValue(value,name,'max' in definition ? definition.max : 200);break;
      case 'variant':if(typeof value!=='string'||!variants.has(value))throw new Error('variant：未知版型');out[name]=value;break;
      case 'integer':case 'money':
        if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)throw new Error(`${name}：必須是非負安全整數`);
        out[name]=value;break;
      case 'url':out[name]=safeUrl(value,name);break;
      case 'image':
        if(!record(value))throw new Error('image：必要圖片資料');
        out[name]={src:safeUrl(value.src,'image.src'),alt:textValue(value.alt,'image.alt',200)};break;
      case 'badges':
        if(!Array.isArray(value)||value.length>3)throw new Error('badges：最多三個');
        out[name]=value.map(b=>{if(!record(b)||!['preorder','promotion'].includes(String(b.kind)))throw new Error('badges：未知標籤');return {kind:b.kind,label:textValue(b.label,'badge.label',20)};});break;
    }
  }
  return out as Card;
}
export function parseCatalog(input:unknown):Card[] {
  if(!Array.isArray(input))throw new Error('catalog：必須為陣列');
  const cards=input.map(parseCard);
  if(new Set(cards.map(c=>c.id)).size!==cards.length)throw new Error('catalog：商品 id 重複');
  return cards;
}
