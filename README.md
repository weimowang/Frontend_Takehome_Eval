# Merchant Card Showroom

題目 B：TypeScript + 原生 Web Components，使用 Shadow DOM 與同一份 schema 展示兩種商品卡。

目前完成 5 張直式限時搶購卡、3 張橫式暢銷卡、8 張本地 SVG 示意圖，以及單卡選取、版型切換與售價預覽。等待本輪畫面檢視後，再完成完整 editor、persistence 與嵌入範例。

依使用者要求，所有 commit 僅在本機，尚未 push GitHub。

## 執行

Node.js 20+、npm；瀏覽器測試使用本機 Google Chrome。

```sh
npm ci
npm run dev
npm test
npm run test:e2e
npm run build
```

本機預覽：http://127.0.0.1:4173/。

build 產生 `dist/momo-cards.es.js` 與 `dist/momo-cards.iife.js` 元件 library。展示網站與獨立 sample 的打包在下一階段整合。

## 資料與使用

`mock/cards.draft.json` 為展示資料；`public/assets/` 為本地原生 SVG，可替換正式提供的素材。圖片與價格皆為 mock，不代表即時販售資訊。原價存在即顯示劃線，包括原價等於售價。

元件支援 data property、product-id 與 variant attributes；configureCatalog 注入資料，mount 提供 update / destroy，registry 支援可信的自訂 renderer。卡片不依賴 showroom 或 localStorage。複雜資料走 property，不序列化整包 JSON attribute。詳細契約見 SPEC。

目前編輯只更新單卡預覽，重新整理會還原；完整 schema editor、browser persistence、sample HTML 與 Vue/React 範例尚待實作。

## 驗證與文件

- [最新雙版型 QA](docs/QA_LAYOUTS.md)：40 個邏輯測試、11 個瀏覽器測試及 build 通過。
- [桌面截圖](docs/screenshots/layouts-desktop.png)
- [手機截圖](docs/screenshots/layouts-mobile.png)
- [契約與API](docs/SPEC.md)
- [需求對照](docs/REQUIREMENTS.md)
- [卡片分析](docs/CARD_ANALYSIS.md)
- [設計規範](docs/DESIGN.md)
- [任務依賴](docs/TASKS.md)
- [測試案例](docs/TEST_CASES.md)
- [協作紀錄](docs/AGENT_LOG.md)
- [第一輪 QA 與依賴稽核限制](docs/QA_GATE2.md)

## 取捨

Shadow DOM 隔離 selector，CSS custom properties 為公開主題通道。原生元件避免框架 runtime，schema 推導型別並共用驗證規則。Vite 負責開發與 library build。

本輪不做倒數、輪播、真實播放器與訂單。後續刻意不做真實 API、SSR/SEO、跨 origin 同步、像素級還原。基本鍵盤操作、替代文字、窄螢幕可用性保留。localStorage 計畫採小型同源 snapshot，不能保證多寫入者嚴格一致；後續可演進 IndexedDB 或後端同步。

原題以 first commit 起計；首個 commit 為 2026-11-18 15:55:59 +08:00，實作與人工等待時間均如實保留。
