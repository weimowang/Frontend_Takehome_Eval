# Task DAG

所有實作等待 Gate 1；各階段完成記錄實際測試與 commit，不宣稱預期結果已通過。

| ID | 任務／輸入 → 輸出 | 依賴 | 平行 | 驗收 |
| --- | --- | --- | --- | --- |
| P1 | PDF、截圖 → requirements/analysis/spec/design | 無 | 否 | Gate 1 可審閱 |
| Q1 | 規格草案 → QA案例 | P1 | QA獨立 | 行為案例無結構綁定 |
| H1 | 人工決策 → 契約核准 | P1,Q1 | 否 | QUESTIONS 清空待決 |
| T1 | 契約 → schema/types/core/tokens | H1 | 否 | QA邏輯測試通過 |
| T2 | 契約 → 共用helpers、ranking卡 | T1 | 否 | lifecycle、資料更新、隔離測試 |
| H2 | 第一張卡截圖 → 人工確認 | T2 | 否 | Gate 2 核准 |
| T3 | registry → flash-sale renderer | H2 | 是 | 第二版型與擴充案例 |
| T4 | schema → editor/showroom | H2 | 是 | 列表/單卡/有效輸入更新 |
| T5 | schema → store/persistence | H2 | 是 | reload/migrate/storage/error |
| T6 | component → sample html/mount/framework docs | H2 | 是 | 獨立HTML使用同build |
| Q2 | 全部 → Vitest/Playwright/截圖 | T3-T6 | 否 | 兩層驗證、失敗歸責 |
| H3 | README/QA結果 → 人工交付確認 | Q2 | 否 | Gate 3 |

QA 擁有 tests/；Dev 不修改測試。Card 擁有 src/cards/；Editor 擁有 src/showroom/；Store 擁有 src/store/；Embed 擁有 examples/。共用入口整合由主 agent 串行處理，避免多人改同檔。最多三個子 agent 同時工作；第四個任務在空出 slot 後派發。

時間預算建議：契約與ranking 30分、Gate 2及平行實作45分、整合驗證30分、README/取捨15分。等待人工Gate也會影響實際first commit計時，記錄真實時間。

## 最終執行狀態

Gate 1與Gate 2已核准。T1-T6、Q2實作與驗證已完成；QA_FINAL記載實際60 unit/20 browser與正式產物檢視。H3 Gate 3待人工檢視README、畫面與取捨。使用者要求先不push，GitHub上傳不在本輪執行範圍。
