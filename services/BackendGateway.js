/**
 * BackendGateway - 後端 API 通訊服務
 *
 * 職責：處理所有與 Google Apps Script 後端的通訊
 * 依賴：Config, Task, AppState
 *
 * @module services/BackendGateway
 */

"use strict";

window.BackendGateway = {
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
        // ⚠️ 不使用自定義 headers 避免觸發 CORS preflight
        const options = { method: (method ?? "GET").toUpperCase() };

        if (body !== undefined) {
            // ✅ CSRF Token 防禦 - POST/PUT/DELETE 請求必須包含有效的 CSRF token
            const requestBody = body;
            if (['POST', 'PUT', 'DELETE'].includes(options.method) && AppState.csrfToken) {
                requestBody.csrf_token = AppState.csrfToken;
            }

            const form = new URLSearchParams();
            form.append("payload", JSON.stringify(requestBody));
            options.body = form.toString();
            // ✅ 使用 text/plain 避免 CORS preflight（GAS 不支持 OPTIONS）
            options.headers = { "Content-Type": "text/plain;charset=UTF-8" };
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const text = await response.text();
                const error = new Error("API_REQUEST_FAILED");
                error.status = response.status;
                error.body = text;
                console.error(`[BackendGateway] ${options.method} ${path} failed with status ${response.status}:`, text);
                throw error;
            }
            return await this._parseResponse(response, parseJson);
        } catch (fetchError) {
            // ⚠️ 網路錯誤或 CORS 問題會在這裡被捕捉
            if (fetchError.message === "API_REQUEST_FAILED") {
                throw fetchError;  // 已處理的 API 錯誤，直接拋出
            }
            // 網路級別的錯誤（CORS, 無法連接等）
            console.error(`[BackendGateway] ${options.method} ${path} network error:`, fetchError.message);
            throw new Error(`Network error calling ${path}: ${fetchError.message}`);
        }
    },

    async _parseResponse(response, parseJson = true) {
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
        // ⚠️ 使用 POST 而非 DELETE，因為 DELETE 會觸發 CORS preflight（GAS 不支持 OPTIONS）
        const data = await this.request(`/tasks/${encodeURIComponent(taskId)}/delete`, {
            method: "POST"
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
