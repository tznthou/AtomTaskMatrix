/**
 * DragDropHandler - 拖放處理器
 *
 * 職責：處理任務卡片的拖放交互
 * 依賴：TaskManager
 *
 * @module handlers/DragDropHandler
 */

"use strict";

window.DragDropHandler = {
    onDragStart(event, taskId) {
        if (!taskId) return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", taskId);
        event.currentTarget?.classList.add("opacity-60");
    },

    onDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        event.currentTarget.classList.add("border-brand-primary/60", "bg-brand-primary/10");
    },

    onDragLeave(event) {
        event.currentTarget.classList.remove("border-brand-primary/60", "bg-brand-primary/10");
    },

    async onDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove("border-brand-primary/60", "bg-brand-primary/10");
        const taskId = event.dataTransfer.getData("text/plain");
        const targetStatus = event.currentTarget.dataset.status;
        if (!taskId || !targetStatus) return;
        await TaskManager.updateTaskStatus(taskId, targetStatus);
    },

    onDragEnd(event) {
        event.currentTarget?.classList.remove("opacity-60");
        document.querySelectorAll(".quadrant-dropzone").forEach(zone => {
            zone.classList.remove("border-brand-primary/60", "bg-brand-primary/10");
        });
    }
};
