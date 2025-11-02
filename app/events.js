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

    // Statistics Modal Events
    if (Elements.statsButton) {
        Elements.statsButton.addEventListener("click", () => {
            Elements.statsModal?.classList.remove("hidden");
            Elements.statsModal?.classList.add("flex");
            // Refresh stats when opening modal
            TaskManager.refreshStats();
        });
    }

    if (Elements.statsModalClose) {
        Elements.statsModalClose.addEventListener("click", () => {
            Elements.statsModal?.classList.add("hidden");
            Elements.statsModal?.classList.remove("flex");
        });
    }

    // Close modal when clicking on backdrop
    if (Elements.statsModal) {
        Elements.statsModal.addEventListener("click", (event) => {
            if (event.target === Elements.statsModal) {
                Elements.statsModal.classList.add("hidden");
                Elements.statsModal.classList.remove("flex");
            }
        });
    }

    // Close modal with ESC key
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && Elements.statsModal && !Elements.statsModal.classList.contains("hidden")) {
            Elements.statsModal.classList.add("hidden");
            Elements.statsModal.classList.remove("flex");
        }
    });

    if (Elements.refreshStatsModal) {
        Elements.refreshStatsModal.addEventListener("click", event => {
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
