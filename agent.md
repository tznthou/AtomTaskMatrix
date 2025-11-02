# 🤖 Agent 指南 - Atomic Task Matrix

## 1. 使命與範圍
- 以「完成比完美重要」為核心,提供拖曳式艾森豪矩陣與 Gemini AI 拆解功能,協助單一使用者快速啟動任務並累積小勝利。
- 所有資料需即時同步至 Google Sheets(`Tasks` 與 `Analytics` 分頁),不使用 localStorage,確保資料一致與可追蹤。
- 前端採單一 `index.html` + Vanilla JS + Tailwind CDN 架構,API 金鑰以 `config.js` 外部檔案提供(不納版控)。

## 2. 核心功能清單
- 任務建立: 表單輸入後寫入 Google Sheets,預設狀態 `uncategorized`,並提供成功回饋。
- 拖曳分類: 任務於待分類區與四象限間拖放移動,狀態對應 `urgent_important` 等六種枚舉值。
- AI 拆解: 針對選定任務呼叫 Gemini,產出 3~5 個 2 分鐘內可完成的子任務,名稱需加上「🔗 來自[原任務]」前綴與 `parent_task_id`。
- 任務完成: 點擊「完成」更新狀態為 `completed`,紀錄 `completed_at`,畫面淡出並更新統計。
- 統計檢視: 顯示每週建立/完成數、完成率、平均存活天數,來源為 `Analytics` 分頁。
- 連線監控: 30 秒輪詢 Google Sheets,以 🟢/🟡/🔴 顯示狀態與最後同步時間。

## 3. 技術與資料重點
- Google Sheets `Tasks` 欄位: `id|title|status|parent_task_id|parent_task_title|created_at|updated_at|completed_at`。
- `Analytics` 欄位: `week_start|week_end|total_created|total_completed|completion_rate|avg_lifetime_days|updated_at`。
- API 要點: 先 `GET /values/Tasks!A:H` 取得行號,再以 `PUT` 更新; 新增使用 `append`; AI 採 `gemini-pro:generateContent` 並需處理非純 JSON 情況。
- 需建立 `TaskManager`, `SheetsClient`, `GeminiClient`, `DragDropHandler`, `StatisticsEngine`, `ConnectionMonitor` 等模組角色,並以 `AppState` 管理全域狀態。

## 4. 初始開發路線圖
1. 建立基礎 HTML 結構: 待分類區、四象限格網、統計面板、連線指示。
2. 實作 `config.js` 介面與 `AppState`、`Task` 類別。
3. 完成 `SheetsClient` 讀寫流程與錯誤處理,確保同步策略可運作。
4. 建立拖曳互動與狀態渲染,連動 Google Sheets 更新。
5. 整合 Gemini 拆解流程,完成子任務生成與 UI 顯示。
6. 實作統計計算與每週資料寫回 `Analytics`。

## 5. 體驗與錯誤處理準則
- 任務操作均需即時視覺反饋(拖曳高亮、成功提示、錯誤訊息)。
- 常見錯誤代碼: `NETWORK_ERROR`, `API_KEY_INVALID`, `SHEETS_READ_ERROR`, `GEMINI_QUOTA_EXCEEDED`, `PARSE_ERROR` 等,需對應提示並提供重試。
- 同步流程: 檢查連線 → 標記 `connecting` → 執行 API → 重新載入資料 → 更新 UI → 還原連線狀態; 失敗時保留本地狀態並顯示錯誤。

## 6. 測試與驗收清單
- 基礎操作: 新增/拖曳/重新分類/完成任務均應成功且寫入 Sheets。
- AI 拆解: 選定任務後能生成 3~5 個子任務,API 失敗時保留原任務並顯示「請稍後再試」。
- 連線指示: 啟動時顯示正確狀態,網路斷線能提示,恢復後自動更新。
- 統計面板: 完成任務後可重新計算當週數據,顯示完成率與平均存活天數。
- 錯誤模擬: 測試錯誤 API 金鑰、試算表 ID、Gemini 非 JSON 回應、網路斷線等情境。

## 7. 開發環境規範
- 本地預覽一律使用 VS Code Live Server 擴充套件開啟 `index.html`,禁止使用其他伺服器工具。
- 保持檔案 ASCII 編碼; 針對 API 金鑰設定請提供 `config.example.js`,實際 `config.js` 不納入版控。
- 若需額外文件或腳本,請先確認與現有規格一致並更新於本文件或對應說明檔。

