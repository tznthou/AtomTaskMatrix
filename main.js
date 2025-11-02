"use strict";

const STATUS_LABELS = {
    uncategorized: "待分類",
    urgent_important: "重要且緊急",
    not_urgent_important: "重要不緊急",
    urgent_not_important: "緊急不重要",
    not_urgent_not_important: "不緊急不重要",
    completed: "已完成"
};

const STATUS_ACCENTS = {
    uncategorized: { text: "text-brand-accent", border: "border-brand-accent/40", bg: "bg-brand-accent/10" },
    urgent_important: { text: "text-rose-600", border: "border-rose-400/40", bg: "bg-rose-100" },
    not_urgent_important: { text: "text-emerald-600", border: "border-emerald-400/40", bg: "bg-emerald-100" },
    urgent_not_important: { text: "text-amber-600", border: "border-amber-400/40", bg: "bg-amber-100" },
    not_urgent_not_important: { text: "text-slate-600", border: "border-slate-300", bg: "bg-slate-100" },
    completed: { text: "text-brand-success", border: "border-brand-success/30", bg: "bg-brand-success/10" }
};

const Elements = {
    commandForm: document.getElementById("task-form"),
    commandInput: document.getElementById("task-input"),
    feedback: document.getElementById("task-feedback"),
    statusIndicator: document.getElementById("status-indicator"),
    statusText: document.getElementById("status-text"),
    lastSync: document.getElementById("last-sync"),
    uncategorized: document.getElementById("uncategorized-dropzone"),
    quadrants: Array.from(document.querySelectorAll(".quadrant-dropzone")),
    quadrantBadges: {
        urgent_important: document.getElementById("badge-q1"),
        not_urgent_important: document.getElementById("badge-q2"),
        urgent_not_important: document.getElementById("badge-q3"),
        not_urgent_not_important: document.getElementById("badge-q4")
    },
    refreshStats: document.getElementById("refresh-stats"),
    progressCircle: document.getElementById("progress-ring-circle"),
    progressValue: document.getElementById("progress-ring-value"),
    statTotalCompleted: document.getElementById("stat-total-completed"),
    statAvgLifetime: document.getElementById("stat-avg-lifetime"),
    statAdoption: document.getElementById("stat-adoption"),
    focusPanel: document.getElementById("focus-panel"),
    focusEmpty: document.getElementById("focus-empty"),
    focusDetail: document.getElementById("focus-detail"),
    focusTitle: document.getElementById("focus-title"),
    focusMeta: document.getElementById("focus-meta"),
    focusStatus: document.getElementById("focus-status"),
    focusParent: document.getElementById("focus-parent"),
    focusCancel: document.getElementById("focus-cancel"),
    focusAi: document.getElementById("focus-ai"),
    focusComplete: document.getElementById("focus-complete"),
    focusSubtasks: document.getElementById("focus-subtasks"),
    focusCreated: document.getElementById("focus-created"),
    focusUpdated: document.getElementById("focus-updated"),
    template: document.getElementById("task-card-template"),
    subtaskTemplate: document.getElementById("focus-subtask-template")
};

const AppState = {
    tasks: [],
    selectedTaskId: null,
    connectionStatus: "disconnected",
    lastSyncTime: null,
    weeklyStats: null,
    csrfToken: null  // ✅ 儲存 CSRF token，用於狀態變更請求
};

class Task {
    constructor({
        id = Task.generateId(),
        title,
        status = "uncategorized",
        parentTaskId = null,
        parentTaskTitle = null,
        createdAt = new Date().toISOString(),
        updatedAt = createdAt,
        completedAt = null
    }) {
        this.id = id;
        this.title = (title ?? "").toString().trim();
        this.status = status;
        this.parent_task_id = parentTaskId;
        this.parent_task_title = parentTaskTitle;
        this.created_at = createdAt;
        this.updated_at = updatedAt;
        this.completed_at = completedAt;
    }

    static generateId() {
        return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    static fromApiPayload(payload = {}) {
        return new Task({
            id: payload.id,
            title: payload.title,
            status: payload.status,
            parentTaskId: payload.parent_task_id ?? payload.parentTaskId ?? null,
            parentTaskTitle: payload.parent_task_title ?? payload.parentTaskTitle ?? null,
            createdAt: payload.created_at ?? payload.createdAt ?? new Date().toISOString(),
            updatedAt: payload.updated_at ?? payload.updatedAt ?? new Date().toISOString(),
            completedAt: payload.completed_at ?? payload.completedAt ?? null
        });
    }

    clone(overrides = {}) {
        return new Task({
            id: overrides.id ?? this.id,
            title: overrides.title ?? this.title,
            status: overrides.status ?? this.status,
            parentTaskId: overrides.parent_task_id ?? overrides.parentTaskId ?? this.parent_task_id,
            parentTaskTitle: overrides.parent_task_title ?? overrides.parentTaskTitle ?? this.parent_task_title,
            createdAt: overrides.created_at ?? overrides.createdAt ?? this.created_at,
            updatedAt: overrides.updated_at ?? overrides.updatedAt ?? this.updated_at,
            completedAt: overrides.completed_at ?? overrides.completedAt ?? this.completed_at
        });
    }
}

const Config = {
    get raw() {
        return typeof window !== "undefined" ? window.CONFIG ?? null : null;
    },
    apiBaseUrl() {
        const cfg = this.raw;
        if (!cfg?.API_BASE_URL) {
            const error = new Error("API_BASE_URL_MISSING");
            error.code = "API_BASE_URL_MISSING";
            throw error;
        }
        return cfg.API_BASE_URL.replace(/\/+$/, "");
    },
    apiToken() {
        return this.raw?.API_TOKEN ?? null;
    },
    hasApi() {
        try {
            this.apiBaseUrl();
            return true;
        } catch {
            return false;
        }
    }
};

const BackendGateway = {
    headers() {
        // ✅ 改用 URL 參數傳遞 token，避免 CORS preflight 問題
        // GAS Web App 的 custom header 會觸發 OPTIONS preflight，導致 CORS 失敗
        // 使用 URL 參數方式不會有此問題
        return {};
    },

    resolvePath(path) {
        const base = Config.apiBaseUrl();
        const url = new URL(base);
        if (path) {
            url.searchParams.set("path", path.replace(/^\/+/, ""));
        }
        // ✅ 在 URL 參數中加入 token
        const token = Config.apiToken();
        if (token) {
            url.searchParams.set("token", token);
        }
        // ✅ 為 DELETE 請求加入 CSRF token（因為 DELETE 通常沒有 body）
        if (AppState.csrfToken) {
            url.searchParams.set("csrf_token", AppState.csrfToken);
        }
        return url.toString();
    },

    async request(path, { method = "GET", body, parseJson = true } = {}) {
        const url = this.resolvePath(path);
        const options = { method: (method ?? "GET").toUpperCase(), headers: this.headers() };

        if (body !== undefined) {
            // ✅ CSRF Token 防禦 - POST/PUT/DELETE 請求必須包含有效的 CSRF token
            const requestBody = body;
            if (['POST', 'PUT', 'DELETE'].includes(options.method) && AppState.csrfToken) {
                requestBody.csrf_token = AppState.csrfToken;
            }

            const form = new URLSearchParams();
            form.append("payload", JSON.stringify(requestBody));
            options.body = form.toString();
            options.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            const text = await response.text();
            const error = new Error("API_REQUEST_FAILED");
            error.status = response.status;
            error.body = text;
            throw error;
        }

        if (!parseJson || response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type") ?? "";
        let payload = null;
        if (contentType.includes("application/json")) {
            payload = await response.json();
        } else {
            // ✅ GAS 返回 TEXT MIME type，但內容是 JSON，需要手動 parse
            const text = await response.text();
            try {
                payload = JSON.parse(text);
            } catch (e) {
                // 如果不是 JSON，直接返回 text
                payload = text;
            }
        }

        if (payload && typeof payload === "object" && payload.success === false) {
            const error = new Error(payload.message ?? "API_ERROR");
            error.code = payload.code ?? "API_ERROR";
            error.details = payload.details;
            throw error;
        }

        // ✅ 保存返回的 CSRF token 供下次請求使用
        if (payload && typeof payload === "object" && payload.csrf_token) {
            AppState.csrfToken = payload.csrf_token;
        }

        return payload;
    },

    async loadTasks() {
        const data = await this.request("/tasks");
        const items = Array.isArray(data?.tasks) ? data.tasks : Array.isArray(data) ? data : [];
        return items.map(Task.fromApiPayload);
    },

    async createTask(payload) {
        const data = await this.request("/tasks", {
            method: "POST",
            body: {
                title: payload.title,
                status: payload.status ?? "uncategorized",
                parent_task_id: payload.parent_task_id ?? null,
                parent_task_title: payload.parent_task_title ?? null
            }
        });
        const taskData = data?.task ?? data;
        return taskData ? Task.fromApiPayload(taskData) : null;
    },

    async updateTaskStatus(taskId, newStatus) {
        const data = await this.request("/tasks/update", {
            method: "POST",
            body: { id: taskId, status: newStatus }
        });
        const taskData = data?.task ?? data;
        return taskData ? Task.fromApiPayload(taskData) : null;
    },

    async completeTask(taskId) {
        const data = await this.request(`/tasks/${encodeURIComponent(taskId)}/complete`, {
            method: "POST"
        });
        const taskData = data?.task ?? data;
        return taskData ? Task.fromApiPayload(taskData) : null;
    },

    async deleteTask(taskId) {
        const data = await this.request(`/tasks/${encodeURIComponent(taskId)}/delete`, {
            method: "DELETE"
        });
        return data?.result ?? data;
    },

    async fetchWeeklyStats() {
        const data = await this.request("/stats/weekly");
        const stats = data?.stats ?? data;
        if (!stats) return null;
        return {
            week_start: stats.week_start ?? "",
            week_end: stats.week_end ?? "",
            total_created: Number(stats.total_created ?? 0),
            total_completed: Number(stats.total_completed ?? 0),
            completion_rate: stats.completion_rate != null ? Number(stats.completion_rate) : null,
            avg_lifetime_days: stats.avg_lifetime_days != null ? Number(stats.avg_lifetime_days) : null,
            updated_at: stats.updated_at ?? "",
            adoption_rate: stats.adoption_rate != null ? Number(stats.adoption_rate) : null
        };
    },

    async breakdownTask(taskId) {
        return this.request(`/tasks/${encodeURIComponent(taskId)}/breakdown`, {
            method: "POST"
        });
    },

    async ping() {
        try {
            await this.request("/health", { parseJson: false });
            return true;
        } catch (error) {
            if (error.status === 404) {
                await this.request("/tasks", { parseJson: false });
                return true;
            }
            throw error;
        }
    }
};

const Renderer = {
    renderAll() {
        this.renderBoard();
        this.renderFocusPanel();
        this.renderStats();
    },

    renderBoard() {
        const buckets = {
            uncategorized: Elements.uncategorized,
            urgent_important: document.getElementById("quadrant-q1"),
            not_urgent_important: document.getElementById("quadrant-q2"),
            urgent_not_important: document.getElementById("quadrant-q3"),
            not_urgent_not_important: document.getElementById("quadrant-q4")
        };

        Object.entries(buckets).forEach(([status, container]) => {
            if (!container) return;
            container.innerHTML = "";
            const tasks = AppState.tasks.filter(task => task.status === status);

            if (Elements.quadrantBadges[status]) {
                Elements.quadrantBadges[status].textContent = `${tasks.length} 項`;
            }

            if (tasks.length === 0) {
                const placeholder = document.createElement("p");
                placeholder.className = "text-xs text-base-subtle";
                placeholder.textContent = status === "uncategorized"
                    ? "目前沒有任務，透過命令列建立新的行動。"
                    : "拖曳任務或使用 Shift + 方向鍵移動到此象限。";
                container.appendChild(placeholder);
                return;
            }

            tasks.forEach(task => {
                const card = this.buildTaskCard(task);
                container.appendChild(card);
            });
        });
    },

    buildTaskCard(task) {
        if (!Elements.template) return document.createElement("div");
        const node = Elements.template.content.firstElementChild.cloneNode(true);
        node.dataset.taskId = task.id;
        node.dataset.status = task.status;

        const titleEl = node.querySelector("p.font-semibold");
        const subEl = node.querySelector("p.text-xs");
        const statusLabelEl = node.querySelector(".status-label");
        const createdEl = node.querySelector(".created-at");
        const focusButton = node.querySelector('[data-action="focus"]');
        const completeButton = node.querySelector('[data-action="complete"]');
        const deleteButton = node.querySelector('[data-action="delete"]');

        titleEl.textContent = task.title;
        subEl.textContent = task.parent_task_title ? `🔗 來自 ${task.parent_task_title}` : "獨立任務";
        statusLabelEl.textContent = STATUS_LABELS[task.status] ?? task.status;
        createdEl.textContent = this.formatRelativeTime(task.created_at);

        if (AppState.selectedTaskId === task.id) {
            node.classList.add("ring-2", "ring-brand-primary/60");
        }

        if (task.status === "completed") {
            node.classList.add("opacity-60");
            node.draggable = false;
            completeButton.classList.add("hidden");
        } else {
            node.draggable = true;
            completeButton.classList.remove("hidden");
        }

        focusButton.addEventListener("click", event => {
            event.preventDefault();
            TaskManager.selectTask(task.id);
        });

        completeButton.addEventListener("click", event => {
            event.preventDefault();
            TaskManager.completeTask(task.id);
        });

        deleteButton.addEventListener("click", event => {
            event.preventDefault();
            TaskManager.deleteTask(task.id);
        });

        node.addEventListener("dragstart", event => DragDropHandler.onDragStart(event, task.id));
        node.addEventListener("dragend", DragDropHandler.onDragEnd);

        return node;
    },

    renderFocusPanel() {
        const task = AppState.tasks.find(item => item.id === AppState.selectedTaskId);

        if (!task) {
            Elements.focusDetail?.classList.add("hidden");
            Elements.focusEmpty?.classList.remove("hidden");
            return;
        }

        Elements.focusEmpty?.classList.add("hidden");
        Elements.focusDetail?.classList.remove("hidden");

        Elements.focusTitle.textContent = task.title;
        Elements.focusMeta.textContent = task.parent_task_title
            ? `🔗 來自 ${task.parent_task_title}`
            : "獨立任務";

        this.applyStatusAccent(Elements.focusStatus, task.status);
        Elements.focusStatus.textContent = STATUS_LABELS[task.status] ?? task.status;

        if (task.parent_task_title) {
            Elements.focusParent.textContent = `母任務: ${task.parent_task_title}`;
            Elements.focusParent.classList.remove("hidden");
        } else {
            Elements.focusParent.classList.add("hidden");
        }

        if (Elements.focusAi) {
            Elements.focusAi.dataset.taskId = task.id;
            const disabled = task.status === "completed";
            Elements.focusAi.disabled = disabled;
            Elements.focusAi.classList.toggle("opacity-60", disabled);
            Elements.focusAi.classList.toggle("pointer-events-none", disabled);
        }

        if (Elements.focusComplete) {
            Elements.focusComplete.dataset.taskId = task.id;
            const disabled = task.status === "completed";
            Elements.focusComplete.disabled = disabled;
            Elements.focusComplete.classList.toggle("opacity-60", disabled);
            Elements.focusComplete.classList.toggle("pointer-events-none", disabled);
        }

        Elements.focusCreated.textContent = `建立於 ${this.formatDateTime(task.created_at)}`;
        Elements.focusUpdated.textContent = `最後更新 ${this.formatDateTime(task.updated_at)}`;

        this.renderFocusSubtasks(task);
    },

    renderFocusSubtasks(parentTask) {
        if (!Elements.focusSubtasks) return;
        Elements.focusSubtasks.innerHTML = "";

        const subtasks = AppState.tasks.filter(task => task.parent_task_id === parentTask.id);
        if (subtasks.length === 0) {
            const placeholder = document.createElement("li");
            placeholder.className = "text-xs text-base-subtle";
            placeholder.textContent = "尚未有子任務。使用 AI 拆解或自行建立。";
            Elements.focusSubtasks.appendChild(placeholder);
            return;
        }

        subtasks.forEach(subtask => {
            const node = Elements.subtaskTemplate.content.firstElementChild.cloneNode(true);
            node.dataset.subtaskId = subtask.id;
            node.querySelector("span.font-medium").textContent = subtask.title;
            node.querySelector("span.text-[11px]").textContent = STATUS_LABELS[subtask.status] ?? subtask.status;

            const completeButton = node.querySelector('[data-action="complete-subtask"]');
            if (subtask.status === "completed") {
                completeButton.classList.add("hidden");
                node.classList.add("opacity-60");
            } else {
                completeButton.addEventListener("click", event => {
                    event.preventDefault();
                    TaskManager.completeTask(subtask.id);
                });
            }

            node.addEventListener("click", () => TaskManager.selectTask(subtask.id));
            Elements.focusSubtasks.appendChild(node);
        });
    },

    renderStats() {
        const stats = AppState.weeklyStats;
        this.updateProgressRing(stats?.completion_rate ?? null);

        Elements.statTotalCompleted.textContent = stats?.total_completed ?? "--";
        Elements.statAvgLifetime.textContent = stats?.avg_lifetime_days != null
            ? `${Number(stats.avg_lifetime_days).toFixed(1)} 天`
            : "-- 天";

        Elements.statAdoption.textContent = stats?.adoption_rate != null
            ? `${Number(stats.adoption_rate).toFixed(0)}%`
            : "--%";
    },

    updateProgressRing(value) {
        if (!Elements.progressCircle || !Elements.progressValue) return;
        const circle = Elements.progressCircle;
        const circumference = 2 * Math.PI * 50;

        if (typeof value === "number" && !Number.isNaN(value)) {
            const normalized = Math.max(0, Math.min(100, value));
            const offset = circumference - (normalized / 100) * circumference;
            circle.style.strokeDashoffset = offset.toString();
            Elements.progressValue.textContent = `${normalized.toFixed(0)}%`;
        } else {
            circle.style.strokeDashoffset = circumference.toString();
            Elements.progressValue.textContent = "--%";
        }
    },

    applyStatusAccent(element, status) {
        if (!element) return;
        element.className = "rounded-lg border px-2 py-0.5 text-[11px] uppercase tracking-wide";
        const accent = STATUS_ACCENTS[status];
        if (accent) {
            element.classList.add(accent.text, accent.border, accent.bg);
        } else {
            element.classList.add("text-base-subtle", "border-base-border", "bg-base-bg");
        }
    },

    showFeedback(message, type) {
        if (!Elements.feedback) return;

        Elements.feedback.textContent = message;
        Elements.feedback.className = "mt-3 text-sm opacity-100 transition-opacity duration-200";

        switch (type) {
            case "success":
                Elements.feedback.classList.add("text-brand-success");
                break;
            case "error":
                Elements.feedback.classList.add("text-brand-danger");
                break;
            default:
                Elements.feedback.classList.add("text-brand-accent");
                break;
        }

        setTimeout(() => {
            Elements.feedback.classList.remove("opacity-100");
            Elements.feedback.classList.add("opacity-0");
        }, 2200);
    },

    updateConnection(status, message) {
        AppState.connectionStatus = status;
        if (!Elements.statusIndicator || !Elements.statusText) return;

        switch (status) {
            case "connected":
                Elements.statusIndicator.textContent = "🟢";
                Elements.statusText.textContent = message ?? "已連線後端服務";
                Elements.statusText.className = "text-sm text-brand-success";
                break;
            case "connecting":
                Elements.statusIndicator.textContent = "🟡";
                Elements.statusText.textContent = message ?? "連線中...";
                Elements.statusText.className = "text-sm text-amber-500";
                break;
            default:
                Elements.statusIndicator.textContent = "🔴";
                Elements.statusText.textContent = message ?? "尚未連線";
                Elements.statusText.className = "text-sm text-brand-danger";
                break;
        }
    },

    updateLastSync(timestamp) {
        AppState.lastSyncTime = timestamp ?? Date.now();
        if (!Elements.lastSync) return;
        const formatted = AppState.lastSyncTime
            ? new Date(AppState.lastSyncTime).toLocaleString("zh-TW", { hour12: false })
            : "-";
        Elements.lastSync.textContent = `最後同步: ${formatted}`;
    },

    formatDateTime(isoString) {
        if (!isoString) return "--";
        try {
            return new Date(isoString).toLocaleString("zh-TW", {
                hour12: false,
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return isoString;
        }
    },

    formatRelativeTime(isoString) {
        if (!isoString) return "";
        try {
            const formatter = new Intl.RelativeTimeFormat("zh-TW", { numeric: "auto" });
            const now = Date.now();
            const diffMs = new Date(isoString).getTime() - now;

            const units = [
                { ms: 1000 * 60 * 60 * 24, label: "day" },
                { ms: 1000 * 60 * 60, label: "hour" },
                { ms: 1000 * 60, label: "minute" }
            ];

            for (const unit of units) {
                const value = diffMs / unit.ms;
                if (Math.abs(value) >= 1) {
                    return formatter.format(Math.round(value), unit.label);
                }
            }

            return "剛剛";
        } catch {
            return isoString;
        }
    }
};

const TaskManager = {
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

    selectTask(taskId) {
        if (!taskId || AppState.selectedTaskId === taskId) {
            AppState.selectedTaskId = null;
        } else {
            AppState.selectedTaskId = taskId;
        }
        Renderer.renderBoard();
        Renderer.renderFocusPanel();
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
        if (Elements.focusAi) {
            Elements.focusAi.classList.add("opacity-60", "pointer-events-none");
        }

        try {
            await BackendGateway.breakdownTask(task.id);
            AppState.selectedTaskId = null;
            await this.reloadTasks();
            Renderer.showFeedback("AI 拆解完成", "success");
            this.refreshStats();
        } catch (error) {
            console.error("AI 拆解失敗:", error);
            Renderer.showFeedback("AI 分析暫時無法使用,請稍後再試", "error");
        } finally {
            if (Elements.focusAi) {
                Elements.focusAi.classList.remove("opacity-60", "pointer-events-none");
            }
        }
    }
};

const ConnectionMonitor = {
    intervalMs: 30000,
    intervalId: null,

    start() {
        this.stop();
        if (!Config.hasApi()) return;
        this.checkConnectionNow();
        this.intervalId = setInterval(() => {
            this.checkConnectionNow();
        }, this.intervalMs);
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    async checkConnectionNow() {
        if (!Config.hasApi()) return false;
        try {
            await BackendGateway.ping();
            Renderer.updateConnection("connected", "已連線後端服務");
            return true;
        } catch (error) {
            console.error("連線檢查失敗:", error);
            Renderer.updateConnection("disconnected", "無法連線後端服務");
            return false;
        }
    }
};

const DragDropHandler = {
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

function bindEvents() {
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
}

function bootstrap() {
    Renderer.updateConnection("connecting", "初始化中...");
    bindEvents();
    TaskManager.initialize().catch(error => {
        console.error("初始化失敗:", error);
    });
}

document.addEventListener("DOMContentLoaded", bootstrap);
