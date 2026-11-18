# Agent log

## 2026-11-18 / Phase 1

- 使用者指定題目B、Web Components、Shadow DOM、生命週期更新、momo截圖為欄位依據，GitHub origin為 weimowang/Frontend_Takehome_Eval。
- Planner：讀取原題與WORKFLOW，分析兩張截圖；建立 requirements / card analysis / spec / design / tasks / questions、tokens草案與8筆mock。
- QA subagent：依WORKFLOW獨立撰寫行為測試案例；未開始Dev、未修改測試。
- UI skill搜尋為綠色電商行銷建議，不符合截圖品牌與showroom用途，未採用配色／Hero。
- GitHub clone成功，遠端為空repository；尚無commit或push。
- PDF使用macOS PDFKit擷取全文，三頁皆讀取；本輪沒有修改PDF。
- Gate 1未核准；未執行實作／測試，不宣稱通過。
- 提出Q-001至Q-004供一次決策；未代填DECISIONS.md。

## Gate 1 人工核准 / 2026-11-18

使用者原文：Q-001 採用Ａ；Q-002 照樣顯示但劃線；Q-003 會提供本地svg 來產生範例；Q-004 採用A。依回覆更新 SPEC 與 QUESTIONS；DECISIONS.md 仍保留使用者自行維護。開始串行 T1/T2，QA 獨立擁有 tests。

## Phase 2 Step A / Gate 2 待審

- 首次 commit：248e18c，2026-11-18 15:55:59 +08:00；如實保留實作與人工等待時間。
- QA agent 獨立新增 tests/core.test.ts（40案例）與 tests/card.spec.ts（7案例），同步等價原價決議。成功圖片 fixture 在首次執行前補齊，避免缺檔競態；沒有因實作失敗調降預期。
- Dev 主 agent：schema-derived types、價格核心、catalog、registry、ranking renderer、momo-card lifecycle、mount API與Gate2預覽頁。
- build / 40 unit / 7 browser 全通過。桌面及375px截圖已檢視。沒有 code 重試失敗。
- env：沙箱禁止本機listen，工具核准後重跑成功；開發依賴稽核更新與剩餘限制記於QA_GATE2。
- 實際SVG待使用者提供；目前只交付缺圖狀態與第一卡版型。不展開Gate2後任務。

## 雙版型展示迭代 / 2026-11-18

- 使用者補充兩張截圖，要求設計假資料並顯示對應兩種版型，另明確要求「都不要先推github」。本輪僅本機改動／commit，禁止push。
- 此指令授權本輪先展開第二版型及mock展示；沒有將先前Gate2記為已通過，也未自行展開完整editor/store。
- Card agent只改flash-sale renderer/styles；Mock agent只改mock JSON與本地SVG；QA agent只新增雙版型tests。主agent整合頁面、樣式與registry。
- 改以5筆新截圖搶購商品（鮭魚、旅宿、傘、衛生紙、牛肉乾）＋3筆原ranking資料展示。
- SVG為原生向量示意圖；不是商品實拍或真實販售頁。mock圖片未包含真實影片來源，因此不偽造播放鈕。倒數、輪播不在目前契約範圍，沒有偽造即時活動時間。
- 雙版型驗證：40 unit＋11 browser＋build通過。真實SVG載入／1440與375截圖目視完成，無頁面溢出或pageerror。
- code歸責：修正HTML option標籤；修正HMR下內建registry重複初始化，各一次。Dev未修改tests。證據見QA_LAYOUTS。
