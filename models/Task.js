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
};
