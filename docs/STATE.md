# 狀態與保存

唯一 canonical state 是 store snapshot：`{version:1,cards,selectedId,updatedAt}`。卡片只有render state，editor只有原始輸入與錯誤，沒有各自寫入localStorage。

有效input → parseCard → store.update → 同步列表／預覽 → localStorage。非法input不覆蓋上次合法資料，保留欄位與錯誤。切換商品遇到非法草稿可取消或明確捨棄；外部有效snapshot依已核准策略替換表單並提示同步。

key：`merchant-card-showroom:v1`。初始化只讀取，不覆蓋損壞或未來版本資料。v0 `{version:0,products,selectedId}` 僅為示範migration，讀入轉v1，下一次有效寫入保存v1。沒有宣稱存在真實歷史版本。

getState與subscribe payload皆複製；storage getter/read/write/quota錯誤會降級記憶體操作並顯示未儲存提示。reset只移除本專案key，其他應用資料保持。

storage事件忽略無關key；有效snapshot原子替換且不回寫；損壞snapshot保留現有資料。removeItem本key與clear事件回到初始mock。destroy清除事件訂閱。同步限同origin，同時多頁編輯採最後收到snapshot，不保證嚴格多寫入者收斂；無資料合併／鎖／後端交易。

重設按鈕是明確的使用者操作，直接重設所有商品。展示篩選與列表／單卡模式為暫時UI狀態，不持久化；商品與選取id會持久化。
