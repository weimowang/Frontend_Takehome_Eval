# 雙版型展示驗證

2026-11-18，本機迭代，未push。

- TypeScript + Vite build：通過。
- Vitest：40 / 40。
- Playwright：11 / 11，涵蓋原有7項與新增雙版型、庫存、購買事件及無影片案例。
- 真實8張本地SVG完成 decode；兩個viewport皆9張元件（8張展示＋1張單卡預覽），沒有pageerror。
- 桌面1440與手機375的document.scrollWidth均等於viewport，無頁面橫向溢出。
- 目視檢視上下版型、紅色／桃紅價格、劃線原價、庫存與CTA；桌面五張直式卡、三張橫式卡；手機垂直排列。

## 畫面證據

- [桌面](screenshots/layouts-desktop.png)
- [手機](screenshots/layouts-mobile.png)

## 修正歸責

1. code：預覽HTML option結束標籤誤植導致Vite 500；修正標籤。library build不含HTML，故由瀏覽器驗證抓到。
2. code：HMR帶時間戳模組與直接import共用registry，內建variant被重複註冊。內建初始化改為先查存在；外部重複register仍保持拒絕契約。修正一次後11項browser全通過，未更動測試預期。

## 邊界

本輪沒有提供倒數計時、輪播、真實影片或訂單；卡片互動只發事件並顯示示範提示。編輯只更新單卡預覽，不保存。SVG為本地向量示意，不宣稱實拍還原。人工Gate尚待本輪畫面確認。
