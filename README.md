# Merchant Card Showroom

題目 B，以 TypeScript + 原生 Web Components 建立框架無關的商品卡展示間。

目前狀態：Gate 1 已核准，進入串行契約層與第一張 ranking 卡實作；Gate 2 前不展開後續平行功能。

## 審閱入口

- [Gate 1 與待決問題](docs/QUESTIONS.md)
- [需求對照](docs/REQUIREMENTS.md)
- [截圖分析](docs/CARD_ANALYSIS.md)
- [Schema 與 API](docs/SPEC.md)
- [設計規範](docs/DESIGN.md)
- [任務依賴](docs/TASKS.md)
- [測試案例](docs/TEST_CASES.md)
- [協作紀錄](docs/AGENT_LOG.md)

## 預定交付

卡片列表／單卡模式、schema 驅動編輯面板、localStorage、ranking 與 flash-sale 兩種卡、獨立 sample.html 與 sample-mount.html、React/Vue 導入文件、Vitest 邏輯測試與 Playwright 畫面驗收。

## 架構取捨

原生 custom element 避免綁定框架；Shadow DOM 隔離 selector，公開 CSS custom properties 作為主題接口。複雜資料走 property，不把整包 JSON 放進 HTML attribute。Vite 負責開發與 ESM/IIFE library build，不引入應用框架。Schema 作為驗證與表單描述的單一來源，TypeScript 型別由 schema 推導，避免雙份規則漂移。

localStorage 適合小型同源展示，不能提供交易或跨裝置同步。採整份 snapshot 的最後接收寫入策略，不做多使用者合併。

## 刻意不做／後續演進

真實 momo API、結帳、SSR/SEO、跨 origin 設定同步、完整輪播與影片播放器、像素級還原與完整 RWD 打磨。基本鍵盤操作、圖片替代文字與窄螢幕可用性仍保留。後續可增加 IndexedDB／後端同步、元件版本相容策略、視覺回歸與框架整合 CI。

## 開發時程

原題以 first commit 起計約 120 分鐘。規劃階段與實作階段的 commit 邊界待 Gate 1 人工決定；不會回填或偽造時間。
