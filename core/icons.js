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
    `,

    /**
     * Heroicons: chart-bar (outline) - 統計圖表符號
     * @param {string} className - Tailwind CSS 類名 (default: "w-5 h-5")
     */
    chartBar: (className = "w-5 h-5") => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    `,

    /**
     * Heroicons: puzzle-piece (outline) - 拆解/模組化符號
     * @param {string} className - Tailwind CSS 類名 (default: "w-5 h-5")
     */
    puzzlePiece: (className = "w-5 h-5") => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
        </svg>
    `,

    /**
     * Atomic Task Matrix Logo - 四象限矩陣
     * @param {string} className - Tailwind CSS 類名 (default: "w-8 h-8")
     */
    logo: (className = "w-8 h-8") => `
        <svg viewBox="0 0 40 40" class="${className}" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="15" height="15" fill="#FF6B6B" stroke="#2D2D2D" stroke-width="2.5"/>
            <rect x="22" y="3" width="15" height="15" fill="#26DE81" stroke="#2D2D2D" stroke-width="2.5"/>
            <rect x="3" y="22" width="15" height="15" fill="#FFA502" stroke="#2D2D2D" stroke-width="2.5"/>
            <rect x="22" y="22" width="15" height="15" fill="#00D2FC" stroke="#2D2D2D" stroke-width="2.5"/>
        </svg>
    `
};
