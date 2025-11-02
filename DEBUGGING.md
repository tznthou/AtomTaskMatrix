# 連線問題診斷指南

## 現有狀況分析

根據前面的調試，發現了以下情況：

### ✅ 正常工作的部分
1. **前端 Memphis 設計** - 已正確應用到 Zeabur 部署
2. **backend.gs API** - 直接調用成功，返回 `success:true`
3. **CORS 標頭** - 已正確配置
4. **config.js** - API_BASE_URL 和 token 已正確部署

### ❌ 問題部分
- **連線指示器** 🔴 顯示"尚未連線"
- 根本原因：**TaskManager.initialize() 失敗，阻止了 ConnectionMonitor 啟動**

## 改進措施（已實施）

### 1. 修復 TaskManager.initialize()
```javascript
// 舊代碼：如果 reloadTasks() 失敗，ConnectionMonitor 永遠不啟動
async initialize() {
    await this.reloadTasks(true);  // ❌ 失敗會拋出異常
    if (Config.hasApi()) {
        ConnectionMonitor.start();  // ❌ 永遠執行不到
    }
}

// 新代碼：捕捉異常，無論如何都啟動 ConnectionMonitor
async initialize() {
    try {
        await this.reloadTasks(true);
    } catch (error) {
        console.error("初始同步失敗，但將啟動連線監控以進行恢復:", error);
    }
    if (Config.hasApi()) {
        ConnectionMonitor.start();  // ✅ 無論初始化是否成功都會執行
    }
}
```

**效果**：即使初始同步失敗，ConnectionMonitor 仍會每 30 秒檢查一次連線。如果後端恢復，會自動重新同步。

### 2. 增強錯誤診斷
BackendGateway 現在會輸出詳細的錯誤信息到瀏覽器控制台：
- 網路錯誤（CORS、無法連接）
- API 錯誤（HTTP 狀態碼、回應內容）

## 診斷步驟

### 方法 1：檢查瀏覽器控制台（快速診斷）

1. 打開 https://task-matrix.zeabur.app/
2. 按 F12 打開開發者工具，切換到 Console 標籤
3. 查看是否有 `[BackendGateway]` 開頭的錯誤信息
4. 記錄錯誤訊息（例如：`Network error calling /tasks: ...`）

**常見錯誤信息及含義**：
- `Network error calling /tasks: Failed to fetch` → **CORS 或網路連接問題**
- `Network error calling /tasks: TypeError: Failed to fetch` → **同上**
- `GET /health failed with status 403` → **API token 驗證失敗**
- `GET /health failed with status 404` → **API 端點不存在（應該不會發生）**

### 方法 2：使用測試頁面診斷

1. 部署 test-fetch.html 文件到 Zeabur
2. 打開 https://task-matrix.zeabur.app/test-fetch.html
3. 查看頁面上顯示的詳細診斷信息
   - Response Status（HTTP 狀態碼）
   - Response Headers（CORS headers）
   - Response Body（API 回應內容）

### 方法 3：Network 標籤診斷

1. 打開開發者工具，切換到 Network 標籤
2. 刷新頁面
3. 查找 `exec` 相關的請求（GAS API 調用）
4. 點擊請求，檢查：
   - **Status Code** - 應該是 200
   - **Response Headers** 下的 `access-control-allow-origin` - 應該是 `*`
   - **Preview** - API 回應內容（應該是 JSON）

## 可能的原因及解決方案

### 原因 1：CORS 被瀏覽器阻止
**症狀**：錯誤訊息為 `Failed to fetch` 或 `CORS error`

**診斷**：
- Network 標籤中看不到任何 exec 請求
- 或者請求被標記為紅色，Status 為 0

**解決方案**：
1. 檢查 GAS 是否已啟用 CORS（應該已啟用，但可能需要重新部署）
2. 檢查 CSP 策略是否允許 script.google.com（已在 index.html 第 13 行配置）

### 原因 2：GAS API 無法存取

**症狀**：錯誤訊息為 `Network error calling /tasks: ...`，且 Network 標籤中請求超時或無響應

**診斷**：
- 嘗試直接訪問 GAS 端點：
  ```
  https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?path=health&token=YOUR_API_TOKEN
  ```
- 應該返回 JSON 內容

**解決方案**：
1. 確保 GAS Web App 已部署為"已發布"版本
2. 確認 API token 正確（在 config.js 中）
3. 檢查 GAS 的執行日誌是否有錯誤

### 原因 3：API Token 驗證失敗

**症狀**：HTTP 狀態碼為 403 或 401

**診斷**：
- Network 標籤中請求狀態為 403/401
- Response Body 為 `{"success":false,"message":"Missing or invalid API token"}`

**解決方案**：
1. 重新生成 GAS API token（需要修改 backend.gs 中的 token）
2. 更新 config.js 中的 API_TOKEN

## 預期改善

部署這些改變後，即使初始同步失敗，應用應該會：

1. **顯示離線狀態**（而不是卡死）
2. **啟動 ConnectionMonitor**，每 30 秒檢查一次
3. **當後端恢復時自動重新同步**
4. **在瀏覽器控制台輸出清晰的錯誤信息**

## 後續步驟

1. 推送改變到 Zeabur：`git push`
2. 等待 Zeabur 自動重新部署
3. 打開 https://task-matrix.zeabur.app/
4. 按 F12 查看 Console 中的診斷信息
5. 將錯誤訊息分享出來，以便進行更詳細的調試
