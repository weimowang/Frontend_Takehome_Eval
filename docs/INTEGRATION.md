# 商品卡導入

本元件僅在瀏覽器註冊，不包含 SSR adapter。先 `npm run build`，將 `dist/momo-cards.es.js`（或IIFE版）與圖片放在可由HTTP服務的目錄。不要直接 file:// 開啟 ES module sample。

## 獨立 HTML

- `sample.html`：以 `<momo-card product-id="...">` 宣告，`configureCatalog(cards)` 注入資料。
- `sample-mount.html`：`mount(container,{data})`，handle 提供 update 完整替換資料、destroy 清理元件。
- 兩頁皆直接載入同一份 `dist/momo-cards.es.js`，不載入展示間或 persistence。
- IIFE build 可用 `<script src="./dist/momo-cards.iife.js"></script>` 後取得 `window.MomoCards`。

```js
const { mount } = await import('./dist/momo-cards.es.js');
const card = {
  schemaVersion: 1, id: 'headphones', variant: 'ranking',
  title: '示範耳機', image: { src: './assets/rank-bose.svg', alt: '耳機示意圖' },
  price: 9500, originalPrice: 9500
};
const handle = mount(document.querySelector('#container'), { data: card });
handle.update({ ...card, price: 8900 });
handle.destroy(); // 可重複呼叫；之後 update 會丟出已銷毀錯誤
```

## React（JavaScript，瀏覽器端）

使用原生 ref/property 與 addEventListener，避免依賴不同 React 版本對 custom element props/event 的處理差異。以下為導入範例；本專案未安裝 React runtime，沒有宣稱跑過 React 專屬測試。

```jsx
import { useEffect, useRef } from 'react';
import './vendor/momo-cards.es.js';

export function ProductCard({ product, onAction }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.data = product; }, [product]);
  useEffect(() => {
    const element = ref.current;
    const listener = event => onAction?.(event.detail);
    element.addEventListener('momo-card-action', listener);
    return () => element.removeEventListener('momo-card-action', listener);
  }, [onAction]);
  return <momo-card ref={ref} />;
}
```

TypeScript host 需依所用 React 型別版本擴充 JSX.IntrinsicElements 的 `momo-card` 宣告，ref型別可使用 `HTMLElement & {data: Card | null}`。SSR app 應在 client boundary 載入元件。

## Vue 3（Vite）

在 Vue plugin 的 compilerOptions 中將元素識別為原生 custom element：

```js
vue({ template: { compilerOptions: {
  isCustomElement: tag => tag === 'momo-card'
} } })
```

```vue
<script setup>
import './vendor/momo-cards.es.js';
defineProps({ product: Object });
const emit = defineEmits(['action']);
</script>
<template>
  <momo-card :data.prop="product"
    @momo-card-action="emit('action', $event.detail)" />
</template>
```

`.prop` 明確設定資料property；複雜物件不放attribute。本專案未安裝Vue runtime，此為導入文件，原生公開API已由真實瀏覽器測試。

## 屬性、事件與隔離

`data` 優先於 `product-id`，設 `null` 後恢復catalog查詢；`variant` attribute覆蓋資料variant，移除後回復。未知商品／版型呈現可理解錯誤，不沿用前一商品。

`momo-card-action` 使用 bubbles/composed，detail為 `{id, action: 'select' | 'purchase' | 'play'}`。元件不會建立訂單；宿主決定後續行為。有productUrl時標題是原生連結。videoUrl存在才有播放事件按鈕，宿主負責播放器。

Shadow DOM隔離selector，字型與顏色有明確預設；`--momo-*` CSS custom properties是公開主題通道。例如 `momo-card { --momo-color-price: #b51c60; }`。不接受任意HTML字串；資料文字使用textContent，網址只允許HTTP(S)/相對URL。

## 擴充版型

```js
registerVariant({ id: 'compact', label: '精簡卡', render(card) {
  const article = document.createElement('article');
  article.textContent = `${card.title} — $${card.price}`;
  return article;
} });
```

重複id拒絕；註冊同時擴充runtime schema允許的variant。Plugin為可信程式碼，需自行負責其DOM與事件安全。現有editor預設提供兩種內建版型；新plugin需擴充編輯選單與對應設計／測試，不載入遠端程式碼。
