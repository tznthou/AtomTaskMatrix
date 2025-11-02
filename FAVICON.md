# Favicon 生成指南

## 當前 Favicon

項目使用 SVG 格式的 favicon（`favicon.svg`），這是現代瀏覽器推薦的格式。

### 設計說明

Logo 設計理念：
- **四象限矩陣**：代表 Eisenhower Matrix 的四個象限
- **Memphis Design 風格**：粗黑邊框 + 品牌色彩
- **顏色含義**：
  - 🔴 紅色 (#FF6B6B)：重要且緊急
  - 🟢 綠色 (#26DE81)：重要不緊急
  - 🟠 橙色 (#FFA502)：緊急不重要
  - 🔵 藍色 (#00D2FC)：不緊急不重要

## 生成傳統 favicon.ico（可選）

某些舊版瀏覽器可能需要 `.ico` 格式。可以使用以下方法生成：

### 方法 1：在線工具

1. 訪問 [RealFaviconGenerator](https://realfavicongenerator.net/)
2. 上傳 `favicon.svg`
3. 下載生成的 `favicon.ico`

### 方法 2：使用 ImageMagick

```bash
# 安裝 ImageMagick (macOS)
brew install imagemagick

# 從 SVG 生成多尺寸 ICO
convert favicon.svg -define icon:auto-resize=256,128,64,32,16 favicon.ico
```

### 方法 3：使用 Node.js

```bash
npm install -g svg2ico

svg2ico favicon.svg favicon.ico
```

## HTML 引用

當前 `index.html` 中的引用：

```html
<!-- SVG Favicon (現代瀏覽器) -->
<link rel="icon" type="image/svg+xml" href="favicon.svg">

<!-- 如果有 ICO 格式（可選，舊版瀏覽器） -->
<link rel="icon" type="image/x-icon" href="favicon.ico">
```

## 其他用途

Logo SVG 也可以在代碼中使用（已集成到 `core/icons.js`）：

```javascript
// 使用 IconLibrary
const logoHtml = IconLibrary.logo("w-12 h-12");
```

## 文件列表

- `favicon.svg` - SVG 格式 favicon（主要使用）
- `favicon.ico` - ICO 格式 favicon（可選，需手動生成）
- `core/icons.js` - 包含可重用的 logo 函數

## 部署到 Zeabur

確保 `favicon.svg` 已提交到 Git 倉庫並推送到遠端，Zeabur 會自動部署。

```bash
git add favicon.svg FAVICON.md
git commit -m "feat: add Memphis Design SVG logo and favicon"
git push origin master
```
