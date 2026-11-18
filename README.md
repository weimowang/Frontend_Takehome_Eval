# Merchant Card Showroom

題目 B：以 TypeScript、原生 Web Components 與 Shadow DOM 建立框架無關的商品卡展示間。

已完成兩種商品卡、schema 驅動調整面板、localStorage 保存與同源跨分頁同步，以及兩個獨立 HTML 嵌入範例。Gate 1、Gate 2 已由使用者核准；功能與 QA 完成，等待 Gate 3 最終人工檢視。開發期間先保留本地 commit；使用者完成需求文件檢視後，已授權推送至指定 GitHub repository。

## 題目 B 需求對照

以下逐項對應題目的基本需求與 Bonus；實作範圍及限制一併列出。

| 評分項目 | 本專案實作 | 檢視／驗證入口 |
| --- | --- | --- |
| 基本需求：至少一個卡片 | 共兩種版型：直式 `flash-sale`、橫式 `ranking`，提供8筆本地mock與SVG。 | 首頁兩區塊；[資料](mock/cards.draft.json)、[卡片分析](docs/CARD_ANALYSIS.md) |
| 列出所有商品卡／展示單一商品卡 | 首頁列出全部商品，可依版型篩選；點選商品或使用選單切換預覽，「只看單卡」隱藏列表。 | 首頁列表與調整面板；[展示測試](tests/layouts.spec.ts) |
| 商品卡細節調整介面 — Browser-side Persistence | 表單由schema欄位描述產生；合法輸入即時更新列表與預覽並保存localStorage，重整還原商品及選取id。無效輸入不覆蓋合法資料；支援重設與儲存失敗提示。 | [Editor](src/showroom/editor.ts)、[Store](src/store/store.ts)、[編輯與保存測試](tests/editor.spec.ts) |
| sample HTML 使用商品卡 | 宣告式custom element與命令式mount兩頁均直接載入同一份建置後library，不依賴showroom或框架。 | [sample.html](sample.html)、[sample-mount.html](sample-mount.html)、[嵌入測試](tests/embed.spec.ts) |
| Bonus：Reusable Card Architecture | 原生Web Component搭配Shadow DOM，公開data property、attributes、事件與mount/update/destroy；共用價格／圖片／標題呈現；renderer不依賴編輯器或保存層。 | [元件入口](src/index.ts)、[共用呈現](src/components/shared.ts)、[導入範例](docs/INTEGRATION.md) |
| Bonus：Schema / Plugin Extensibility | 欄位描述推導TypeScript型別，同時驅動驗證與表單。registry註冊可信renderer並擴充合法variant；瀏覽器測試驗證第三種測試版型。 | [Schema](src/schema/card.ts)、[Registry](src/cards/registry.ts)、[擴充測試](tests/card.spec.ts) |
| Bonus：State Consistency Strategy | Store為唯一已接受資料來源，editor保留未通過驗證的草稿；保存與還原皆驗證snapshot。同源storage事件原子替換、不回寫，避免循環；版本化key、示範migration及錯誤降級。 | [一致性策略](docs/STATE.md)、[保存格式](src/store/persistence.ts)、[Store測試](tests/store.test.ts) |

### Bonus 的實際邊界

- **Reusable**：原生API與獨立HTML已測試；Vue／React提供導入文件，未執行框架runtime專屬測試。
- **Extensibility**：支援可信的renderer註冊，並非遠端plugin平台。新增欄位仍需維護對應的schema驗證；新增版型需同步擴充editor選單與測試，不能宣稱所有擴充都零修改。
- **Consistency**：採同源、最後接收snapshot策略；不提供跨origin同步、多人資料合併或同時多寫入者嚴格收斂。

## 快速啟動

需求：Node.js 20+、npm。瀏覽器測試使用本機 Google Chrome。

```sh
npm ci
npm run build
npm run dev
```

開啟 http://127.0.0.1:4173/。sample 使用 build 產物，因此先 build 再開啟：

- `/sample.html`：宣告式 `<momo-card>`，透過 catalog 注入資料。
- `/sample-mount.html`：命令式 mount / update / destroy。

```sh
npm test          # 60 個邏輯測試
npm run test:e2e  # 20 個真實瀏覽器測試；先 build
npm run preview  # 正式建置預覽 http://127.0.0.1:4176/
```

build 產生 `dist/momo-cards.es.js`、`dist/momo-cards.iife.js` 元件 library，以及可直接靜態託管的 `site/`（含展示間、samples、library與圖片）。以HTTP服務開啟，不能直接雙擊 file://；正式建置使用相對base，可部署在GitHub Pages的repository子路徑。

## 使用方式

1. 列表顯示5張限時搶購卡與3張今日暢銷卡，可篩選版型或切換只看單卡。
2. 點選商品，或在面板選單選取商品。
3. 調整商品名稱、版型、圖片與替代文字、售價、原價、活動文案、庫存、標籤或連結。
4. 合法輸入立即更新列表與預覽並保存；不合法輸入留在表單供修正，不污染保存資料。
5. 重新整理還原資料；另一個同源分頁會接收最新snapshot。重設只清除本專案資料。

原價存在就顯示劃線，包括等於售價；庫存0表示售完，停用搶購。缺少庫存則隱藏庫存列。沒有影片來源不顯示播放鈕。所有商品、價格與SVG都是本地mock，不代表即時販售資訊，操作不會建立訂單。

## 架構

```text
schema/         欄位描述、型別推導與資料驗證
core/           價格、catalog（不依賴showroom）
cards/          registry、ranking與flash-sale renderer
components/     Shadow DOM宿主、共用圖片／價格／標籤
showroom/       schema產生表單、原始輸入與錯誤
store/          canonical snapshot、localStorage、migration、storage事件
preview.ts      展示頁整合與狀態協調
sample*.html    僅依賴建置後library的獨立範例
```

卡片不讀localStorage；Editor不自己保存；Store是唯一資料來源。`data` property承載複雜資料；`product-id`/`variant` attributes提供宣告式接口。公開事件穿過Shadow DOM，宿主決定選取／購買／播放行為。核心元件沒有Vue或React runtime依賴。

## 驗證與文件

- [最終QA報告](docs/QA_FINAL.md)：60 unit、20 browser、正式build／保存／samples與畫面檢視。
- [Vue／React與HTML導入](docs/INTEGRATION.md)
- [狀態一致性與失敗處理](docs/STATE.md)
- [契約與API](docs/SPEC.md)
- [需求與取捨](docs/REQUIREMENTS.md)
- [momo截圖欄位分析](docs/CARD_ANALYSIS.md)
- [設計與tokens](docs/DESIGN.md)
- [任務與Gate](docs/TASKS.md)
- [測試案例](docs/TEST_CASES.md)
- [AI協作與人工決策紀錄](docs/AGENT_LOG.md)

Vue／React提供導入範例，未安裝其runtime做專屬整合測試；原生公開API已用Chrome驗證。

## Tradeoffs 與後續演進

- 原生Web Components降低框架耦合；SSR/client boundary與框架型別需由host處理。
- Shadow DOM隔離selector；CSS變數是刻意公開的主題通道，不聲稱阻擋所有繼承。
- localStorage同步小型snapshot，簡單且易驗證；高頻大量資料可改debounce/IndexedDB。跨頁最後接收策略不保證同時多寫入者嚴格收斂，正式多人編輯需後端版本控制。
- v0 migration是示範fixture，不宣稱真實歷史版本。未知版本保留原儲存並降級顯示預設資料。
- registry可擴充可信renderer；editor選單目前列出兩種內建variant，新增plugin需同步擴充選單與測試。
- 刻意不做真實API、結帳、倒數輪播、影片播放器、SSR/SEO、跨origin設定同步、像素級還原與完整RWD打磨。保留基本鍵盤操作、替代文字、focus與窄螢幕可用性。
- 開發依賴稽核仍有picomatch ReDoS與上游傳播告警，固定可信glob、不對外暴露dev server；詳見[早期稽核紀錄](docs/QA_GATE2.md)。沒有production runtime依賴，後續追蹤正式修補。

原題以first commit計時：2026-11-18 15:55:59 +08:00。實作、修正與人工等待如實保留，各階段有Co-authored commit。

## GitHub Pages 自動部署

網站：https://weimowang.github.io/Frontend_Takehome_Eval/

`.github/workflows/pages.yml` 在每次push到main時自動執行 npm ci、60個邏輯測試、正式build與Playwright瀏覽器測試，通過後發布site/至GitHub Pages。也可從Actions手動執行workflow_dispatch。其他分支不直接發布。

發布來源為GitHub Actions；工作使用contents:read，部署工作額外使用pages:write及id-token:write。沒有儲存個人token於repository。首頁與sample連結、SVG、CSS、JS皆可在repository子路徑載入。

Pages上的localStorage與localhost不同origin，不會帶入本機編輯資料；每位訪客資料仍只保存在自己的瀏覽器。
