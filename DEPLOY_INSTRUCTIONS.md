# 部署 backend.gs 到 Google Apps Script

## 關鍵信息
- 代碼位置：`/Users/tznthou/Documents/Practice/AtomTask/gas/backend.gs`
- 代碼行數：924 行
- **關鍵修復**：CORS headers（行 46-58, 701-712, 743-746）
- 部署後需要更新 `config.js` 的 API_BASE_URL

## 步驟 1：打開 Google Apps Script

選擇以下任一方式：

**方法 A（推薦）**：
1. 在瀏覽器訪問：https://script.google.com/
2. 找到你的專案名稱
3. 點擊打開

**方法 B**：
1. 打開你的 Google Sheets
2. 菜單：**擴充功能 → Apps Script**

## 步驟 2：清除舊代碼

1. 在編輯器中按 **Ctrl+A**（Windows）或 **Cmd+A**（Mac）選中所有代碼
2. 按 **Delete** 刪除

## 步驟 3：複製最新代碼

打開你的編輯器（VS Code、Sublime 等）：
```bash
# 在你的編輯器中打開此文件
/Users/tznthou/Documents/Practice/AtomTask/gas/backend.gs
```

選中全部代碼（Ctrl+A）並複製（Ctrl+C）

## 步驟 4：貼到 Google Apps Script

1. 回到 Google Apps Script 編輯器
2. 貼上代碼（Ctrl+V）

## 步驟 5：部署新版本

1. 點擊右上角藍色按鈕 **「部署」**
2. 選擇 **「新建部署」**
3. 選擇 **「Web App」**
4. 配置選項：
   - **執行身份**：選擇你的 Google 帳號
   - **存取權限**：選擇「任何人（包括匿名用戶）」
5. 點擊 **「部署」**

## 步驟 6：複製新的 URL

1. 複製新生成的 Web App URL
2. **重要**：每次部署都會生成新的 URL
3. 更新 `config.js` 中的 `API_BASE_URL`：

```javascript
window.CONFIG = {
    API_BASE_URL: "https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec",
    API_TOKEN: "a8a190b0fcba21c825e347db26f8fd234f398ffcff43248101ebdb360d301a9a"
};
```

## 步驟 7：推送到 Zeabur

```bash
cd /Users/tznthou/Documents/Practice/AtomTask
git add config.js
git commit -m "更新 GAS 部署 URL"
git push
```

Zeabur 會自動部署新版本。

## 驗證

部署後，訪問 https://task-matrix.zeabur.app/

應該看到：
- ✅ 狀態指示器從 🔴 變成 🟢
- ✅ 任務同步成功
- ✅ 可以新增、修改、刪除任務

如果還是 CORS 錯誤，說明部署沒有成功。檢查：
1. 新的 URL 是否正確複製
2. GAS 編輯器中是否真的替換了舊代碼
3. 瀏覽器是否清除了快取（Ctrl+Shift+Delete）
