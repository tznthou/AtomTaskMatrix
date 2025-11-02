/**
 * State - 應用狀態管理
 *
 * 職責：管理全域應用狀態和 DOM 元素引用
 * 依賴：無（Elements 在 bootstrap 時初始化）
 *
 * @module core/state
 */

"use strict";

/**
 * AppState - 全域應用狀態
 */
window.AppState = {
    tasks: [],
    selectedTaskId: null,
    connectionStatus: "disconnected",
    lastSyncTime: null,
    weeklyStats: null,
    csrfToken: null  // ✅ 儲存 CSRF token，用於狀態變更請求
};

/**
 * Elements - DOM 元素引用
 * 注意：空物件，實際初始化在 app/bootstrap.js 中進行
 */
window.Elements = {};
