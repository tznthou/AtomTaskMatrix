/**
 * Renderer - UI 渲染器
 *
 * 職責：負責所有 UI 元素的渲染和更新
 * 依賴：AppState, STATUS_LABELS, STATUS_ACCENTS, IconLibrary, Elements, Task, DragDropHandler, TaskManager
 *
 * @module ui/Renderer
 */

"use strict";

window.Renderer = {
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
        const breakdownButton = node.querySelector('[data-action="breakdown"]');
        const completeButton = node.querySelector('[data-action="complete"]');
        const deleteButton = node.querySelector('[data-action="delete"]');

        titleEl.textContent = task.title;
        // ✅ Heroicons: link 圖標表示子任務來源
        if (task.parent_task_title) {
            subEl.innerHTML = `<span class="inline-flex items-center gap-1">${IconLibrary.link('w-3 h-3')}來自 ${task.parent_task_title}</span>`;
        } else {
            subEl.textContent = "獨立任務";
        }
        statusLabelEl.textContent = STATUS_LABELS[task.status] ?? task.status;
        createdEl.textContent = this.formatRelativeTime(task.created_at);

        if (AppState.selectedTaskId === task.id) {
            node.classList.add("ring-2", "ring-brand-primary/60");
        }

        if (task.status === "completed") {
            node.classList.add("opacity-60");
            node.draggable = false;
            completeButton.classList.add("hidden");
            breakdownButton.disabled = true;
            breakdownButton.classList.add("opacity-50", "cursor-not-allowed");
        } else {
            node.draggable = true;
            completeButton.classList.remove("hidden");
            breakdownButton.disabled = false;
            breakdownButton.classList.remove("opacity-50", "cursor-not-allowed");
        }

        focusButton.addEventListener("click", event => {
            event.preventDefault();
            TaskManager.selectTask(task.id);
        });

        breakdownButton.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            TaskManager.requestBreakdown(task.id);
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
        // ✅ Heroicons: link 圖標表示子任務來源
        if (task.parent_task_title) {
            Elements.focusMeta.innerHTML = `<span class="inline-flex items-center gap-1">${IconLibrary.link('w-3 h-3')}來自 ${task.parent_task_title}</span>`;
        } else {
            Elements.focusMeta.textContent = "獨立任務";
        }

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
                // ✅ Heroicons: 綠色圓形表示已連線
                Elements.statusIndicator.innerHTML = IconLibrary.circle('#22C55E', 'w-4 h-4 inline-block');
                Elements.statusText.textContent = message ?? "已連線後端服務";
                Elements.statusText.className = "text-sm text-brand-success";
                break;
            case "connecting":
                // ⏳ Heroicons: 琥珀色圓形表示連線中
                Elements.statusIndicator.innerHTML = IconLibrary.circle('#F59E0B', 'w-4 h-4 inline-block');
                Elements.statusText.textContent = message ?? "連線中...";
                Elements.statusText.className = "text-sm text-amber-500";
                break;
            default:
                // ❌ Heroicons: 紅色圓形表示未連線
                Elements.statusIndicator.innerHTML = IconLibrary.circle('#EF4444', 'w-4 h-4 inline-block');
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
