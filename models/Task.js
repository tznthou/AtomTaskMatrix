/**
 * Task - 任務資料模型
 *
 * 職責：定義任務物件的結構和方法
 * 依賴：無
 *
 * @module models/Task
 */

"use strict";

window.Task = class Task {
    constructor({
        id = Task.generateId(),
        title,
        status = "uncategorized",
        parentTaskId = null,
        parentTaskTitle = null,
        createdAt = new Date().toISOString(),
        updatedAt = createdAt,
        completedAt = null,
        intensity = null  // ✅ 新增：任務強度（'S'/'M'/'L' 或 null）
    }) {
        this.id = id;

        // ✅ 解析 title 中的強度前綴
        const parsed = Task.parseIntensity(title);
        this.title = parsed.cleanTitle;
        this.intensity = intensity ?? parsed.intensity;  // 優先使用傳入值

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

    /**
     * 從任務標題中解析強度標示 emoji
     * @param {string} title - 任務標題（可能含前綴）
     * @returns {{intensity: string|null, cleanTitle: string}}
     */
    static parseIntensity(title) {
        if (!title) return { intensity: null, cleanTitle: '' };

        const str = String(title).trim();

        // 支援的強度 emoji: 🌱 (S), ⚡ (M), 🚀 (L)
        const intensityMap = {
            '🌱': 'S',  // Initiation (≤2 min)
            '⚡': 'M',  // Short (5-10 min)
            '🚀': 'L'   // Sustained (15-30 min)
        };

        // 檢查 title 是否以強度 emoji 開頭
        for (const [emoji, code] of Object.entries(intensityMap)) {
            if (str.startsWith(emoji)) {
                return {
                    intensity: code,
                    cleanTitle: str.slice(emoji.length).trim()
                };
            }
        }

        // 向後兼容：無前綴時返回 null
        return {
            intensity: null,
            cleanTitle: str
        };
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
            completedAt: overrides.completed_at ?? overrides.completedAt ?? this.completed_at,
            intensity: overrides.intensity ?? this.intensity  // ✅ 處理 intensity
        });
    }
};
