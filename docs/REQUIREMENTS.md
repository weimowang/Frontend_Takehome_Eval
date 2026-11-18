# 需求與來源

狀態：Draft / Gate 1 未核准。

## 來源優先序

使用者明確選 B、Web Components、Shadow DOM、生命週期更新、依提供 momo 截圖建立 mock，並指定 GitHub repository。PDF 是題目規格來源；WORKFLOW 是使用者要求採用的協作流程。截圖僅為視覺與欄位證據，不推論真實 API、商品真偽或即時庫存。

| 需求 | 交付與驗收 |
| --- | --- |
| 列出所有商品卡 | 展示資料集全部卡片，可依 variant 篩選 |
| 展示單一卡片 | 列表選取後進入單卡預覽，編輯選中 id |
| 細節調整 | schema 產生欄位，合法變更立即預覽，錯誤不覆蓋有效值 |
| Browser persistence | 重整還原、重設、同源跨分頁同步、儲存失敗提示 |
| sample HTML | 宣告式與 mount 兩個獨立頁面 |
| 可重用 | 元件不依賴 showroom / store，可用 property 傳入資料 |
| 可擴充 | registry 提供新 variant，schema 驗證與 renderer 對應 |
| 維護交付 | README、取捨、測試、Git history、Co-authored 紀錄 |

## 非需求

不是建立完整 momo 網站；不需要路由系統、登入、購物車、付款或真實 API。截圖輪播箭頭／圓點屬外層容器，不是商品 schema。

## 使用者技術方向補充

Shadow DOM 能隔離內外 selector，但 CSS custom properties 與繼承字型仍可能穿透；需明確設定 host 的字型、色彩與 box-sizing。connectedCallback 處理掛載，attributeChangedCallback 只接收 observedAttributes 變動；property setter 另處理複雜資料。disconnectedCallback 清理訂閱，重新掛載必須可運作。
