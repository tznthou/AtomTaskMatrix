/**
 * Bootstrap - 應用初始化
 *
 * 職責：初始化 DOM 元素引用並啟動應用
 * 依賴：Elements, Renderer, TaskManager, bindEvents
 *
 * @module app/bootstrap
 */

"use strict";

/**
 * 初始化 DOM 元素引用
 * 必須在 DOMContentLoaded 後執行
 */
function initializeElements() {
    Elements.commandForm = document.getElementById("task-form");
    Elements.commandInput = document.getElementById("task-input");
    Elements.feedback = document.getElementById("task-feedback");
    Elements.statusIndicator = document.getElementById("status-indicator");
    Elements.statusText = document.getElementById("status-text");
    Elements.lastSync = document.getElementById("last-sync");
    Elements.uncategorized = document.getElementById("uncategorized-dropzone");
    Elements.quadrants = Array.from(document.querySelectorAll(".quadrant-dropzone"));
    Elements.quadrantBadges = {
        urgent_important: document.getElementById("badge-q1"),
        not_urgent_important: document.getElementById("badge-q2"),
        urgent_not_important: document.getElementById("badge-q3"),
        not_urgent_not_important: document.getElementById("badge-q4")
    };
    Elements.refreshStats = document.getElementById("refresh-stats");
    Elements.progressCircle = document.getElementById("progress-ring-circle");
    Elements.progressValue = document.getElementById("progress-ring-value");
    Elements.statTotalCompleted = document.getElementById("stat-total-completed");
    Elements.statAvgLifetime = document.getElementById("stat-avg-lifetime");
    Elements.statAdoption = document.getElementById("stat-adoption");
    Elements.focusPanel = document.getElementById("focus-panel");
    Elements.focusEmpty = document.getElementById("focus-empty");
    Elements.focusDetail = document.getElementById("focus-detail");
    Elements.focusTitle = document.getElementById("focus-title");
    Elements.focusMeta = document.getElementById("focus-meta");
    Elements.focusStatus = document.getElementById("focus-status");
    Elements.focusParent = document.getElementById("focus-parent");
    Elements.focusCancel = document.getElementById("focus-cancel");
    Elements.focusAi = document.getElementById("focus-ai");
    Elements.focusComplete = document.getElementById("focus-complete");
    Elements.focusSubtasks = document.getElementById("focus-subtasks");
    Elements.focusCreated = document.getElementById("focus-created");
    Elements.focusUpdated = document.getElementById("focus-updated");
    Elements.template = document.getElementById("task-card-template");
    Elements.subtaskTemplate = document.getElementById("focus-subtask-template");
}

/**
 * 應用啟動入口
 */
function bootstrap() {
    initializeElements();
    Renderer.updateConnection("connecting", "初始化中...");
    bindEvents();
    TaskManager.initialize().catch(error => {
        console.error("初始化失敗:", error);
    });
}

document.addEventListener("DOMContentLoaded", bootstrap);
