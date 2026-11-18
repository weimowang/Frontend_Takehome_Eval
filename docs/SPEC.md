# Contract v1（Gate 1 已核准）

## 技術選擇提案

TypeScript strict、原生 Web Components、Vite、Vitest、Playwright。使用輕量欄位描述 schema，從欄位描述推導資料型別與表單；不引入框架 runtime。自訂 registry 為靜態可信程式碼擴充，非任意遠端 plugin 載入。

## Card schema

| 欄位 | 型別／預設 | 規則 |
| --- | --- | --- |
| schemaVersion | literal 1 | snapshot 另有 storage version |
| id | string，必要 | 非空，資料集內唯一，編輯面板不可修改 |
| variant | ranking / flash-sale | 預設 ranking；未知值回報驗證錯誤 |
| title | string，必要 | trim 後非空，純文字，上限 200 字元 |
| image | {src:string, alt:string} | 必要；缺圖／載入失敗顯示替代圖與 alt |
| price | number，必要 | 有限、非負整數；TWD，不接受 NaN / Infinity |
| originalPrice | number? | 有限非負整數；存在即顯示劃線價，包含等於／小於售價；不暗示有折扣 |
| tagline | string? | 最多120字元；缺少時不留空活動列 |
| stock | number? | 非負整數；缺少隱藏庫存；0顯示已售完並停用搶購 |
| badges | {kind:'preorder'|'promotion',label:string}[] | 預設[]，最多3個；label最多20字元 |
| productUrl | string? | 可選；HTTP(S)／相對URL；禁止 script/data URL |
| videoUrl | string? | 可選，同安全URL規則；觸發事件，不內建播放器 |

空白 optional 字串正規化為 undefined；數字 0 與缺值不同。輸入解析不隱式把空字串轉 0。無原價不產生折扣；有有效原價時核心可算節省百分比，但卡片不額外新增截圖沒有的折扣 badge。

## API 與優先序

- 註冊 `<momo-card>`；重複載入透過 customElements.get 防止重複 define。
- `element.data = card`：傳完整資料，驗證後複製保存，不修改呼叫端物件。
- observed attributes：`product-id`（從注入 catalog 讀取）、`variant`（版型 override）。
- `configureCatalog(cards)`：sample / showroom 啟動時注入 mock；元件本身不抓遠端 API。
- property data 優先於 catalog；清除 data 後回到 product-id；variant attribute 優先於資料 variant，移除後回復資料值。
- unknown product-id / invalid data 顯示可理解的空／錯誤狀態，不能保留上一商品造成誤認。
- `mount(container, {data, variant?}) -> {element, update(next), destroy()}`；update 使用完整 card 替換，destroy 清理元件；不刪除 container 其他內容。
- `momo-card-action`：CustomEvent，bubbles:true、composed:true，detail `{id,action:'select'|'purchase'|'play'}`。
- 無 productUrl 的選取由事件交給 host；有合法 productUrl 可用真實 anchor。CTA 不與整卡 anchor 巢狀。
- React 以 ref 設定 data 與 addEventListener，Vue 以 isCustomElement 設定與 data property 綁定。範例列出相容限制，不宣稱所有舊版框架自動支援。

## 元件與狀態歸屬

showroom controller → list / single preview + schema editor → momo-card → 共用 price / badge rendering helpers。

卡片只擁有已驗證 render state，不直接碰 localStorage。Editor 擁有暫時輸入與錯誤；store 擁有 canonical cards 與 selectedId；有效更新走 store → 預覽與列表 → persistence。無效輸入保留表單提示，不污染 store。render 應避免在每次輸入時重建 editor 而失去焦點。

## 生命周期與隔離

constructor attachShadow(open)，初始化一次；connectedCallback 可重入；attributeChangedCallback 驗證並排程 render；data setter 同一路徑。disconnectedCallback 移除外部訂閱；重連恢復，不能重複 listener。純文本使用 textContent，不用未信任 HTML 拼接。Shadow root 內使用 tokens，host 設定明確字型／顏色／line-height；公開 --momo-* custom properties 為刻意的主題通道。

## Registry

`registerVariant({id,label,render})`，重複 id 拒絕。共同 Card schema 與價格／標籤 helpers 不隨 variant 分叉；新增 variant 須同時提供可驗證 variant 定義與 renderer。第一版僅內建兩種，驗證測試用第三個簡單 renderer 證明 registry 可擴充。

## Persistence

key `merchant-card-showroom:v1`；payload `{version:1,cards,selectedId,updatedAt}`。首次無資料用 mock。讀取 JSON 與 schema 驗證；不合法／未來版本回退 mock 並顯示提示，不默默覆寫原資料。舊版 migration 以明確 fixture 測試（v0 為 `{version:0,products,selectedId}`，products 依目前 card 欄位）。沒有真實舊版上線，文件須標示示範 migration。

有效修改同步更新 UI，再捕捉 localStorage 寫入錯誤。失敗顯示未儲存狀態，仍可操作。storage event 只處理同 key；驗證後原子更新，無回寫迴圈；同源跨頁採最後接收 snapshot，可能覆蓋未儲存輸入，收到外部更新時顯示通知並重置編輯草稿。clear/remove 事件還原初始狀態。跨 origin 不同步。重設僅操作本專案 key。

## 展示

列表所有卡、variant 篩選、單卡預覽／返回列表、選取 id、即時編輯與重設。預覽元件與 sample 共用同一 build 產物，sample 不載入 showroom。loading／empty／error 為明確可見狀態，不用假延遲模擬服務。

## Gate 1 補充提案（QA 審閱後）

- `destroy()` 冪等，重複呼叫不報錯；destroy 後 update 回傳明確已銷毀錯誤。
- 金額限整數；節省百分比 `Math.round((originalPrice-price)/originalPrice*100)`，只有原價大於售價且大於0才可計算；第一版不渲染百分比標籤。
- 表單合法 input 即時提交；切換商品遇到無效草稿時先要求使用者修正或明確捨棄，不能默默丟失。
- schema version 是持久化資料版本；variant registry 的新 id 必須納入 runtime 驗證集合，不用寫死二元 union 阻擋新增 renderer。
- storage 最後接收策略不保證真正同時寫入的多頁嚴格收斂；不宣稱分散式一致性。QA S07 驗證依接收事件的行為，嚴格多寫入者收斂屬後續演進。
