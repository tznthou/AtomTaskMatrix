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

    const dropTargets = [
        Elements.uncategorized,
        ...Elements.quadrants
    ].filter(Boolean);

    dropTargets.forEach(zone => {
        zone.addEventListener("dragover", DragDropHandler.onDragOver);
        zone.addEventListener("dragleave", DragDropHandler.onDragLeave);
        zone.addEventListener("drop", DragDropHandler.onDrop);
    });
};
