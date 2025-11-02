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
    `
};
