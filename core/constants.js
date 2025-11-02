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
