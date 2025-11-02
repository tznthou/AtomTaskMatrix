# Atomic Task Matrix · UI/UX 設計文件 (V2 Brightstream)

> 效能模式: `eco` (Lighthouse Performance ≥ 90 · LCP < 2.5s · FID < 100ms · CLS < 0.1 · INP < 200ms)  
> 設計調性: 明亮、清爽、透明 · 強調即時燈號於頁頂顯示

---

## 1. 設計願景
- **產品定位**: 以艾森豪矩陣為核心的任務管理器,結合 Gemini 拆解,協助單一使用者把想法轉成行動。
- **V2 主題**: 「Brightstream」— 將任務視為流動中的光束,介面採明亮色調與柔和陰影,營造清爽透明的工程質感。
- **關鍵價值**
  - *立即掌握狀態*: 燈號資訊位於頁面最上方,連線與同步情況一目了然。
  - *極低摩擦*: 採 command bar + 卡片化象限,所有操作 3 步以內完成。
  - *持續動力*: 進度環與聚焦抽屜提供即時回饋,形成整體動能循環。

---

## 2. 視覺語言
- **色彩系統**
  - 背景基底 `#F4F6FB` (Cloud Haze)
  - 主色 `#2563EB` (Brand Primary · 清澈藍)
  - 輔色 `#0EA5E9` (Brand Accent · 水藍)
  - 成功 `#22C55E` / 警示 `#F59E0B` / 錯誤 `#EF4444`
  - 版面卡片 `#FFFFFF`, 邊框 `#E2E8F0`, 階層陰影 `0 18px 40px -24px rgba(15, 23, 42, 0.18)`
- **字體**
  - 標題: Sora / Inter Altern體 (Tailwind `font-sans`)
  - 內文: Inter
  - 字級: 使用 `clamp` 保障響應式 (例: H1 `clamp(1.75rem, 2vw, 2.4rem)`)
- **圖形語彙**
  - 大量留白 + 細膩邊框
  - 優雅漸層與柔和玻璃態,避免霓虹
  - Icon 採細線幾何,狀態色與文字一致

---

## 3. 版面配置
- **頂部狀態列**: 置頂顯示燈號、狀態文字、最後同步時間,右側列出快捷鍵 (`Tab`, `Enter`, `Shift+A`)。
- **主標頭**
  - 左: Logotype + 標語「完成比完美重要」
  - 右: 全域搜尋(⌘K) + 偏好設定/亮暗切換
- **Command Bar**
  - 單列輸入框 (支援 `/ai`, `/due`, `/tag`), 右側顯示即時提示
  - 表單下方顯示系統回饋文字 (成功/錯誤)
- **內容雙欄**
  - 左側 65%: 待分類 + 2x2 象限網格,每個象限搭配柔和色塊與任務數徽章
  - 右側 35%: 上方為本週進度環(完成率/平均存活/拆解採納),下方為 Focus Drawer
- **底部資訊**: 仍保留，但轉為簡短產品說明或版本號 (不再顯示燈號)

---

## 4. 互動重點
- **燈號**: Emoji + 文字,狀態差異:
  - 🟢 `text-brand-success`
  - 🟡 `text-amber-500`
  - 🔴 `text-brand-danger`
- **拖曳回饋**
  - 卡片拖曳: `shadow-lg` + `scale(1.02)`
  - 目標象限: `border-brand-primary/60` + `bg-brand-primary/10`
  - 鍵盤: `Shift + 箭頭` 切換象限
- **任務卡**
  - 標題 + 狀態 tag + 建立時間
  - 按鈕: 「專注」「完成」
  - 聚焦卡以 `ring-2 ring-brand-primary` 標示
- **Focus Drawer**
  - 顯示狀態徽章、母任務資訊、AI 拆解按鈕、子任務列表
  - 子任務支援完成操作與點擊切換聚焦
- **進度環**
  - SVG 圓環,中心顯示完成率, hover 顯示詳細 tooltip (未來擴充)

---

## 5. 無障礙與偏好設定
- 色彩對比 ≥ 4.5:1
- 全區可鍵盤操作; `Tab` 導覽, `Enter` 專注/取消
- `prefers-reduced-motion` 時改為陰影/顏色變化
- 偏好設定預留: 亮/暗模式、字級、動畫敏感度

---

## 6. 實作指引
- **Tailwind 設定**
  ```javascript
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          base: { bg: '#F4F6FB', card: '#FFFFFF', border: '#E2E8F0', text: '#1E293B', subtle: '#64748B' },
          brand: { primary: '#2563EB', accent: '#0EA5E9', success: '#22C55E', warning: '#F59E0B', danger: '#EF4444' }
        },
        boxShadow: {
          elevation: '0 18px 40px -24px rgba(15, 23, 42, 0.18)',
          card: '0 8px 20px -12px rgba(15, 23, 42, 0.16)'
        },
        borderRadius: { 'xl-lg': '1.25rem' }
      }
    }
  };
  ```
- **結構元件與 ID** 與 V1 保持,便於 JS 維護 (`task-form`, `uncategorized-dropzone`, `quadrant-q1~q4`, `focus-*`, `status-*` 等)。
- **CSS class 對應**
  - 象限卡: `bg-white` + `border border-base-border`
  - 任務卡: `bg-white`, `hover:border-brand-primary/50`
  - 狀態徽章: 依 `STATUS_ACCENTS` 指定 (詳見程式碼)
- **JS 調整**
  - 更新 `STATUS_ACCENTS` 為新顏色類別
  - 燈號狀態字色改用 `text-brand-success`、`text-amber-500`、`text-brand-danger`
  - Drag/drop 高亮 class 改為 `border-brand-primary/60`、`bg-brand-primary/10`
  - Progress Ring 仍使用 stroke,改為藍/灰色

---

## 7. 測試重點
- 頁面載入後燈號 2 秒內更新並顯示於頂部
- 新增/拖曳/完成任務流程保持既有效能
- Focus Drawer 在亮色模式可讀性佳
- Lighthouse Performance ≥ 90、CLS < 0.1
- Reduced motion 設定下,拖曳回饋不產生 scale

---

## 8. 版本資訊
- 2025-01-30 · Brightstream V2 草案完成,狀態列移至頁頂並採用亮色調
- 後續若導入暗模式,請更新 `design.md` 與對應配色表

---

如需更多視覺稿或組件說明,可再開 PR 擴充。此次設計以程式實作為主,未提供 Figma。 
