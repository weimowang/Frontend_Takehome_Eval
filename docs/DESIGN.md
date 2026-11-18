# Design draft

以截圖為優先，不採用技能搜尋返回的綠色電商配色或行銷頁 Hero。搜尋建議僅採「卡片明確層級、可見焦點、圖片預留空間」。

tokens.css 是顏色、字級、間距與卡片尺寸唯一來源；元件不寫 raw hex 或 magic px。tokens 同時注入 shadow root，不能只在 document :root 宣告而期待 selector 穿透。

ranking：左圖右文、售價桃紅、原價灰；flash-sale：上圖下文、紅色售價、庫存膠囊與紅 CTA。商品圖 object-fit:contain、固定比例；名稱兩行、活動文字一行，完整名稱保留於可存取名稱。

Showroom 使用中性背景、主內容卡片區加右側編輯欄；窄視窗改上下排列。以系統繁中文字型，不依賴外部字型下載。44px 操作區、清晰 focus ring、欄位 label/error、價格不只靠顏色區分。編輯器不在每次輸入時 aria-live 播報整張卡。

圖片來源與等價原價顯示規則列於 QUESTIONS。Gate 1 已核准由使用者提供本地 SVG；mock 的 image.src 保留本地路徑，缺檔顯示 fallback，不能當作已完成素材。
