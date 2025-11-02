/**
 * FeedbackToast - 浮動提示窗系統
 *
 * 職責：顯示臨時性的彈窗反饋（成功、錯誤、信息）
 * 依賴：IconLibrary
 *
 * @module ui/FeedbackToast
 */

"use strict";

window.FeedbackToast = {
    /**
     * 顯示反饋彈窗
     * @param {string} message - 顯示的消息
     * @param {string} type - 類型：success, error, info
     * @param {number} duration - 自動關閉時間（毫秒）
     */
    show(message, type = "info", duration = 2500) {
        const toast = document.createElement("div");
        toast.className = "fixed top-6 right-6 z-40 rounded-[20px] border-4 border-[#2D2D2D] px-6 py-4 shadow-memphis-card";

        // 根據類型設置顏色
        let bgColor = "#FFFFFF";
        let textColor = "#757575";
        let icon = "";

        switch (type) {
            case "success":
                bgColor = "#E6F9F0";
                textColor = "#26DE81";
                icon = IconLibrary.check("w-5 h-5");
                break;
            case "error":
                bgColor = "#FFE6E6";
                textColor = "#FF6B6B";
                icon = IconLibrary.xMark("w-5 h-5");
                break;
            case "info":
            default:
                bgColor = "#FFF9E6";
                textColor = "#FFA502";
                icon = IconLibrary.circle("#FFA502", "w-5 h-5");
                break;
        }

        toast.style.backgroundColor = bgColor;
        toast.style.color = textColor;

        // 構建內容：圖標 + 消息
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0">${icon}</div>
                <div class="flex-1 text-sm font-bold">${message}</div>
                <button class="ml-2 flex-shrink-0 opacity-60 hover:opacity-100" data-close>
                    ${IconLibrary.xMark("w-4 h-4")}
                </button>
            </div>
        `;

        // 設置動畫進入
        toast.style.animation = "slideInRight 0.3s ease-out";
        toast.style.position = "fixed";
        toast.style.top = "1.5rem";
        toast.style.right = "1.5rem";

        document.body.appendChild(toast);

        // 關閉按鈕
        const closeBtn = toast.querySelector("[data-close]");
        const remove = () => {
            toast.style.animation = "slideOutRight 0.3s ease-in";
            setTimeout(() => toast.remove(), 300);
        };

        closeBtn?.addEventListener("click", remove);

        // 自動關閉
        setTimeout(remove, duration);
    }
};

// 添加動畫樣式（避免重複宣告）
if (!document.getElementById("toast-animations")) {
    const toastStyle = document.createElement("style");
    toastStyle.id = "toast-animations";
    toastStyle.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(toastStyle);
}
