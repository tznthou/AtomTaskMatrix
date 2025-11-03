/**
 * Constants - 常數定義
 *
 * 職責：定義任務狀態標籤和視覺樣式
 * 依賴：無
 *
 * @module core/constants
 */

"use strict";

window.STATUS_LABELS = {
    uncategorized: "待分類",
    urgent_important: "重要且緊急",
    not_urgent_important: "重要不緊急",
    urgent_not_important: "緊急不重要",
    not_urgent_not_important: "不緊急不重要",
    completed: "已完成"
};

window.STATUS_ACCENTS = {
    uncategorized: { text: "text-brand-accent", border: "border-brand-accent/40", bg: "bg-brand-accent/10" },
    urgent_important: { text: "text-rose-600", border: "border-rose-400/40", bg: "bg-rose-100" },
    not_urgent_important: { text: "text-emerald-600", border: "border-emerald-400/40", bg: "bg-emerald-100" },
    urgent_not_important: { text: "text-amber-600", border: "border-amber-400/40", bg: "bg-amber-100" },
    not_urgent_not_important: { text: "text-slate-600", border: "border-slate-300", bg: "bg-slate-100" },
    completed: { text: "text-brand-success", border: "border-brand-success/30", bg: "bg-brand-success/10" }
};

/**
 * ✅ 任務強度標示 - 用於 AI breakdown 生成的子任務
 * S = Small (🌱), M = Medium (⚡), L = Large (🚀)
 */
window.INTENSITY_LABELS = {
    S: "小型任務",
    M: "中型任務",
    L: "大型任務"
};

/**
 * ✅ 任務強度視覺樣式 - Memphis Design 風格
 * 特色：粗邊框、彩色、輕微旋轉
 */
window.INTENSITY_ACCENTS = {
    S: {
        text: "text-emerald-700",
        border: "border-emerald-500",
        bg: "bg-emerald-50",
        emoji: "🌱",
        duration: "≤2分鐘"
    },
    M: {
        text: "text-amber-700",
        border: "border-amber-500",
        bg: "bg-amber-50",
        emoji: "⚡",
        duration: "5-10分鐘"
    },
    L: {
        text: "text-rose-700",
        border: "border-rose-500",
        bg: "bg-rose-50",
        emoji: "🚀",
        duration: "15-30分鐘"
    }
};
