/**
 * ConfirmDialog - 確認對話框系統
 *
 * 職責：提供統一的確認對話框 UI 和互動
 * 依賴：Elements, IconLibrary
 *
 * @module ui/ConfirmDialog
 */

"use strict";

window.ConfirmDialog = {
    /**
     * 顯示確認對話框
     * @param {string} icon - Heroicons SVG（來自 IconLibrary）
     * @param {string} title - 對話框標題
     * @param {string} message - 對話框內容
     * @param {boolean} isDangerous - 是否為危險操作（影響按鈕顏色）
     * @returns {Promise<boolean>} true 表示確認，false 表示取消
     */
    show(icon, title, message, isDangerous = false) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
            overlay.style.animation = "fadeIn 0.2s ease-out";

            const dialog = document.createElement("div");
            dialog.className = "rounded-[25px] border-4 border-[#2D2D2D] bg-white p-6 max-w-sm";
            dialog.style.animation = "slideUp 0.3s ease-out";

            // 圖標和標題
            const headerDiv = document.createElement("div");
            headerDiv.className = "flex items-center gap-3 mb-4";

            const iconDiv = document.createElement("div");
            iconDiv.className = "text-2xl";
            iconDiv.innerHTML = icon;

            const titleEl = document.createElement("h2");
            titleEl.className = "text-xl font-bold text-[#2D2D2D]";
            titleEl.textContent = title;

            headerDiv.appendChild(iconDiv);
            headerDiv.appendChild(titleEl);

            // 訊息
            const messageEl = document.createElement("p");
            messageEl.className = "text-sm text-[#757575] mb-6 leading-relaxed";
            messageEl.textContent = message;

            // 按鈕容器
            const buttonsDiv = document.createElement("div");
            buttonsDiv.className = "flex gap-3 justify-end";

            // 取消按鈕
            const cancelBtn = document.createElement("button");
            cancelBtn.className = "px-4 py-2 rounded-xl border-3 border-[#2D2D2D] bg-[#757575] text-white font-bold transition";
            cancelBtn.textContent = "取消";
            cancelBtn.onclick = () => {
                overlay.style.animation = "fadeOut 0.2s ease-out";
                setTimeout(() => overlay.remove(), 200);
                resolve(false);
            };

            // 確認按鈕（根據是否為危險操作改變顏色）
            const confirmBtn = document.createElement("button");
            const confirmColor = isDangerous ? "#FF6B6B" : "#26DE81";
            confirmBtn.className = "px-4 py-2 rounded-xl border-3 border-[#2D2D2D] text-white font-bold transition";
            confirmBtn.style.backgroundColor = confirmColor;
            confirmBtn.textContent = "確認";
            confirmBtn.onclick = () => {
                overlay.style.animation = "fadeOut 0.2s ease-out";
                setTimeout(() => overlay.remove(), 200);
                resolve(true);
            };

            // ESC 键取消
            const handleEsc = (e) => {
                if (e.key === "Escape") {
                    document.removeEventListener("keydown", handleEsc);
                    cancelBtn.click();
                }
            };
            document.addEventListener("keydown", handleEsc);

            buttonsDiv.appendChild(cancelBtn);
            buttonsDiv.appendChild(confirmBtn);

            dialog.appendChild(headerDiv);
            dialog.appendChild(messageEl);
            dialog.appendChild(buttonsDiv);

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // 自動聚焦確認按鈕
            confirmBtn.focus();
        });
    }
};

// 添加動畫樣式（避免重複宣告）
if (!document.getElementById("dialog-animations")) {
    const dialogStyle = document.createElement("style");
    dialogStyle.id = "dialog-animations";
    dialogStyle.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }

        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(dialogStyle);
}
