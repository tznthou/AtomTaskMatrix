/**
 * Config - API 配置管理
 *
 * 職責：提供 API 配置存取介面
 * 依賴：window.CONFIG（來自 config.js）
 *
 * @module core/config
 */

"use strict";

window.Config = {
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
