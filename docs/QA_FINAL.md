# QA 最終驗證紀錄

狀態：自動化驗證與正式產物 smoke test 已通過；**Gate 3 尚未取得人工核准**。以下執行結果由主整合 agent 回報，QA 彙整紀錄；未為符合實作而降低既有測試預期。

## 最終結果

| 驗證 | 結果 | 範圍 |
| --- | --- | --- |
| `npm run build` | 成功 | library 與 site 產物 |
| Vitest | **60 / 60 通過** | schema、pricing、snapshot、migration、store 與事件一致性 |
| Playwright／Chrome | **20 / 20 通過** | 卡片、兩種版型、編輯、儲存、同步、嵌入與公開 API |
| 正式 site smoke（port 4176） | 通過，無 pageerror | 編輯後 reload、reset；兩個 sample；命令式 update／destroy |
| 真實 SVG 畫面檢視 | 通過 | 桌面 1440px、手機 375px，無水平溢出 |

## 證據與涵蓋範圍

- `core.test.ts`：v1 schema、價格與庫存邊界、安全 URL、選填資料、原價存在即劃線與折扣公式。
- `card.spec.ts`：ranking、data／attribute 優先序、registry、生命週期、單次事件、CSS 隔離、XSS、mount 清理與鍵盤操作。
- `layouts.spec.ts`：5 張搶購卡與 3 張暢銷卡、價格／庫存、demo 購買回饋、售完停用、缺少影片、等價原價劃線。
- `store.test.ts`：v1 解析、v0 示範 migration、不合法 snapshot、clone、合法更新、損壞／禁止存取／quota 降級、reset 隔離；external 合法／非法／無關 key／remove／clear 不回寫，以及 destroy 清理 listener。
- `editor.spec.ts`：合法即時更新與重整、無效值不寫入、同源分頁同步、reset、損壞資料降級；原價清空不轉成 0、variant 移動列表與保存、無效草稿切商品的取消／明確捨棄。
- `embed.spec.ts`：宣告式與命令式獨立 HTML，載入實際 build library，update／destroy。

正式畫面證據：

- [桌面編輯器](screenshots/final-editor-desktop.png)
- [手機編輯器](screenshots/final-editor-mobile.png)
- [宣告式 sample](screenshots/final-sample.png)
- [命令式 sample](screenshots/final-sample-mount.png)

## 修正與歸責紀錄

1. **Build 設定／code**：sample 初期使用 top-level await，將 build target 設為 ES2022 後成功建置。此相容性基線須由交付文件說明。
2. **Embed 載入／code**：初輪 browser 為 15/17 通過，兩個 embed 案例因 Vite 將 module 載入改寫為 `?import`，等待直接 library 請求時逾時。sample 改用 classic script 中的 async import，維持直接載入 dist 產物；未改 QA 預期，重跑及新增案例後 20/20 通過。
3. **Smoke 工具腳本／test**：手動 smoke 曾用 host `innerText` 讀取 Shadow DOM 內容而無法取得文字，改用 accessible locator 後通過。此為工具腳本讀取方式修正，非產品 bug。

其餘測試無失敗。最終驗證已涵蓋修正後產物，沒有新變更或未解疑慮，不重複執行相同測試。

## 證明範圍與限制

- Library 公開 API 已在真實 Chrome 驗證。
- React／Vue 導入目前提供文件，**未執行 React／Vue runtime 整合測試**，不能將原生 API 通過推論為所有框架版本已驗證。
- 自動化 SVG fixture 用於隔離資產載入競態；另以真實 SVG 完成上述桌面／手機畫面檢視。這些檢視不代替使用者的 Gate 3 驗收。
- 跨分頁測試驗證最後接收 snapshot 行為，不宣稱並行多寫入者的嚴格收斂。
- v0 migration 為文件定義的示範格式，並非真實歷史上線資料。
- 使用者禁止 push；本階段未 push。
