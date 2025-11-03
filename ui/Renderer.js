/**
 * Renderer - UI 渲染器
 *
 * 職責：負責所有 UI 元素的渲染和更新
 * 依賴：AppState, STATUS_LABELS, STATUS_ACCENTS, IconLibrary, Elements, Task, DragDropHandler, TaskManager, FeedbackToast
 *
 * @module ui/Renderer
 */

"use strict";

window.Renderer = {
    renderAll() {
        this.renderBoard();
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
            // ✅ 任務排序：最新建立的在最上面（降序）
            const tasks = AppState.tasks
                .filter(task => task.status === status)
                .sort((a, b) => {
                    // 按建立時間降序：newest first
                    const dateA = new Date(a.created_at);
                    const dateB = new Date(b.created_at);
                    return dateB - dateA;  // 降序：b - a
                });

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

        // ✅ Memphis 設計更新後改為 font-bold（原為 font-semibold）
        const titleEl = node.querySelector("p.font-bold");
        const subEl = node.querySelector("p.text-xs");
        const statusLabelEl = node.querySelector(".status-label");
        const createdEl = node.querySelector(".created-at");
        const updatedEl = node.querySelector(".updated-at");
        const completedWrapper = node.querySelector(".completed-at-wrapper");
        const completedEl = node.querySelector(".completed-at");
        const breakdownButton = node.querySelector('[data-action="breakdown"]');
        const completeButton = node.querySelector('[data-action="complete"]');
        const deleteButton = node.querySelector('[data-action="delete"]');

        // ✅ 任務強度標示渲染
        titleEl.textContent = '';  // 清空

        // 如果有強度標示，先顯示 badge
        if (task.intensity && INTENSITY_ACCENTS[task.intensity]) {
            const accent = INTENSITY_ACCENTS[task.intensity];

            // 創建強度 badge 容器
            const intensityBadge = document.createElement('span');
            intensityBadge.className = `inline-flex items-center gap-1 px-2 py-0.5 rounded border-2 mr-2 font-bold text-[10px] uppercase tracking-wide ${accent.text} ${accent.border} ${accent.bg}`;
            intensityBadge.style.transform = 'rotate(-1deg)';  // Memphis 風格：輕微旋轉
            intensityBadge.title = accent.duration;  // Tooltip 顯示時間

            // 添加強度文字（emoji + label）
            const badgeText = document.createTextNode(`${accent.emoji} ${INTENSITY_LABELS[task.intensity]}`);
            intensityBadge.appendChild(badgeText);

            titleEl.appendChild(intensityBadge);
        }

        // 添加任務標題文字（已移除強度 emoji 前綴）
        const titleText = document.createTextNode(task.title);
        titleEl.appendChild(titleText);
        // ✅ Heroicons: link 圖標表示子任務來源
        // ✅ 安全修復：使用 createElement + textContent 防止 XSS
        if (task.parent_task_title) {
            // 清空現有內容
            subEl.textContent = '';

            // 建立 span 容器
            const span = document.createElement('span');
            span.className = 'inline-flex items-center gap-1';

            // 建立 icon 容器並使用 innerHTML（IconLibrary 是受控的內部函數）
            const iconContainer = document.createElement('span');
            iconContainer.innerHTML = IconLibrary.link('w-3 h-3');
            span.appendChild(iconContainer);

            // ✅ 使用 textContent 添加文本（防止 XSS）
            const textNode = document.createTextNode(`來自 ${task.parent_task_title}`);
            span.appendChild(textNode);

            subEl.appendChild(span);
        } else {
            subEl.textContent = "獨立任務";
        }
        statusLabelEl.textContent = STATUS_LABELS[task.status] ?? task.status;
        createdEl.textContent = `建立於 ${this.formatRelativeTime(task.created_at)}`;
        updatedEl.textContent = `更新於 ${this.formatRelativeTime(task.updated_at)}`;

        if (task.completed_at) {
            completedEl.textContent = `完成於 ${this.formatRelativeTime(task.completed_at)}`;
            completedWrapper.classList.remove("hidden");
        } else {
            completedWrapper.classList.add("hidden");
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

        breakdownButton.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();
            // ✅ 顯示加載狀態 - 使用 spinner 圖標而非文本
            // ✅ 安全修復：使用 createElement 取代 innerHTML
            breakdownButton.disabled = true;
            breakdownButton.textContent = '';  // 清空

            const iconSpinner = document.createElement('span');
            iconSpinner.innerHTML = IconLibrary.spinner('w-3.5 h-3.5');
            breakdownButton.appendChild(iconSpinner);

            const textSpan = document.createElement('span');
            textSpan.textContent = '分析中';
            breakdownButton.appendChild(textSpan);

            try {
                await TaskManager.requestBreakdown(task.id);
            } finally {
                breakdownButton.disabled = false;
                breakdownButton.textContent = '';  // 清空

                const iconSparkles = document.createElement('span');
                iconSparkles.innerHTML = IconLibrary.sparkles('w-3.5 h-3.5');
                breakdownButton.appendChild(iconSparkles);

                const textSpanAI = document.createElement('span');
                textSpanAI.textContent = 'AI';
                breakdownButton.appendChild(textSpanAI);
            }
        });

        completeButton.addEventListener("click", async event => {
            event.preventDefault();
            // ✅ 顯示確認對話框
            const confirmed = await ConfirmDialog.show(
                IconLibrary.check('w-6 h-6'),
                "完成任務",
                "確定要完成此任務嗎？"
            );
            if (confirmed) {
                await TaskManager.completeTask(task.id);
            }
        });

        deleteButton.addEventListener("click", async event => {
            event.preventDefault();
            // ✅ 顯示危險操作確認對話框
            const confirmed = await ConfirmDialog.show(
                IconLibrary.trash('w-6 h-6'),
                "刪除任務",
                "確定要刪除此任務嗎？此操作無法復原。",
                true  // isDangerous = true，按鈕會是紅色
            );
            if (confirmed) {
                await TaskManager.deleteTask(task.id);
            }
        });

        node.addEventListener("dragstart", event => DragDropHandler.onDragStart(event, task.id));
        node.addEventListener("dragend", DragDropHandler.onDragEnd);

        return node;
    },

    renderStats() {
        // ✅ 方案 A（極簡主義）：只顯示 3 個核心指標
        const stats = AppState.weeklyStats;

        // 動態替換模態框內容為 Memphis 設計風格
        if (!Elements.statsModal) return;

        const contentContainer = Elements.statsModal.querySelector('.mt-6');
        if (!contentContainer) return;

        // ✅ Memphis Design: 大字體 + 粗邊框 + 彩色卡片（移除旋轉效果）
        contentContainer.innerHTML = `
            <div class="space-y-6">
                <h3 class="text-lg font-bold text-center mb-6">本週動能</h3>

                <!-- 主要指標：本週完成任務 -->
                <div class="text-center p-8 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border-4 border-pink-500">
                    <p class="text-sm text-gray-600 mb-2">本週完成任務</p>
                    <p class="text-6xl font-black text-pink-600">${stats?.total_completed ?? 0}</p>
                </div>

                <!-- 次要指標：2列網格 -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="text-center p-6 bg-emerald-50 rounded-xl border-4 border-emerald-500">
                        <p class="text-xs text-gray-600 mb-1">本週建立</p>
                        <p class="text-3xl font-bold text-emerald-700">${stats?.total_created ?? 0}</p>
                    </div>

                    <div class="text-center p-6 bg-amber-50 rounded-xl border-4 border-amber-500">
                        <p class="text-xs text-gray-600 mb-1">待完成</p>
                        <p class="text-3xl font-bold text-amber-700">${stats?.total_pending ?? 0}</p>
                    </div>
                </div>
            </div>
        `;
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
        // ✅ 使用彈窗通知系統而非靜態文本
        // 用戶無論在頁面哪個位置都能清楚看到反饋消息
        FeedbackToast.show(message, type, 2500);
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
