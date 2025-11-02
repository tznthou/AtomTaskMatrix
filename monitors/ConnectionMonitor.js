/**
 * ConnectionMonitor - 連線監控器
 *
 * 職責：定期檢查與後端的連線狀態
 * 依賴：Config, BackendGateway, Renderer
 *
 * @module monitors/ConnectionMonitor
 */

"use strict";

window.ConnectionMonitor = {
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
