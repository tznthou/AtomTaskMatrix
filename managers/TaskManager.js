/**
 * TaskManager - 任務管理器
 *
 * 職責：處理所有任務相關的業務邏輯
 * 依賴：Config, BackendGateway, Renderer, AppState, STATUS_LABELS, Elements, ConnectionMonitor
 *
 * @module managers/TaskManager
 */

"use strict";

window.TaskManager = {
    async initialize() {
        await this.reloadTasks(true);
        if (Config.hasApi()) {
            this.refreshStats();
            ConnectionMonitor.start();
        }
    },

    async reloadTasks(showLoader = false) {
        if (!Config.hasApi()) {
            Renderer.updateConnection("disconnected", "請於 config.js 設定 API_BASE_URL");
            AppState.tasks = [];
            Renderer.renderAll();
            return;
        }

        if (showLoader) {
            Renderer.updateConnection("connecting", "同步中...");
        }

        try {
            const remoteTasks = await BackendGateway.loadTasks();
            const currentSelection = AppState.selectedTaskId;
            AppState.tasks = remoteTasks;
            if (!AppState.tasks.some(task => task.id === currentSelection)) {
                AppState.selectedTaskId = null;
            }
            Renderer.renderAll();
            Renderer.updateConnection("connected", "已連線後端服務");
            Renderer.updateLastSync(Date.now());
        } catch (error) {
            console.error("同步任務失敗:", error);
            Renderer.updateConnection("disconnected", "同步失敗,請檢查後端服務");
            throw error;
        }
    },

    async createTask(title) {
        if (!Config.hasApi()) {
            Renderer.showFeedback("請先設定 API_BASE_URL", "error");
            return;
        }

        const trimmed = title.trim();

        // ✅ M-02: 前端輸入長度驗證 - 防止超大輸入和 DOS 攻擊
        if (!trimmed) {
            Renderer.showFeedback("請輸入任務內容", "error");
            return;
        }

        const maxLength = 100;  // 與後端 sanitizeTitle 的 maxLength 一致
        if (trimmed.length > maxLength) {
            Renderer.showFeedback(`任務內容不能超過 ${maxLength} 個字`, "error");
            return;
        }

        Renderer.showFeedback("同步中...", "info");

        try {
            await BackendGateway.createTask({ title: trimmed });
            if (Elements.commandInput) Elements.commandInput.value = "";
            await this.reloadTasks();
            Renderer.showFeedback("任務新增成功", "success");
            this.refreshStats();
        } catch (error) {
            console.error("新增任務失敗:", error);
            Renderer.showFeedback("同步失敗,請稍後再試", "error");
        }
    },

    async updateTaskStatus(taskId, nextStatus) {
        if (!Config.hasApi()) {
            Renderer.showFeedback("請先設定 API_BASE_URL", "error");
            return;
        }

        const task = AppState.tasks.find(item => item.id === taskId);
        if (!task || task.status === nextStatus) return;

        // ✅ M-02: 驗證狀態值 - 防止無效狀態被發送到後端
        const validStatuses = new Set(Object.keys(STATUS_LABELS));
        if (!validStatuses.has(nextStatus)) {
            Renderer.showFeedback("無效的任務狀態", "error");
            return;
        }

        const snapshot = task.clone();
        task.status = nextStatus;
        task.updated_at = new Date().toISOString();
        Renderer.renderAll();

        try {
            const updated = await BackendGateway.updateTaskStatus(task.id, nextStatus);
            if (updated) {
                Object.assign(task, updated);
            }
            Renderer.updateLastSync(Date.now());
        } catch (error) {
            console.error("更新任務狀態失敗:", error);
            Object.assign(task, snapshot);
            Renderer.renderAll();
            Renderer.showFeedback("同步失敗,已還原狀態", "error");
        }
    },

    async completeTask(taskId) {
        if (!Config.hasApi()) {
            Renderer.showFeedback("請先設定 API_BASE_URL", "error");
            return;
        }

        const task = AppState.tasks.find(item => item.id === taskId);
        if (!task || task.status === "completed") return;

        const snapshot = task.clone();
        const timestamp = new Date().toISOString();
        Object.assign(task, {
            status: "completed",
            updated_at: timestamp,
            completed_at: timestamp
        });
        Renderer.renderAll();

        try {
            const updated = await BackendGateway.completeTask(task.id);
            if (updated) {
                Object.assign(task, updated);
            }
            Renderer.updateLastSync(Date.now());
            Renderer.showFeedback("任務已完成", "success");
            this.refreshStats();
        } catch (error) {
            console.error("完成任務失敗:", error);
            Object.assign(task, snapshot);
            Renderer.renderAll();
            Renderer.showFeedback("同步失敗,請稍後再試", "error");
        }
    },

    async deleteTask(taskId) {
        if (!Config.hasApi()) {
            Renderer.showFeedback("請先設定 API_BASE_URL", "error");
            return;
        }

        const taskIndex = AppState.tasks.findIndex(item => item.id === taskId);
        if (taskIndex === -1) return;

        const deletedTask = AppState.tasks[taskIndex];

        // ✅ 樂觀更新 UI
        AppState.tasks.splice(taskIndex, 1);
        if (AppState.selectedTaskId === taskId) {
            AppState.selectedTaskId = null;
        }
        Renderer.renderAll();

        try {
            await BackendGateway.deleteTask(taskId);
            Renderer.updateLastSync(Date.now());
            Renderer.showFeedback("任務已刪除", "success");
            this.refreshStats();
        } catch (error) {
            console.error("刪除任務失敗:", error);
            // ✅ 刪除失敗時恢復任務
            AppState.tasks.splice(taskIndex, 0, deletedTask);
            Renderer.renderAll();
            Renderer.showFeedback("同步失敗,請稍後再試", "error");
        }
    },

    async refreshStats() {
        if (!Config.hasApi()) return;
        try {
            AppState.weeklyStats = await BackendGateway.fetchWeeklyStats();
        } catch (error) {
            console.error("載入統計失敗:", error);
            AppState.weeklyStats = null;
            Renderer.showFeedback("無法取得統計資料", "error");
        } finally {
            Renderer.renderStats();
        }
    },

    async requestBreakdown(taskId) {
        if (!Config.hasApi()) {
            Renderer.showFeedback("請先設定 API_BASE_URL", "error");
            return;
        }

        const task = AppState.tasks.find(item => item.id === taskId);
        if (!task) return;

        Renderer.showFeedback("AI 拆解中...", "info");

        try {
            await BackendGateway.breakdownTask(task.id);
            await this.reloadTasks();
            Renderer.showFeedback("AI 拆解完成", "success");
            this.refreshStats();
        } catch (error) {
            console.error("AI 拆解失敗:", error);
            Renderer.showFeedback("AI 分析暫時無法使用,請稍後再試", "error");
        }
    }
};
