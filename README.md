# 📋 Atomic Task Matrix

> 結合艾森豪矩陣與原子習慣的任務管理系統,透過 AI 智能拆解讓任務從「想」到「做」零阻力。

---

## 🧭 專案簡介

Atomic Task Matrix 是一個輕量級的任務管理工具,核心理念是「完成比完美重要」。透過艾森豪矩陣的四象限分類,搭配 Gemini AI 的原子習慣拆解能力,將「我要開始運動」這樣的大目標拆解成「穿上襪子」這樣的微小行動,徹底消除拖延的起始阻力。所有資料即時同步至 Google Sheets,確保資料安全且便於後續分析。

---

## 🚀 核心特色

- ✅ **四象限拖曳分類** - 直覺的拖放介面,快速區分任務優先級
- 🤖 **AI 智能拆解** - 運用 Gemini API 將大任務拆解成可立即執行的微行動
- ☁️ **Google Sheets 即時同步** - 所有操作即時儲存,連線狀態清楚呈現
- 📊 **完成率追蹤** - 每週統計平均任務存活時間,了解執行效率
- 🎯 **待分類緩衝區** - 新任務先進入緩衝區,思考後再分類
- 🔗 **任務關聯追蹤** - 拆解後的子任務與原任務保持清晰關聯

---

## 🏗️ 系統架構

```mermaid
flowchart TB
    User[使用者] --> UI[前端 HTML/JS]
    UI --> LocalState[瀏覽器狀態管理]
    LocalState --> SheetsAPI[Google Sheets API]
    SheetsAPI --> Tasks[Tasks 分頁]
    SheetsAPI --> Analytics[Analytics 分頁]
    
    UI --> GeminiAPI[Gemini AI API]
    GeminiAPI --> TaskBreakdown[任務拆解引擎]
    TaskBreakdown --> UI
    
    Tasks --> TaskSync[即時同步]
    TaskSync --> LocalState
    
    subgraph Google Sheets Backend
        Tasks
        Analytics
    end
    
    subgraph AI Analysis
        GeminiAPI
        TaskBreakdown
    end
```

**架構說明:**
- **前端層**: 模組化 JavaScript 架構（12 個模組，5 層架構），使用 Tailwind 4.0 CDN 處理樣式
- **狀態管理**: 即時操作直接同步到 Google Sheets,不使用 localStorage 避免資料不一致
- **資料層**: Google Sheets 作為雲端資料庫,分為 Tasks(任務資料) 和 Analytics(統計資料) 兩個分頁
- **AI 層**: Gemini API (`gemini-2.0-flash`) 負責任務拆解,按需觸發不佔用不必要額度

---

## 🧰 技術棧

| 類別 | 技術 | 版本/說明 |
|------|------|-----------|
| 前端框架 | Vanilla JavaScript | ES6+ 語法,無框架依賴 |
| 樣式系統 | Tailwind CSS | 4.0 via CDN |
| 拖曳功能 | HTML5 Drag & Drop API | 原生支援,無需第三方套件 |
| 雲端儲存 | Google Sheets API | v4 - RESTful API |
| AI 分析 | Google Gemini API | gemini-2.0-flash 模型 |
| 部署方式 | 靜態網頁託管 | Zeabur / Netlify / Vercel |
| 開發工具 | Live Server | VS Code 擴充套件即可 |

---

## ⚙️ 專案結構

```bash
atomic-task-matrix/
├─ index.html              # 主 HTML 檔案
├─ config.js               # API 設定檔(需自行建立,已加入 .gitignore)
├─ tailwind-config.js      # Tailwind CSS 配置（Memphis 設計系統）
├─ core/                   # Layer 1-2: 基礎與配置
│  ├─ constants.js         # 狀態標籤與顏色定義
│  ├─ icons.js             # Heroicons SVG 圖標庫
│  ├─ config.js            # API 配置管理
│  └─ state.js             # 全域狀態與 DOM 引用
├─ models/                 # Layer 1: 資料模型
│  └─ Task.js              # 任務資料模型類別
├─ services/               # Layer 3: 服務層
│  └─ BackendGateway.js    # Google Apps Script API 通訊
├─ handlers/               # Layer 4: 互動處理
│  └─ DragDropHandler.js   # 拖放功能處理
├─ managers/               # Layer 4: 業務邏輯
│  └─ TaskManager.js       # 任務管理核心邏輯
├─ monitors/               # Layer 4: 監控
│  └─ ConnectionMonitor.js # 連線狀態監控
├─ ui/                     # Layer 4: UI 元件
│  ├─ Renderer.js          # UI 渲染與更新
│  ├─ ConfirmDialog.js     # 確認對話框元件
│  └─ FeedbackToast.js     # Toast 通知元件
├─ app/                    # Layer 5: 應用啟動
│  ├─ events.js            # 事件綁定
│  └─ bootstrap.js         # 應用初始化
└─ gas/                    # Google Apps Script 後端
   └─ backend.gs           # GAS Web App 後端程式碼
```

**架構設計原則:**
- **模組化架構**: 12 個模組分為 5 層,單向依賴流,無循環依賴
- **配置分離**: API 設定獨立於 `config.js`,避免版本控制洩漏
- **無建構流程**: 直接載入 script,不需要打包工具
- **清晰職責**: 每個模組有明確的單一職責

---

## 🧑‍💻 安裝與使用

### 前置需求

1. Google Cloud Platform 專案
2. 啟用以下 API:
   - Google Sheets API
   - Google Gemini API (AI Studio)
3. 建立 API 金鑰並設定權限

### 快速開始

```bash
# 1️⃣ 複製專案
git clone https://github.com/yourusername/atomic-task-matrix.git
cd atomic-task-matrix

# 2️⃣ 設定 API 金鑰
cp config.example.js config.js
# 編輯 config.js 填入你的 API 金鑰

# 3️⃣ 建立 Google Sheets
# 複製範本試算表: [連結將在 SPEC.md 提供]
# 取得試算表 ID 並填入 config.js

# 4️⃣ 啟動開發伺服器
# 使用 VS Code Live Server 或任何靜態伺服器
# 直接開啟 index.html 也可運作
```

### 後端 Web App (Google Apps Script)

- **程式碼位置**: `gas/backend.gs`
- **試算表 ID**: `YOUR_SPREADSHEET_ID`
- **已部署 Web App URL**:
  `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`
- **Gemini AI 啟用**: 於 Apps Script「專案設定 → 指令碼屬性」新增 `GEMINI_API_KEY`
- **部署設定**: 執行身份「我自己」、存取權「任何人(含匿名)」
- **模型版本**: `gemini-2.0-flash` (穩定推薦版本)
- **⚠️ 重要**: 每次重新部署都會產生新的 URL,記得同步更新 `config.js`

### config.js 範例

```javascript
window.CONFIG = {
  API_BASE_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
};
```

**安全說明**: API_TOKEN 已從客戶端移除,後端使用 CSRF Token 機制提供防護。

---

## 🎯 使用流程

### 基本操作流程

1. **新增任務** → 任務出現在「待分類區」
2. **拖曳分類** → 將任務拖到四象限之一(重要緊急/重要不緊急/不重要緊急/不重要不緊急)
3. **選擇任務** → 點擊任務卡片顯示詳細資訊
4. **AI 拆解(可選)** → 點擊「🤖 AI 拆解」按鈕,Gemini 分析並生成子任務
5. **執行任務** → 從最小的子任務開始執行
6. **標記完成** → 點擊完成按鈕,任務從畫面消失但記錄在 Google Sheets
7. **查看統計** → 每週自動計算平均任務存活時間

### 連線狀態說明

系統右上角會顯示即時連線狀態:
- 🟢 **已連線 Google Sheets** | 最後同步: X 分鐘前
- 🟡 **連線中...** (正在同步資料)
- 🔴 **連線失敗** (請檢查網路或 API 金鑰設定)

**重要**: 本系統不使用本地儲存,所有操作必須在連線狀態下進行。

---

## 🔐 安全性考量

### 資安修復狀態 (最後更新: 2025-11-03)

| 編號 | 嚴重程度 | 問題描述 | 狀態 | 修復日期 |
|------|----------|----------|------|----------|
| H-01 | HIGH | DOM-based XSS 漏洞 | ✅ 已修復 | 2025-11-02 |
| M-01 | MEDIUM | 客戶端 API Token 暴露 | ✅ 已修復 | 2025-11-03 |
| M-02 | MEDIUM | Tailwind CDN 無 SRI 保護 | ⏳ 待處理 | - |
| L-01 | LOW | ALLOWED_ORIGIN 配置清理 | ✅ 已修復 | 2025-11-03 |

### 已實施的安全措施

**XSS 防護 (H-01)**:
- ✅ 所有使用者輸入使用 `createElement()` + `textContent` 安全渲染
- ✅ 僅內部受控函式（如 IconLibrary）使用 `innerHTML`
- ✅ 已實施 Content Security Policy (CSP)

**CSRF 防護 (M-01)**:
- ✅ 移除客戶端 API_TOKEN（無實際防護效果）
- ✅ 後端使用 Server-generated CSRF Token 機制
- ✅ 所有 POST/PUT/DELETE 請求包含 CSRF Token
- ✅ Token 單次使用,防止重放攻擊

**CORS 配置 (L-01)**:
- ✅ 移除誤導性 ALLOWED_ORIGIN 配置
- ✅ GAS Web App 預設允許所有來源（無法自訂）
- ✅ 透過 CSRF Token 機制提供跨站請求防護

**待處理項目 (M-02)**:
- ⏳ Tailwind CSS 自託管（工時: 4-6 小時）
- ⏳ 實施 Subresource Integrity (SRI) 保護

### API 金鑰保護

- ❌ **不要將 config.js 加入版本控制**
- ✅ 使用 `.gitignore` 排除 `config.js`
- ✅ GAS Web App URL 本身不構成安全風險（公開存取設計）
- ⚠️ Gemini API Key 僅存於 GAS Script Properties,不暴露於前端

### Google Sheets 權限設定

- 試算表設定為「知道連結的人可以編輯」
- GAS 以部署者身份執行,控制資料存取權限
- 透過 CSRF Token 防止未授權的跨站請求

---

## 📦 部署

### 生產環境 (Current)

**平台**: Zeabur
**網址**: https://task-matrix.zeabur.app/
**前端**: 靜態檔案直接部署
**後端**: Google Apps Script Web App
**最後更新**: 2025-11-03

### 靜態網頁託管 (推薦)

**Zeabur / Netlify / Vercel:**
- 直接連接 GitHub Repository
- 部署時手動建立 `config.js` 並填入 GAS Web App URL
- 自動化部署
- ⚠️ **注意**: 不要推送 `config.js` 到 Git

**GitHub Pages:**
```bash
# 推送到 GitHub 後在設定中啟用 Pages
# ⚠️ 注意: 不要推送 config.js,部署時需手動設定
```

### 本地開發

**必須使用 VS Code Live Server 擴充套件**:
```bash
# 1. 安裝 VS Code Live Server 擴充
# 2. 右鍵 index.html → "Open with Live Server"
# 3. 瀏覽器自動開啟 http://127.0.0.1:5500/
```

**⚠️ 不要使用其他伺服器工具** (如 `python -m http.server` 或 `npm serve`),可能導致模組載入問題。

**環境檢查清單**:
- ✅ `config.js` 已正確設定
- ✅ 使用 VS Code Live Server
- ✅ 瀏覽器允許跨域請求 (GAS API CORS 已設定)

---

## 🧪 測試

由於是單一使用者工具,測試策略著重於:

### 手動測試檢查清單

- [ ] 四象限拖曳功能正常
- [ ] 待分類區可接收新任務
- [ ] 任務可從象限拖回待分類區
- [ ] AI 拆解按鈕觸發正確
- [ ] 拆解後的子任務顯示原任務關聯
- [ ] 完成任務後從畫面消失
- [ ] Google Sheets 資料正確同步
- [ ] 連線狀態燈號即時更新
- [ ] 每週統計數據計算正確

### 錯誤處理測試

- [ ] 網路斷線時的錯誤提示
- [ ] API 金鑰無效時的錯誤訊息
- [ ] Gemini API 額度用完時的提示
- [ ] 試算表不存在時的錯誤處理

---

## 🧩 相關文件

| 文件 | 說明 |
|------|------|
| [README.md](./README.md) | 專案總覽與技術架構 (本檔) |
| [PRD.md](./PRD.md) | 產品需求文件 - 使用者故事與驗收標準 |
| [SPEC.md](./SPEC.md) | 系統規格文件 - API 設計與資料結構 |

---

## 📈 未來擴充方向

雖然目前僅供個人使用,但架構已保留擴充性:

- 🔐 **多使用者支援** - 加入身份驗證機制
- 📱 **行動版優化** - 響應式設計與 PWA
- 🔔 **提醒通知** - 緊急任務到期提醒
- 📊 **進階統計** - 各象限任務分布熱力圖
- 🎨 **主題客製** - 深色模式與個人化配色
- 🗂️ **任務標籤** - 更細緻的任務分類

---

## 📜 授權

MIT License © 2025 子超

---

## 🤝 開發指南

### Commit 規範

採用 Conventional Commits:
- `feat:` 新增功能
- `fix:` 修復錯誤
- `docs:` 文件更新
- `style:` 程式碼格式調整
- `refactor:` 重構
- `test:` 測試相關

### 程式碼風格

- 使用 ES6+ 語法
- 函式命名使用 camelCase
- 常數使用 UPPER_SNAKE_CASE
- 適當的註解說明複雜邏輯

---

## 🆘 常見問題

**Q: 為什麼不使用 localStorage?**  
A: 為確保資料一致性與安全性,所有資料即時同步到 Google Sheets,避免本地與雲端資料不同步的問題。

**Q: Gemini API 免費額度夠用嗎?**  
A: 個人使用通常足夠,因為拆解功能是按需觸發,不是每個任務都會使用。

**Q: 可以離線使用嗎?**  
A: 目前不支援離線模式,未來可考慮加入 Service Worker 與本地快取。

**Q: 如何備份資料?**  
A: 所有資料在 Google Sheets 中,可直接下載試算表或設定自動備份。
