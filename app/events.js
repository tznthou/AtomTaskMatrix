/**
 * Events - 事件綁定
 *
 * 職責：綁定所有 UI 元素的事件處理器
 * 依賴：Elements, TaskManager, DragDropHandler, AppState
 *
 * @module app/events
 */

"use strict";

window.bindEvents = function bindEvents() {
    if (Elements.commandForm) {
        Elements.commandForm.addEventListener("submit", async event => {
            event.preventDefault();
            const value = Elements.commandInput?.value ?? "";
            await TaskManager.createTask(value);
        });
    }

    if (Elements.refreshStats) {
        Elements.refreshStats.addEventListener("click", event => {
            event.preventDefault();
            TaskManager.refreshStats();
        });
    }

    if (Elements.focusCancel) {
        Elements.focusCancel.addEventListener("click", event => {
            event.preventDefault();
            TaskManager.selectTask(null);
        });
    }

    if (Elements.focusAi) {
        Elements.focusAi.addEventListener("click", event => {
            event.preventDefault();
            const taskId = event.currentTarget.dataset.taskId;
            if (taskId) TaskManager.requestBreakdown(taskId);
        });
    }

    if (Elements.focusComplete) {
        Elements.focusComplete.addEventListener("click", event => {
            event.preventDefault();
            const taskId = event.currentTarget.dataset.taskId;
            if (taskId) TaskManager.completeTask(taskId);
        });
    }

    const dropTargets = [
        Elements.uncategorized,
        ...Elements.quadrants
    ].filter(Boolean);

    dropTargets.forEach(zone => {
        zone.addEventListener("dragover", DragDropHandler.onDragOver);
        zone.addEventListener("dragleave", DragDropHandler.onDragLeave);
        zone.addEventListener("drop", DragDropHandler.onDrop);
    });

    // ✅ 全域鍵盤快捷鍵
    document.addEventListener("keydown", event => {
        // Shift+A: AI 拆解當前選中的任務
        if (event.shiftKey && (event.key === 'A' || event.key === 'a')) {
            // 避免在輸入框中觸發
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            event.preventDefault();

            if (AppState.selectedTaskId) {
                const task = AppState.tasks.find(t => t.id === AppState.selectedTaskId);
                if (task && task.status !== 'completed') {
                    TaskManager.requestBreakdown(AppState.selectedTaskId);
                }
            }
        }
    });
};
