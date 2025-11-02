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
    Elements.template = document.getElementById("task-card-template");

    // Statistics Modal Elements
    Elements.statsButton = document.getElementById("stats-button");
    Elements.statsModal = document.getElementById("stats-modal");
    Elements.statsModalClose = document.getElementById("stats-modal-close");
    Elements.refreshStatsModal = document.getElementById("refresh-stats-modal");
    Elements.progressCircleModal = document.getElementById("progress-ring-circle-modal");
    Elements.progressValueModal = document.getElementById("progress-ring-value-modal");
    Elements.statTotalCompletedModal = document.getElementById("stat-total-completed-modal");
    Elements.statAvgLifetimeModal = document.getElementById("stat-avg-lifetime-modal");
    Elements.statAdoptionModal = document.getElementById("stat-adoption-modal");
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
