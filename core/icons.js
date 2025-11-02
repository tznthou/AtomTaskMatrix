/**
 * IconLibrary - Heroicons SVG 模板庫
 *
 * 職責：提供一致的圖標系統，替代 emoji
 * 依賴：無
 *
 * @module core/icons
 */

"use strict";

window.IconLibrary = {
    /**
     * Heroicons: sparkles (outline) - AI 拆解
     * @param {string} className - Tailwind CSS 類名 (default: "w-5 h-5")
     */
    sparkles: (className = "w-5 h-5") => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
    `,

    /**
     * Heroicons: check (outline) - 完成符號
     * @param {string} className - Tailwind CSS 類名 (default: "w-4 h-4")
     */
    check: (className = "w-4 h-4") => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
    `,

    /**
     * Heroicons: link (outline) - 子任務連結標記
     * @param {string} className - Tailwind CSS 類名 (default: "w-3.5 h-3.5")
     */
    link: (className = "w-3.5 h-3.5") => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    `,

    /**
     * Circle (solid) - 連線狀態指示器
     * @param {string} color - 顏色 (hex or tailwind color)
     * @param {string} className - Tailwind CSS 類名 (default: "w-4 h-4")
     */
    circle: (color = "currentColor", className = "w-4 h-4") => `
        <svg class="${className}" fill="${color}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" />
        </svg>
    `,

    /**
     * X Mark (outline) - 取消/關閉符號
     * @param {string} className - Tailwind CSS 類名 (default: "w-4 h-4")
     */
    xMark: (className = "w-4 h-4") => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
    `,

    /**
     * Heroicons: trash (outline) - 刪除符號
     * @param {string} className - Tailwind CSS 類名 (default: "w-5 h-5")
     */
    trash: (className = "w-5 h-5") => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    `,

    /**
     * Heroicons: exclamation (outline) - 警告/確認符號
     * @param {string} className - Tailwind CSS 類名 (default: "w-5 h-5")
     */
    exclamation: (className = "w-5 h-5") => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0-6a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
    `,

    /**
     * Heroicons: arrow-path (outline) - 加載中/旋轉符號（需要 CSS 動畫）
     * @param {string} className - Tailwind CSS 類名 (default: "w-5 h-5")
     */
    spinner: (className = "w-5 h-5") => `
        <svg class="${className} animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    `
};
