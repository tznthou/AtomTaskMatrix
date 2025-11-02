# Atomic Task Matrix · UI/UX 設計文件 (V4 Hybrid Design)

> **效能模式**: `balanced` (Lighthouse Performance ≥ 75 · LCP < 3s · FID < 150ms · CLS < 0.15 · INP < 300ms)
> **設計調性**: Hybrid Design · Memphis 彩色 + Neumorphism 質感 · 無漸層、柔和陰影
> **設計 ID**: #2025-ATM-HYBRID · 生成日期: 2025-11-02

---

## 1. 設計願景

### 背景與動機
產品定位: 以艾森豪矩陣為核心的任務管理器，結合 Gemini AI 拆解，協助單一使用者把想法轉成行動。

**V4 Hybrid 設計**: 「活力 × 舒適」— 結合 Memphis 與 Neumorphism 的優點
- ❌ **V3 不足**: 有機現代主義過於中性，缺乏視覺活力
- ❌ **Memphis 不足**: 過於跳躍，不適合長期使用
- ❌ **Neumorphism 不足**: 過於低調，缺乏品牌衝擊力
- ✅ **混合方案**: Memphis 的彩色活力 (粉紅、綠、橙、藍) + Neumorphism 的柔和陰影
- 🎨 **靈感**: 充滿生命力的色彩 + 溫暖舒適的質感 + 現代極簡的結構

### 關鍵價值
- *視覺活力*: Memphis 四色方案充滿生命力，避免單調感
- *舒適質感*: Neumorphism 柔和陰影讓介面溫暖親切，適合長期使用
- *品牌辨識度*: 獨特的色彩組合，一眼即可識別
- *高效能*: 無漸層、柔和陰影，CSS 體積小，Lighthouse > 75
- *易於維護*: 集中式配色管理，HTML 結構完全保持

---

## 2. 視覺語言（Memphis 彩色 + Neumorphism 質感）

### 色彩系統（四色活力方案）

#### 主要色彩
- **主色** `#FF6B9D` (粉紅) — Memphis 活力、友善、易親近
- **強調色** `#FFA502` (橙色) — Memphis 行動、熱情、吸引力
- **成功色** `#26DE81` (綠色) — Memphis 積極、成長、完成
- **輔色** `#00D2FC` (藍色) — Memphis 平衡、信任、專業

#### 中性色系
- 背景基底 `#F5F5F5` (柔和灰白 - Neumorphism)
- 卡片 `#FFFFFF` (純白)
- 邊框 `#EEEEEE` (極淺灰)
- 文字 `#2D2D2D` (深灰)
- 輔助文字 `#757575` (中灰)

#### 功能色系（四象限專用 - Memphis 彩色方案）
| 象限 | 背景 | 主色 | 深色 | 用途 |
|------|------|------|------|------|
| Q1 (重要且緊急) | `#FFF5F8` | `#FF6B9D` | `#E64D8A` | 立即處理 |
| Q2 (重要不緊急) | `#F5FFF8` | `#26DE81` | `#1A9E5A` | 穩定推進 |
| Q3 (緊急不重要) | `#FFFAF0` | `#FFA502` | `#E67E00` | 適度關注 |
| Q4 (不緊急不重要) | `#F5FBFF` | `#00D2FC` | `#0084B3` | 低優先級 |

- **成功** `#26DE81` (Memphis 綠) / **警示** `#FFA502` (Memphis 橙) / **錯誤** `#FF6B6B` (Memphis 紅)
- **陰影**: Neumorphism 柔和陰影 (8px 8px 16px + -8px -8px 16px 雙層柔和)

### 設計原則
✅ **正確做法**
- 使用純色，避免漸層（無漸層方案）
- 利用透明度變化創造層次：`border-rose-200/50` = 50% 透明邊框
- 限制色彩數量 (3-4 個主要顏色)
- 相同功能使用一致色彩

❌ **禁止做法**
- ❌ 使用漸層效果 (linear-gradient)
- ❌ 過多顏色混合 (超過 5 個主色)
- ❌ 低對比度的淺色文字
- ❌ 不一致的色彩應用

- **字體**
  - 標題: Tailwind `font-sans` (Inter 系列)
  - 內文: Inter
  - 無需額外 clamp，使用響應式 Tailwind 尺寸
- **圖形語彙**
  - 圓潤邊角 (border-radius 保持有機感)
  - 極淺陰影 (1-2px 深度)
  - 無漸層、無 glassmorphism (backdrop-filter 有性能問題)
  - Icon 採內嵌 SVG Heroicons

---

## 3. 版面配置

### 結構保持原有設計（無 HTML 改動）
- **頂部狀態列**: 置頂顯示燈號、狀態文字、最後同步時間
  - 🟢 連線中: `text-brand-success` (森林綠)
  - 🟡 同步中: `text-amber-500` (中性橙)
  - 🔴 未連線: `text-brand-danger` (深紅)

- **主標頭**
  - 左: Logotype (⚛️) + 標語「完成比完美重要」
  - 右: 全域搜尋(⌘K) + 偏好設定/亮暗切換

- **Command Bar**
  - 單列輸入框 (支援 `/ai`, `/due`, `/tag`)
  - 表單下方顯示系統回饋文字 (成功/錯誤)

- **內容雙欄** (無改動)
  - 左側 65%: 待分類 + 2x2 象限網格
  - 右側 35%: 本週進度環 (完成率/平均存活/拆解採納)

- **底部資訊**: 簡短版權說明

### 四象限樣式更新（無 HTML 改動）
- 卡片背景: 四象限專用淺色背景 (無漸層)
- 文字顏色: 對應象限的主色或深色
- 邊框: 虛線邊框，顏色與象限對應
- 徽章: 白色背景 + 象限主色文字

---

## 4. 互動重點（Balanced 模式）

### 動畫預算
- **同時動畫數**: 最多 5 個
- **動畫時長**: 200-300ms
- **安全屬性**: 只用 `transform` 和 `opacity`
- **禁止**: `width`, `height`, `background-color` 等昂貴屬性

### 互動回饋
- **拖曳**
  - 卡片拖曳: `opacity: 0.5` + 極淺陰影
  - 目標象限: `border-current` 高亮 + 極淺底色
  - 鍵盤: `Shift + 箭頭` 切換象限 (無動畫，直接移動)

- **任務卡**
  - 標題 + 狀態指示 + 時間資訊
  - 按鈕: 「AI 拆解」「完成」「刪除」 (無 Focus Drawer)
  - Hover: 邊框顏色變淡、陰影增加

- **進度環**
  - SVG 圓環，中心顯示完成率
  - 環色: 改用森林綠 `#059669`
  - 背景環: 淡灰色

### 響應式動畫
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. 無障礙與偏好設定
- **色彩對比**: ≥ 4.5:1 (WCAG AA 級別)
- **全區鍵盤操作**
  - `Tab`: 導覽
  - `Enter`: 確認
  - `Shift + ↑/↓/←/→`: 在象限間移動任務
- **prefers-reduced-motion**: 禁用所有動畫
- **prefers-color-scheme**: 支援深色模式 (未來擴充)

---

## 6. 實作指引

### Tailwind 配置
已在 `tailwind-config.js` 中實現，無需修改 HTML：
- 覆蓋預設色彩 (rose, emerald, amber, slate) 為新的四象限色彩
- 擴展色彩系統 (base, brand, q1-q4)
- 優化陰影 (極淺: 0 1px 3px, 輕微: 0 4px 6px)

### 關鍵配置
```javascript
// tailwind-config.js
colors: {
  // 四象限色彩映射（自動應用，無需修改 HTML）
  rose: { 50: '#FEE2E2', 600: '#DC2626', ... },  // Q1 紅色
  emerald: { 50: '#D1FAE5', 600: '#059669', ... },  // Q2 綠色
  amber: { 50: '#FEF3C7', 600: '#D97706', ... },  // Q3 橙色
  slate: { 50: '#F3F4F6', 600: '#4B5563', ... }   // Q4 灰色
}
```

### 元件與 ID 保持不變
- `task-form`, `uncategorized-dropzone`
- `quadrant-q1~q4`, `status-*`, `badge-*`
- 所有 HTML 元素 ID 與原有設計相同，**無需修改 HTML 結構**

### 進度環顏色更新
- 環色: `stroke: #059669` (森林綠，取代原藍色)
- 背景環: `stroke: rgba(148,163,184,0.3)` (保持淡灰)

---

## 7. 效能指標與測試

### Lighthouse 目標（Balanced 模式）
- **Performance**: ≥ 75
- **LCP** (最大內容繪製): < 3s
- **FID** (首次輸入延遲): < 150ms
- **CLS** (累積版面位移): < 0.15
- **INP** (互動響應): < 300ms

### 測試清單
- [ ] 頁面載入後燈號 2 秒內更新
- [ ] 新增/拖曳/完成任務流程流暢
- [ ] 四象限顏色清晰可區分
- [ ] 文字對比度 ≥ 4.5:1
- [ ] Lighthouse Performance ≥ 75
- [ ] prefers-reduced-motion 下無動畫

---

## 8. 版本變更歷史

| 版本 | 日期 | 設計主題 | 效能模式 | 說明 |
|------|------|---------|---------|------|
| V4 | 2025-11-02 | Hybrid (Memphis + Neumorphism) | Balanced | 活力四色 + 柔和陰影，最終版 |
| V3 | 2025-11-02 | 有機現代主義 | Balanced | 三色和諧搭配，第一次嘗試 |
| V2 | 2025-01-30 | Brightstream | Eco | 藍色系，狀態列移至頂部 |
| V1 | - | 原始設計 | - | 初始版本 |

### V4 Hybrid 改進重點
✅ **活力視覺**: Memphis 的四色彩色方案充滿生命力
✅ **舒適質感**: Neumorphism 的柔和雙層陰影讓介面溫暖親切
✅ **品牌衝擊力**: 獨特的色彩組合一眼可識別
✅ **長期可用性**: 比 Memphis 低調，比 Neumorphism 活力，是最佳平衡點
✅ **高效能**: 無漸層、純色 + 柔和陰影，CSS 體積極小

---

## 9. 相關資源

| 文件 | 說明 |
|------|------|
| [tailwind-config.js](./tailwind-config.js) | 色彩配置實現 |
| [index.html](./index.html) | HTML 結構（無改動） |
| [CLAUDE.md](./CLAUDE.md) | 開發指南 |
| [ux-ux-genis.md](./ux-ux-genis.md) | UI/UX 設計系統參考 |

---

## 10. 設計哲學

> 「設計應該既充滿生命力，又溫暖舒適。讓用戶在每次使用中都感受到專注與喜悅。」

**Hybrid Design** (活力 × 舒適) 結合了：
- 🎨 **Memphis 活力**: 四色彩色方案充滿生命力，避免單調與冷漠
- 🌙 **Neumorphism 溫暖**: 柔和雙層陰影讓介面親切舒適，適合長期使用
- ⚙️ **現代秩序**: 清晰的資訊層級、高效的交互設計、最小化的視覺干擾
- 🎯 **目的導向**: 幫助用戶從「想」到「做」，零阻力、高興致

### 設計決策的背景
經過三個設計方向的嘗試（有機現代主義、Memphis、Neumorphism），我們發現：
- **純 Neumorphism** 太過低調，缺乏品牌衝擊力和視覺吸引力
- **純 Memphis** 過於跳躍，不適合需要專注的任務管理工具
- **Hybrid 混合** 是最佳平衡點：取 Memphis 的活力色彩 + Neumorphism 的舒適質感

此版本設計以 ux-ux-genis.md 的 **Balanced 模式** 為基礎，強調 **效能優先**、**視覺活力**、**舒適質感** 和 **無漸層方案**。

---

*此設計文件由 Performance-Aware UI Design System 生成*
*設計 ID: #2025-ATM-HYBRID*
*版本: V4 (最終版)*
*更新日期: 2025-11-02* 
